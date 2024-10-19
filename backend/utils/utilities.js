const { v4: uuidv4 } = require('uuid');
const os = require('os');

function generateUniqueId() {
  return uuidv4();
}

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal && !alias.address.startsWith('169.254')) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

module.exports = {generateUniqueId, getLocalIPAddress};