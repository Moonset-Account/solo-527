const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceName: String,
  basePrice: Number,
  quantity: {
    type: Number,
    default: 1
  },
  subtotal: Number
});

const orderPartSchema = new mongoose.Schema({
  partId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part'
  },
  partName: String,
  partSku: String,
  quantity: {
    type: Number,
    default: 1
  },
  unitPrice: Number,
  costPrice: Number,
  subtotal: Number
});

const pricingBreakdownSchema = new mongoose.Schema({
  type: String,
  name: String,
  amount: Number,
  description: String
});

const orderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    unique: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    index: true
  },
  customerAddress: {
    type: String,
    required: true
  },
  store: {
    type: String,
    default: '',
    index: true
  },
  customerService: {
    type: String,
    default: '',
    description: '负责客服',
    index: true
  },
  applianceType: {
    type: String,
    required: true,
    enum: ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他']
  },
  applianceBrand: {
    type: String,
    default: ''
  },
  applianceModel: {
    type: String,
    default: ''
  },
  faultDescription: {
    type: String,
    required: true
  },
  faultPhotos: [{
    type: String
  }],
  appointmentTime: {
    type: Date,
    required: true,
    index: true
  },
  urgencyLevel: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  serviceItems: [orderItemSchema],
  parts: [orderPartSchema],
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    index: true
  },
  technicianName: String,
  technicianFee: {
    type: Number,
    default: 0
  },
  baseAmount: {
    type: Number,
    default: 0
  },
  partsAmount: {
    type: Number,
    default: 0
  },
  serviceFee: {
    type: Number,
    default: 0
  },
  additionalFees: [{
    type: { type: String },
    name: String,
    amount: Number,
    description: String
  }],
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'wechat', 'alipay', 'card', 'transfer', 'other'],
    default: 'cash'
  },
  pricingBreakdown: [pricingBreakdownSchema],
  diagnosisResult: {
    type: String,
    default: ''
  },
  repairNotes: {
    type: String,
    default: ''
  },
  actualStartTime: Date,
  actualEndTime: Date,
  warrantyExpiryDate: Date,
  rescheduleCount: {
    type: Number,
    default: 0
  },
  remark: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'orders'
});

orderSchema.index({ status: 1, appointmentTime: -1 });
orderSchema.index({ technicianId: 1, status: 1 });
orderSchema.index({ store: 1, customerService: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', function(next) {
  if (!this.orderNo) {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNo = 'ORD' + dateStr + random;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
