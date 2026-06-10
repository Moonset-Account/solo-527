import mongoose, { Schema, Document, Model } from 'mongoose';
import { Supplier, QualificationFile, ContactPerson, SupplierQualificationStatus } from '@app/shared';

const ContactPersonSchema = new Schema<ContactPerson>({
  name: { type: String, required: true },
  title: String,
  phone: { type: String, required: true },
  email: { type: String, required: true }
}, { _id: false });

const QualificationFileSchema = new Schema<QualificationFile>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['valid', 'expiring', 'expired'], default: 'valid' },
  attachmentId: { type: String, required: true }
}, { _id: false });

const SupplierSchema = new Schema<Supplier & Document>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  shortName: String,
  category: [String],
  businessLicense: String,
  contactPerson: ContactPersonSchema,
  address: String,
  bankAccount: String,
  qualifications: [QualificationFileSchema],
  qualificationStatus: { 
    type: String, 
    enum: ['qualified', 'warning', 'expired', 'blacklisted', 'pending'],
    default: 'pending' as SupplierQualificationStatus 
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  tags: [String],
  registeredAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

SupplierSchema.index({ name: 'text', shortName: 'text', code: 'text' });
SupplierSchema.index({ qualificationStatus: 1 });
SupplierSchema.index({ 'qualifications.expiryDate': 1 });

export const SupplierModel: Model<Supplier & Document> = 
  mongoose.model('Supplier', SupplierSchema);
