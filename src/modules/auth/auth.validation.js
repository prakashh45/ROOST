const VALID_ROLES = ["GUEST", "OWNER", "STAFF", "PLATFORM_ADMIN"];

const register = async ({ name, email, phone, password, role }) => {
    const finalRole = role || "GUEST";

    if (!VALID_ROLES.includes(finalRole)) {
        throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
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
            role: finalRole,
            status: "ACTIVE",
        },
    });

    return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
    };
};