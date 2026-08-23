/* ─────────────────────────────────────────────────────────────────────────
   src/config/env.js — Validated environment configuration
   All env vars in ONE place. App reads from this, never from process.env directly.
───────────────────────────────────────────────────────────────────────── */
require("dotenv").config();

const required = (key) => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env var: ${key}`);
    return value;
};

const env = {
    port:      parseInt(process.env.PORT || "5000"),
    nodeEnv:   process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",

    database: {
        url: required("DATABASE_URL"),
    },

    jwt: {
        secret:    process.env.JWT_SECRET || "roost-dev-secret-change-in-production",
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },

    whatsapp: {
        token:      process.env.WHATSAPP_TOKEN      || null,
        phoneId:    process.env.WHATSAPP_PHONE_ID   || null,
        apiVersion: process.env.WHATSAPP_API_VERSION || "v19.0",
    },

    aws: {
        region:    process.env.AWS_REGION     || "eu-north-1",
        s3Bucket:  process.env.S3_BUCKET_NAME || null,
    },

    app: {
        baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
    },
};

module.exports = env;