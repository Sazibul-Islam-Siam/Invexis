const Company = require('../models/Company');
const User = require('../models/User');
const CompanySupplier = require('../models/CompanySupplier');
const admin = require('../config/firebaseAdmin');
const logAudit = require('../utils/logger');

// @desc    Get platform-level stats (total companies, users, etc.)
// @route   GET /api/super-admin/stats
// @access  Private (super_admin only)
const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      Company.countDocuments({ isActive: false }),
      User.countDocuments({ role: { $ne: 'super_admin' } }),
      User.countDocuments({ role: { $ne: 'super_admin' }, isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        inactiveCompanies,
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all companies with owner info and user count
// @route   GET /api/super-admin/companies
// @access  Private (super_admin only)
const getCompanies = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [companies, total] = await Promise.all([
      Company.find(query)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Company.countDocuments(query),
    ]);

    // Get user counts for each company (non-supplier users)
    const companyIds = companies.map((c) => c._id);
    const userCounts = await User.aggregate([
      { $match: { company: { $in: companyIds }, role: { $ne: 'super_admin' } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
    ]);

    // Get linked supplier counts per company
    const supplierCounts = await CompanySupplier.aggregate([
      { $match: { company: { $in: companyIds } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    userCounts.forEach((uc) => {
      countMap[uc._id.toString()] = (countMap[uc._id.toString()] || 0) + uc.count;
    });
    supplierCounts.forEach((sc) => {
      countMap[sc._id.toString()] = (countMap[sc._id.toString()] || 0) + sc.count;
    });

    const data = companies.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      isActive: c.isActive,
      owner: c.owner
        ? { name: c.owner.name, email: c.owner.email }
        : null,
      userCount: countMap[c._id.toString()] || 0,
      createdAt: c.createdAt,
    }));

    res.json({
      success: true,
      count: data.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle company active status (activate / deactivate)
// @route   PUT /api/super-admin/companies/:id/toggle-status
// @access  Private (super_admin only)
const toggleCompanyStatus = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

    company.isActive = !company.isActive;
    await company.save();

    // Also toggle all non-supplier users in this company
    await User.updateMany(
      { company: company._id },
      { isActive: company.isActive }
    );

    // Toggle Firebase accounts for non-supplier users
    const companyUsers = await User.find({ company: company._id });
    for (const u of companyUsers) {
      if (u.firebaseUid) {
        try {
          await admin.auth().updateUser(u.firebaseUid, { disabled: !company.isActive });
        } catch { /* ignore individual failures */ }
      }
    }

    // Also toggle linked suppliers via CompanySupplier
    const supplierLinks = await CompanySupplier.find({ company: company._id });
    for (const link of supplierLinks) {
      link.status = company.isActive ? 'active' : 'inactive';
      await link.save();
    }

    logAudit(
      req.user._id,
      'STATUS_CHANGE',
      'Company',
      company._id,
      `Super Admin ${company.isActive ? 'activated' : 'deactivated'} company "${company.name}"`,
      null
    );

    res.json({
      success: true,
      message: `Company "${company.name}" has been ${company.isActive ? 'activated' : 'deactivated'}`,
      data: {
        _id: company._id,
        name: company.name,
        isActive: company.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a company and all its users
// @route   DELETE /api/super-admin/companies/:id
// @access  Private (super_admin only)
const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

    // Delete all Firebase accounts for non-supplier users in this company
    const companyUsers = await User.find({ company: company._id });
    for (const u of companyUsers) {
      if (u.firebaseUid) {
        try {
          await admin.auth().deleteUser(u.firebaseUid);
        } catch { /* ignore */ }
      }
    }

    // Delete all non-supplier users in this company from MongoDB
    await User.deleteMany({ company: company._id });

    // Remove all CompanySupplier links for this company
    const supplierLinks = await CompanySupplier.find({ company: company._id });
    await CompanySupplier.deleteMany({ company: company._id });

    // Clean up orphaned suppliers (no remaining company links)
    for (const link of supplierLinks) {
      const remaining = await CompanySupplier.countDocuments({ supplier: link.supplier });
      if (remaining === 0) {
        const supplier = await User.findById(link.supplier);
        if (supplier?.firebaseUid) {
          try { await admin.auth().deleteUser(supplier.firebaseUid); } catch { /* ignore */ }
        }
        if (supplier) await supplier.deleteOne();
      }
    }

    const companyName = company.name;
    await company.deleteOne();

    logAudit(
      req.user._id,
      'DELETE',
      'Company',
      req.params.id,
      `Super Admin deleted company "${companyName}" and ${companyUsers.length} user(s)`,
      null
    );

    res.json({
      success: true,
      message: `Company "${companyName}" and all its users have been deleted`,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getCompanies,
  toggleCompanyStatus,
  deleteCompany,
};
