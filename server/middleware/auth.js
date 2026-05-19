const admin = require('../config/firebaseAdmin');
const User = require('../models/User');

// Protect routes — verify Firebase ID token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify Firebase ID token
      const decoded = await admin.auth().verifyIdToken(token);

      // Find user in MongoDB by Firebase UID
      req.user = await User.findOne({ firebaseUid: decoded.uid });

      if (!req.user) {
        res.status(401);
        throw new Error('User not found in database');
      }

      if (!req.user.isActive) {
        res.status(401);
        throw new Error('Account has been deactivated');
      }

      next();
    } catch (error) {
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Role '${req.user.role}' is not authorized to access this route`)
      );
    }
    next();
  };
};

// Block super_admin from accessing company-internal routes
const blockSuperAdmin = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    res.status(403);
    return next(
      new Error('Super Admin cannot access company-internal data')
    );
  }
  next();
};

// Resolve active company for suppliers (they can be linked to multiple companies)
const resolveSupplierCompany = async (req, res, next) => {
  if (req.user.role !== 'supplier') {
    return next(); // Non-suppliers already have req.user.company set
  }

  const companyId = req.headers['x-active-company'];
  if (!companyId) {
    res.status(400);
    return next(new Error('Please select a company to continue'));
  }

  try {
    const CompanySupplier = require('../models/CompanySupplier');
    const link = await CompanySupplier.findOne({
      company: companyId,
      supplier: req.user._id,
      status: 'active',
    });

    if (!link) {
      res.status(403);
      return next(new Error('You are not linked to this company'));
    }

    // Set company on the user object for downstream controllers
    req.user.company = link.company;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, authorize, blockSuperAdmin, resolveSupplierCompany };
