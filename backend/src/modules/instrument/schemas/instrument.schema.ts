import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InstrumentStatus } from '../../common/enums/index.enum';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type InstrumentDocument = Instrument & Document;

@Schema({ collection: 'instruments', timestamps: true })
export class Instrument {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  instrumentNo: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  model: string;

  @Prop({ type: String })
  manufacturer: string;

  @Prop({ type: String, enum: Object.values(InstrumentStatus), default: InstrumentStatus.AVAILABLE, index: true })
  status: InstrumentStatus;

  @Prop({ type: String })
  location: string;

  @Prop({ type: String })
  laboratory: string;

  @Prop({ type: String })
  managerId: string;

  @Prop({ type: String })
  managerName: string;

  @Prop({ type: Date })
  lastMaintenanceDate: Date;

  @Prop({ type: Date })
  nextMaintenanceDate: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String })
  description: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const InstrumentSchema = SchemaFactory.createForClass(Instrument);

export type InstrumentBookingDocument = InstrumentBooking & Document;

@Schema({ collection: 'instrument_bookings', timestamps: true })
export class InstrumentBooking {
  _id: Types.ObjectId;

  @Prop({ type: String, unique: true, required: true, index: true })
  bookingNo: string;

  @Prop({ type: Types.ObjectId, ref: 'Instrument', required: true, index: true })
  instrumentId: Types.ObjectId;

  @Prop({ type: String, required: true })
  instrumentName: string;

  @Prop({ type: String, required: true, index: true })
  bookerId: string;

  @Prop({ type: String, required: true })
  bookerName: string;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({ type: String })
  purpose: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Application', default: [] })
  relatedApplicationIds: Types.ObjectId[];

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  remarks: string;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const InstrumentBookingSchema = SchemaFactory.createForClass(InstrumentBooking);
InstrumentBookingSchema.index({ instrumentId: 1, startTime: 1 });
