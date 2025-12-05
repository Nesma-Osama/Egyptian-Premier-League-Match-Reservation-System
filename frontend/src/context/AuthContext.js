import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on component mount
        const storedUser = authService.getStoredUser();
        if (storedUser) {
            console.log(storedUser)
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            setUser(response.user);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            setUser(response.user);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    // Update user data (for profile updates)
    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
        // Also update in localStorage if authService stores it there
        const token = localStorage.getItem('token');
        if (token) {
            localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
    };

    const value = {
        user,
        setUser: updateUser, // Expose setUser for profile updates
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};