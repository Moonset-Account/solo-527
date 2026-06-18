import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Contract {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lead' })
  leadId: Types.ObjectId;

  @Prop({ required: true, enum: ['pending', 'signed', 'active', 'completed', 'cancelled'] })
  status: string;

  @Prop()
  pendingReason: string;

  @Prop()
  processingHours: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  responsiblePerson: Types.ObjectId;

  @Prop({ default: Date.now, type: Date })
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type ContractDocument = Contract & Document;
export const ContractSchema = SchemaFactory.createForClass(Contract);

ContractSchema.index({ leadId: 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ responsiblePerson: 1 });
