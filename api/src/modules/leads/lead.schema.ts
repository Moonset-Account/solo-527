import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, enum: ['线上表单', '转介绍', '展会', '电话咨询', '老客户推荐'] })
  source: string;

  @Prop({
    required: true,
    enum: ['new', 'contacted', 'measured', 'quoted', 'contracted', 'lost'],
    default: 'new',
  })
  status: string;

  @Prop({
    type: {
      houseType: { type: String },
      area: { type: Number },
      budgetRange: { type: String },
      style: { type: String },
      expectedStartDate: { type: String },
    },
  })
  decorationDemand: {
    houseType?: string;
    area?: number;
    budgetRange?: string;
    style?: string;
    expectedStartDate?: string;
  };

  @Prop({
    type: {
      measuredAt: { type: Date },
      measurer: { type: String },
      actualArea: { type: Number },
      structureNote: { type: String },
      photos: { type: [String] },
    },
    default: null,
  })
  measurementInfo: {
    measuredAt?: Date;
    measurer?: string;
    actualArea?: number;
    structureNote?: string;
    photos?: string[];
  } | null;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type LeadDocument = Lead & Document;
export const LeadSchema = SchemaFactory.createForClass(Lead);

LeadSchema.index({ status: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ tags: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ phone: 1 });
