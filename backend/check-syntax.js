const files = [
  './src/config/prisma.js',
  './src/utils/response.js',
  './src/utils/logger.js',
  './src/middleware/auth.js',
  './src/controllers/authController.js',
  './src/controllers/memberController.js',
  './src/controllers/treatmentController.js',
  './src/controllers/memberTreatmentController.js',
  './src/controllers/appointmentController.js',
  './src/routes/auth.js',
  './src/routes/members.js',
  './src/routes/treatments.js',
  './src/routes/memberTreatments.js',
  './src/routes/appointments.js',
];

let hasError = false;
for (const file of files) {
  try {
    require(file);
    console.log('✓ ' + file);
  } catch (err) {
    console.log('✗ ' + file + ' - ' + err.message);
    hasError = true;
  }
}

if (!hasError) {
  console.log('\n所有文件语法检查通过！');
}
