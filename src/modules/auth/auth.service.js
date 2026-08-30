/* ─────────────────────────────────────────────────────────────────────────
   src/modules/auth/auth.service.js

   register / login / adminRegister / adminLogin /
   getProfile / changePassword

   Supported database roles:
   GUEST
   OWNER
   STAFF
   PLATFORM_ADMIN
───────────────────────────────────────────────────────────────────────── */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/db");

/* ─────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────── */

const SALT_ROUNDS = 10;
const ADMIN_ROLE = "PLATFORM_ADMIN";

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────── */

const signToken = (user) => {
    return jwt.sign(
        {
            userId: user.id.toString(),
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id
                ? user.tenant_id.toString()
                : null,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

const formatUser = (user) => {
    return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        status: user.status,
        tenantId: user.tenant_id
            ? user.tenant_id.toString()
            : null,
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   REGISTER
   Normal user registration
───────────────────────────────────────────────────────────────────────── */

const register = async ({
    name,
    email,
    phone,
    password,
    tenantId,
}) => {
    const existing = await prisma.users.findUnique({
        where: {
            email,
        },
    });

    if (existing) {
        const err = new Error("Email already registered");
        err.status = 409;
        err.code = "EMAIL_EXISTS";
        throw err;
    }

    const passwordHash = await bcrypt.hash(
        password,
        SALT_ROUNDS
    );

    const user = await prisma.users.create({
        data: {
            name,
            email,
            phone: phone || null,
            password_hash: passwordHash,

            role: "GUEST",

            status: "ACTIVE",

            tenant_id: tenantId
                ? BigInt(tenantId)
                : null,
        },
    });

    return {
        user: formatUser(user),
        token: signToken(user),
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   LOGIN
   Normal user login
───────────────────────────────────────────────────────────────────────── */

const login = async ({
    email,
    password,
}) => {
    const user = await prisma.users.findUnique({
        where: {
            email,
        },
    });

    const isValid =
        user && user.password_hash
            ? await bcrypt.compare(
                  password,
                  user.password_hash
              )
            : false;

    if (!user || !isValid) {
        const err = new Error(
            "Invalid email or password"
        );

        err.status = 401;
        err.code = "INVALID_CREDENTIALS";

        throw err;
    }

    if (user.status !== "ACTIVE") {
        const err = new Error(
            "Account is suspended. Contact support."
        );

        err.status = 403;
        err.code = "ACCOUNT_SUSPENDED";

        throw err;
    }

    return {
        user: formatUser(user),
        token: signToken(user),
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   ADMIN REGISTER
   Creates a PLATFORM_ADMIN user

   IMPORTANT:
   Database constraint allows:
   GUEST
   OWNER
   STAFF
   PLATFORM_ADMIN

   Therefore DO NOT use "ADMIN".
───────────────────────────────────────────────────────────────────────── */

const adminRegister = async ({
    name,
    email,
    phone,
    password,
}) => {
    const adminAlreadyExists = await prisma.users.findFirst({
        where: { role: ADMIN_ROLE },
        select: { id: true },
    });
    if (adminAlreadyExists) {
        const err = new Error("Platform admin creation is restricted to authenticated platform administration");
        err.status = 403;
        err.code = "ADMIN_BOOTSTRAP_COMPLETE";
        throw err;
    }
    const existing = await prisma.users.findUnique({
        where: {
            email,
        },
    });

    if (existing) {
        const err = new Error(
            "Email already registered"
        );

        err.status = 409;
        err.code = "EMAIL_EXISTS";

        throw err;
    }

    const passwordHash = await bcrypt.hash(
        password,
        SALT_ROUNDS
    );

    const admin = await prisma.users.create({
        data: {
            name,
            email,
            phone: phone || null,
            password_hash: passwordHash,

            /*
             * IMPORTANT FIX
             *
             * PostgreSQL chk_users_role does NOT allow "ADMIN".
             * It allows "PLATFORM_ADMIN".
             */
            role: ADMIN_ROLE,

            status: "ACTIVE",

            /*
             * Platform admin is not attached
             * to a tenant.
             */
            tenant_id: null,
        },
    });

    return {
        user: formatUser(admin),
        token: signToken(admin),
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   ADMIN LOGIN
   Only PLATFORM_ADMIN users can login here
───────────────────────────────────────────────────────────────────────── */

const adminLogin = async ({
    email,
    password,
}) => {
    const user = await prisma.users.findUnique({
        where: {
            email,
        },
    });

    /*
     * Only PLATFORM_ADMIN can use admin login.
     */
    if (
        !user ||
        user.role !== ADMIN_ROLE ||
        !user.password_hash
    ) {
        const err = new Error(
            "Invalid admin email or password"
        );

        err.status = 401;
        err.code = "INVALID_ADMIN_CREDENTIALS";

        throw err;
    }

    const isValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isValid) {
        const err = new Error(
            "Invalid admin email or password"
        );

        err.status = 401;
        err.code = "INVALID_ADMIN_CREDENTIALS";

        throw err;
    }

    if (user.status !== "ACTIVE") {
        const err = new Error(
            "Admin account is suspended. Contact support."
        );

        err.status = 403;
        err.code = "ACCOUNT_SUSPENDED";

        throw err;
    }

    return {
        user: formatUser(user),
        token: signToken(user),
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   GET PROFILE
───────────────────────────────────────────────────────────────────────── */

const getProfile = async (userId) => {
    const user = await prisma.users.findUnique({
        where: {
            id: BigInt(userId),
        },
    });

    if (!user) {
        const err = new Error(
            "User not found"
        );

        err.status = 404;
        err.code = "NOT_FOUND";

        throw err;
    }

    return formatUser(user);
};

/* ─────────────────────────────────────────────────────────────────────────
   CHANGE PASSWORD
───────────────────────────────────────────────────────────────────────── */

const changePassword = async (
    userId,
    {
        oldPassword,
        newPassword,
    }
) => {
    const user = await prisma.users.findUnique({
        where: {
            id: BigInt(userId),
        },
    });

    if (!user || !user.password_hash) {
        const err = new Error(
            "User not found"
        );

        err.status = 404;
        err.code = "NOT_FOUND";

        throw err;
    }

    const isValid = await bcrypt.compare(
        oldPassword,
        user.password_hash
    );

    if (!isValid) {
        const err = new Error(
            "Old password is incorrect"
        );

        err.status = 400;
        err.code = "INVALID_OLD_PASSWORD";

        throw err;
    }

    const newHash = await bcrypt.hash(
        newPassword,
        SALT_ROUNDS
    );

    await prisma.users.update({
        where: {
            id: BigInt(userId),
        },

        data: {
            password_hash: newHash,
            updated_at: new Date(),
        },
    });

    return {
        message:
            "Password changed successfully",
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────────────────────────────────── */

module.exports = {
    register,
    login,
    adminRegister,
    adminLogin,
    getProfile,
    changePassword,
};
