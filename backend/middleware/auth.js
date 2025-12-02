const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token, authorization denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin only.' 
        });
    }
    next();
};

// Middleware to check if user is manager
const isManager = (req, res, next) => {
    if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Manager or Admin only.' 
        });
    }
    next();
};

// Middleware to check if user is authorized
const isAuthorized = (req, res, next) => {
    if (!req.user.isAuthorized) {
        return res.status(403).json({ 
            success: false, 
            message: 'Your account is not authorized yet. Please wait for approval.' 
        });
    }
    next();
};

module.exports = { authMiddleware, isAdmin, isManager, isAuthorized };
