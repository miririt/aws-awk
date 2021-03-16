
const process = require('process');

module.exports = {
  arcalive: {
    username: process.env['arcalive_username'],
    password: process.env['arcalive_password']
  },
  server: {
    port: process.env['PORT'] || 80,
    logCount: 10000
  }
};