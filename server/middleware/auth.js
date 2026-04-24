const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from cookies, fallback to header or query param
    const token = req.cookies?.token || req.header('x-auth-token') || req.query.token;

    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'Pas de token, autorisation refusée' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token non valide' });
    }
};
