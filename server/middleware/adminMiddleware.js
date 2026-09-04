const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin" && req.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      message: "Admin or Owner access authority required",
    });
  }

  next();
};

export default adminOnly;