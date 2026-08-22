const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = require("../../config/db");

const register = async ({ name, email, phone, password, role }) => {

    const existingUser = await prisma.users.findUnique({
        where: {
            email
        }
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
        data: {
            name,
            email,
            phone,
            password_hash: passwordHash,
            role,
            status: "ACTIVE"
        }
    });

    return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
    };
};


const login = async ({ email, password }) => {

    const user = await prisma.users.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
        {
            userId: user.id.toString(),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        user: {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        },
        token
    };
};


module.exports = {
    register,
    login
};