module.exports = {
  apps: [
    {
      name: 'blind-api',
      cwd: './apps/api',
      script: '../../node_modules/.bin/tsx',
      args: 'src/index.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        API_PORT: 4007,
        DATABASE_URL: 'postgresql://blind_user:blind_password@localhost:5432/blind_db',
      },
    },
    {
      name: 'blind-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3007',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
      },
    },
  ],
};
