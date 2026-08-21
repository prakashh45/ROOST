const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const sslConfig = process.env.DB_SSL_CERT_PATH
    ? {
          ca: fs.readFileSync(
              path.resolve(process.env.DB_SSL_CERT_PATH)
          ),
          rejectUnauthorized: true,
      }
    : undefined;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
});

module.exports = prisma;