# ROOST Backend - Setup & Run Guide

This document explains how to run the ROOST backend locally for development and how it runs in production.

## 1. Local Development (Your Machine)

### Prerequisites
- Node.js (v20+)
- PostgreSQL Database (running locally or a remote RDS URL)

### Step 1: Install Dependencies
Open your terminal in the backend folder and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Ensure your `.env` file in the root directory contains the correct database URL and JWT secret:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:YourPassword@your-rds-url:5432/roost?sslmode=no-verify"
JWT_SECRET="your-super-secret-roost-key"
```

### Step 3: Run Database Migrations
Push the Prisma schema to your database to create all the tables:
```bash
npx prisma db push
# or
npx prisma migrate deploy
```

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: Start the Server
Start the development server:
```bash
npm start
```
*The server will start at `http://localhost:5000`.*

---

## 2. Production Deployment (AWS EC2)

The backend is configured with a fully automated CI/CD pipeline using **GitHub Actions**.

### How Deployments Work
1. When you push your code to the `main` branch on GitHub, the `deploy.yml` action triggers automatically.
2. It SSHs into your AWS EC2 instance.
3. It pulls the latest code, installs dependencies (`npm ci`), and runs database migrations.
4. It safely reloads the application using **PM2** so that users experience zero downtime.

### Managing the Server via PM2 (Manual Commands)
If you ever need to manage the server manually, SSH into your EC2 instance and use these PM2 commands:

**View running apps:**
```bash
pm2 list
```

**View live server logs:**
```bash
pm2 logs roost-backend
```

**Restart the server:**
```bash
pm2 restart roost-backend
```

**Monitor CPU/Memory usage in real-time:**
```bash
pm2 monit
```
