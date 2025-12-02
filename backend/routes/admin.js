const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// @route   GET /api/admin/users/pending
// @desc    Get all pending users (waiting for approval)
// @access  Private/Admin
router.get('/users/pending', authMiddleware, isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ 
            isAuthorized: false
        }).select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: pendingUsers.length,
            users: pendingUsers
        });
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve a user
// @access  Private/Admin
router.put('/users/:id/approve', authMiddleware, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        user.isAuthorized = true;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.username} has been approved`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isAuthorized: user.isAuthorized
            }
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// @route   PUT /api/admin/users/:id/reject
// @desc    Reject/Delete a user
// @access  Private/Admin
router.delete('/users/:id/reject', authMiddleware, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.role === 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot delete admin users' 
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `User ${user.username} has been rejected and removed`
        });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Remove an existing user account
// @access  Private/Admin
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.role === 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot delete admin users' 
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `User ${user.username} has been removed successfully`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const pendingUsers = await User.countDocuments({ isAuthorized: false });
        const managers = await User.countDocuments({ role: 'Manager' });
        const fans = await User.countDocuments({ role: 'Fan' });

        res.json({
            success: true,
            stats: {
                totalUsers,
                pendingUsers,
                managers,
                fans
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

module.exports = router;
