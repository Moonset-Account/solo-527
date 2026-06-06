const { cleanupExpiredPhotos } = require('../src/lib/id-photo');

async function runCleanup() {
  console.log('Starting ID photo cleanup...');
  try {
    const count = await cleanupExpiredPhotos();
    console.log(`Cleaned up ${count} expired photos.`);
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup();
