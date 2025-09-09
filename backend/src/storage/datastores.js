// Choose datastore implementation based on environment
const useMemory = String(process.env.USE_MEMORY_STORE || 'false').toLowerCase() === 'true';

let getDatastores;
let seedAdminIfMissing;

if (useMemory) {
  ({ getMemoryDatastores: getDatastores, seedAdminIfMissing } = require('./memory-datastores'));
  console.log('⚙️  Using in-memory datastores (USE_MEMORY_STORE=true)');
} else {
  ({ getMySQLDatastores: getDatastores, seedAdminIfMissing } = require('./mysql-datastores'));
  console.log('🗄️  Using MySQL datastores');
}

module.exports = { getDatastores, seedAdminIfMissing };

