import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class AuditInfo extends Document {
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: String, required: false })
  createdBy: string;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: String, required: false })
  updatedBy: string;
}

export const AuditInfoSchema = SchemaFactory.createForClass(AuditInfo);
