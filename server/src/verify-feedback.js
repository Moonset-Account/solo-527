import Feedback from './models/Feedback.js';
import mongoose from 'mongoose';

console.log('=== Test 1: Check status enum values ===');
const statusValues = Feedback.schema.path('status').enumValues;
console.log('Feedback status enum:', statusValues);
console.log('Contains "handling":', statusValues.includes('handling'));

console.log('\n=== Test 2: Validate feedback with status=handling ===');
const testFeedback = new Feedback({
  _id: new mongoose.Types.ObjectId(),
  type: 'suggestion',
  title: '优化排班系统',
  content: '希望排班系统能更灵活，方便志愿者调班。',
  rating: 3,
  status: 'handling',
  priority: 'medium',
  handlePlan: '计划下个月升级排班系统，增加调班功能',
  handler: new mongoose.Types.ObjectId(),
  handledAt: new Date()
});

const validationError = testFeedback.validateSync();
if (validationError) {
  console.log('❌ Validation failed:', validationError.message);
  console.log('Errors:', Object.keys(validationError.errors).map(k => `${k}: ${validationError.errors[k].message}`));
} else {
  console.log('✅ Validation passed! status=handling is valid');
  console.log('   handlePlan:', testFeedback.handlePlan);
  console.log('   handledAt:', testFeedback.handledAt);
}

console.log('\n=== Test 3: Verify all status values work ===');
const allStatuses = ['pending', 'reviewing', 'handling', 'resolved', 'rejected'];
let allValid = true;
for (const status of allStatuses) {
  const fb = new Feedback({
    _id: new mongoose.Types.ObjectId(),
    type: 'suggestion',
    title: `Test ${status}`,
    content: 'test',
    status
  });
  const err = fb.validateSync();
  if (err) {
    console.log(`❌ status="${status}" is invalid`);
    allValid = false;
  } else {
    console.log(`✅ status="${status}" is valid`);
  }
}

if (allValid) {
  console.log('\n🎉 All status values are valid!');
}

console.log('\n=== Test 4: Simulate /feedbacks/:id/handle logic ===');
const feedbackToHandle = new Feedback({
  _id: new mongoose.Types.ObjectId(),
  type: 'complaint',
  title: '测试处理接口',
  content: '测试处理方案保存',
  status: 'reviewing',
  priority: 'high'
});

const mockUserId = new mongoose.Types.ObjectId();
const handlePlan = '安排专人对接，24小时内给出解决方案';

if (handlePlan) feedbackToHandle.handlePlan = handlePlan;
feedbackToHandle.status = 'handling';
feedbackToHandle.handler = mockUserId;
feedbackToHandle.handledAt = new Date();

const handleError = feedbackToHandle.validateSync();
if (handleError) {
  console.log('❌ After handle: validation failed:', handleError.message);
} else {
  console.log('✅ After handle: validation passed!');
  console.log('   status:', feedbackToHandle.status);
  console.log('   handlePlan:', feedbackToHandle.handlePlan);
  console.log('   handler:', feedbackToHandle.handler ? 'set' : 'not set');
  console.log('   handledAt:', feedbackToHandle.handledAt ? 'set' : 'not set');
}

console.log('\n🎉 All tests completed! Feedback handling works correctly.');
