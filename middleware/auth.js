const jwt = require('jsonwebtoken');

function authenticateAdmin(req, res, next) {
  const token = req.cookies?.admin_token;
  
  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.clearCookie('admin_token');
    return res.redirect('/admin/login');
  }
}

function generateToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { authenticateAdmin, generateToken };
