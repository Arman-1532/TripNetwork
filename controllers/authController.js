

const {createUser, authenticateUser, findUserById} = require('../models/index');
const jwt = require('jsonwebtoken');


const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

const register = async (req, res) => {
    try {
        const userData = req.body;
        const user = await createUser(userData);
        const token = generateToken(user);

        let message = 'Registration successful';

        res.status(201).json({
            success: true,
            message,
            data: { user, token }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await authenticateUser(email, password);
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user, token }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await findUserById(req.user.id);

        // if (!user) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'User not found'
        //     });
        // }

        const { password, ...sanitized } = user;
        res.status(200).json({
            success: true,
            data: { user: sanitized }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user profile'
        });
    }
};

module.exports = { register, login, getCurrentUser };
