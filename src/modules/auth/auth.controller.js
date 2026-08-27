/* ─────────────────────────────────────────────────────────────────────────
   src/modules/auth/auth.controller.js
───────────────────────────────────────────────────────────────────────── */
const authService = require("./auth.service");

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({ success: true, message: "Registered successfully", data: result });
    } catch (err) { next(err); }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({ success: true, message: "Login successful", data: result });
    } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user.userId);
        res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
    try {
        const result = await authService.changePassword(req.user.userId, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
};


const adminRegister = async (req, res, next) => {
    try {
        const result = await authService.adminRegister(req.body);

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

const adminLogin = async (req, res, next) => {
    try {
        const result = await authService.adminLogin(req.body);

        res.status(200).json({
            success: true,
            message: "Admin login successful",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};
module.exports = {
    register,
    login,
    adminRegister,
    adminLogin,
    getProfile,
    changePassword,
};