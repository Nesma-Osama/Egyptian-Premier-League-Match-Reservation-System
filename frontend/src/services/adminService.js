import axios from 'axios';

const API_URL = 'http://localhost:3001/api/admin';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Admin Service
const adminService = {
    // Get pending users
    getPendingUsers: async () => {
        try {
            const response = await api.get('/users/pending');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to get pending users' };
        }
    },

    // Get all users
    getAllUsers: async () => {
        try {
            const response = await api.get('/users');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to get users' };
        }
    },

    // Approve user
    approveUser: async (userId) => {
        try {
            const response = await api.put(`/users/${userId}/approve`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to approve user' };
        }
    },

    // Reject user
    rejectUser: async (userId) => {
        try {
            const response = await api.delete(`/users/${userId}/reject`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to reject user' };
        }
    },

    // Delete existing user
    deleteUser: async (userId) => {
        try {
            const response = await api.delete(`/users/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete user' };
        }
    },

    // Get dashboard stats
    getStats: async () => {
        try {
            const response = await api.get('/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to get stats' };
        }
    }
};

export default adminService;
