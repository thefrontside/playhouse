const databaseURL = new URL(process.env.DATABASE_URL);

process.env.POSTGRES_HOST = databaseURL.host.split(':').slice(0,1).join('');
process.env.POSTGRES_PORT = databaseURL.port;
process.env.POSTGRES_USER = databaseURL.username;
process.env.POSTGRES_PASSWORD = databaseURL.password;

require('./packages/backend/dist/index.cjs.js');
