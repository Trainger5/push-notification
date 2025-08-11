const { seedAdminIfMissing } = require('./storage/datastores');

(async () => {
  const admin = await seedAdminIfMissing();
  console.log('Admin user ensured:', { email: admin.email });
})();


