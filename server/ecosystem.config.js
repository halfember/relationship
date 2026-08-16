const path = require('path');

module.exports = {
  apps: [
    {
      name: 'relationship-manager',
      script: path.resolve(__dirname, 'dist/main.js'),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 自动重启
      max_memory_restart: '512M',
      restart_delay: 3000,

      // 日志
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,

      // 存活检查
      max_restarts: 10,
    },
  ],
};
