const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const CompanySupplier = require('../models/CompanySupplier');
const logAudit = require('../utils/logger');

// @desc    Get all users (within same company, including linked suppliers)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query conditions
    const conditions = [];

    if (role === 'supplier') {
      // Find suppliers linked to this company via CompanySupplier
      const links = await CompanySupplier.find({ company: req.user.company, status: 'active' });
      const supplierIds = links.map((l) => l.supplier);
      conditions.push({ _id: { $in: supplierIds }, role: 'supplier' });
    } else if (role) {
      // Specific non-supplier role
      conditions.push({ company: req.user.company, role });
    } else {
      // No role filter — show all: regular users + linked suppliers
      const links = await CompanySupplier.find({ company: req.user.company, status: 'active' });
      const supplierIds = links.map((l) => l.supplier);
      conditions.push({
        $or: [
          { company: req.user.company },
          { _id: { $in: supplierIds }, role: 'supplier' },
        ],
      });
    }

    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user (within same company or linked supplier)
const getUser = async (req, res, next) => {
  try {
    let user = await User.findOne({ _id: req.params.id, company: req.user.company });

    // If not found, check if it's a linked supplier
    if (!user) {
      const link = await CompanySupplier.findOne({
        company: req.user.company,
        supplier: req.params.id,
        status: 'active',
      });
      if (link) {
        user = await User.findOne({ _id: req.params.id, role: 'supplier' });
      }
    }

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user within the admin's company
//          For suppliers: links existing account or creates new one
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });

    // ─── Supplier: link-or-create flow ───
    if (role === 'supplier') {
      if (existing) {
        // If already a supplier, just link to this company
        if (existing.role === 'supplier') {
          const existingLink = await CompanySupplier.findOne({
            company: req.user.company,
            supplier: existing._id,
          });

          if (existingLink) {
            if (existingLink.status === 'active') {
              res.status(400);
              throw new Error('This supplier is already linked to your company');
            }
            // Reactivate inactive link
            existingLink.status = 'active';
            await existingLink.save();
          } else {
            await CompanySupplier.create({
              company: req.user.company,
              supplier: existing._id,
            });
          }

          logAudit(req.user._id, 'CREATE', 'User', existing._id, `Linked existing supplier "${existing.name}" to company`, req.user.company);

          return res.status(201).json({
            success: true,
            data: {
              _id: existing._id,
              name: existing.name,
              email: existing.email,
              role: existing.role,
              isActive: existing.isActive,
              createdAt: existing.createdAt,
            },
            message: `Supplier "${existing.name}" has been linked to your company.`,
          });
        }

        // Email exists but not as a supplier
        res.status(400);
        throw new Error('A user with this email already exists with a different role');
      }

      // Create brand new supplier (no company on User, linked via CompanySupplier)
      const firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false,
      });

      const user = await User.create({
        name,
        email,
        role: 'supplier',
        firebaseUid: firebaseUser.uid,
        // company intentionally omitted — suppliers use CompanySupplier
      });

      await CompanySupplier.create({
        company: req.user.company,
        supplier: user._id,
      });

      logAudit(req.user._id, 'CREATE', 'User', user._id, `Created supplier account for "${name}" and linked to company`, req.user.company);

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        message: `Supplier created! Tell them to log in at invexis.com to receive their verification email.`,
      });
    }

    // ─── Non-supplier: original flow ───
    if (existing) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }

    // 1. Create user in Firebase (Unverified)
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // 2. Create user in MongoDB under the admin's company
    const user = await User.create({
      name,
      email,
      role,
      firebaseUid: firebaseUser.uid,
      company: req.user.company,
    });

    logAudit(req.user._id, 'CREATE', 'User', user._id, `Created ${role} account for "${name}"`, req.user.company);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      message: `User created! Tell them to log in at invexis.com to receive their verification email.`,
    });
  } catch (error) {
    if (error.message !== 'A user with this email already exists' &&
        error.message !== 'This supplier is already linked to your company' &&
        error.message !== 'A user with this email already exists with a different role') {
      try {
        const fbUser = await admin.auth().getUserByEmail(req.body.email);
        if (fbUser) await admin.auth().deleteUser(fbUser.uid);
      } catch { /* ignore cleanup errors */ }
    }
    next(error);
  }
};

// @desc    Update user (within same company or linked supplier)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, password } = req.body;

    let user = await User.findOne({ _id: req.params.id, company: req.user.company });

    // Check linked suppliers
    if (!user) {
      const link = await CompanySupplier.findOne({
        company: req.user.company,
        supplier: req.params.id,
        status: 'active',
      });
      if (link) {
        user = await User.findOne({ _id: req.params.id, role: 'supplier' });
      }
    }

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.user._id.toString() === user._id.toString() && isActive === false) {
      res.status(400);
      throw new Error('You cannot deactivate your own account');
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error('A user with this email already exists');
      }
    }

    const fbUpdate = {};
    if (name) fbUpdate.displayName = name;
    if (email && email !== user.email) fbUpdate.email = email;
    if (password) fbUpdate.password = password;
    if (typeof isActive === 'boolean') fbUpdate.disabled = !isActive;

    if (Object.keys(fbUpdate).length > 0 && user.firebaseUid) {
      await admin.auth().updateUser(user.firebaseUid, fbUpdate);
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && user.role !== 'supplier') user.role = role; // Don't change supplier role
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    logAudit(req.user._id, 'UPDATE', 'User', user._id, `Updated user "${user.name}"`, req.user.company);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (within same company) or unlink supplier
const deleteUser = async (req, res, next) => {
  try {
    // Check if it's a linked supplier first
    const supplierLink = await CompanySupplier.findOne({
      company: req.user.company,
      supplier: req.params.id,
    });

    if (supplierLink) {
      // It's a supplier — unlink from this company instead of deleting
      const supplier = await User.findById(req.params.id);
      if (!supplier) {
        res.status(404);
        throw new Error('Supplier not found');
      }

      await supplierLink.deleteOne();

      // Check if supplier has any remaining company links
      const remainingLinks = await CompanySupplier.countDocuments({ supplier: req.params.id });

      logAudit(req.user._id, 'DELETE', 'User', req.params.id, `Unlinked supplier "${supplier.name}" from company`, req.user.company);

      // If no more links, optionally delete the supplier entirely
      if (remainingLinks === 0) {
        if (supplier.firebaseUid) {
          try { await admin.auth().deleteUser(supplier.firebaseUid); } catch { /* ignore */ }
        }
        await supplier.deleteOne();
        return res.json({
          success: true,
          data: {},
          message: `Supplier "${supplier.name}" has been fully deleted (no other companies linked).`,
        });
      }

      return res.json({
        success: true,
        data: {},
        message: `Supplier "${supplier.name}" has been unlinked from your company.`,
      });
    }

    // Non-supplier: original delete flow
    const user = await User.findOne({ _id: req.params.id, company: req.user.company });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.user._id.toString() === user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own account');
    }

    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch { /* ignore */ }
    }

    const userName = user.name;
    await user.deleteOne();
    logAudit(req.user._id, 'DELETE', 'User', req.params.id, `Deleted user "${userName}"`, req.user.company);
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
