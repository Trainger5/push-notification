// Use MySQL datastores instead of NeDB
const { getMySQLDatastores, seedAdminIfMissing } = require('./mysql-datastores');

// Export MySQL functions with same interface
const getDatastores = getMySQLDatastores;

module.exports = { getDatastores, seedAdminIfMissing };


