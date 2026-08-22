const authService = require("./auth.service");

const register = async (req, res) => {
    try {
        const user = await authService.register(req.body);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });
    } catch (error) {
        console.error("Register error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const result = await authService.login(req.body);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login
};