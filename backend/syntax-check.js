const fs = require('fs');
const path = require('path');

const files = [
  'src/config/prisma.js',
  'src/utils/response.js',
  'src/utils/logger.js',
  'src/middleware/auth.js',
  'src/controllers/authController.js',
  'src/controllers/memberController.js',
  'src/controllers/treatmentController.js',
  'src/controllers/memberTreatmentController.js',
  'src/controllers/appointmentController.js',
  'src/routes/auth.js',
  'src/routes/members.js',
  'src/routes/treatments.js',
  'src/routes/memberTreatments.js',
  'src/routes/appointments.js',
];

let output = '';
let hasError = false;

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    new Function(content);
    output += '✓ ' + file + '\n';
  } catch (err) {
    output += '✗ ' + file + ' - ' + err.message + '\n';
    hasError = true;
  }
}

if (!hasError) {
  output += '\n所有文件语法检查通过！\n';
}

console.log(output);
fs.writeFileSync('syntax-check-result.txt', output);
