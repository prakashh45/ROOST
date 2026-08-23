module.exports = {
  apps: [
    {
      name: "roost-backend",
      script: "src/server.js",
      instances: "max", // Scale based on CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
