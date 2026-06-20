import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({ timestamps: true })
export class DownloadDetail extends Document {
  @Prop({ required: true })
  transactionSecurity: string;

  @Prop({ required: true })
  repairTimeout: string;

  @Prop({
    type: {
      operator: { type: String, required: true },
      operatedAt: { type: Date, required: true },
    },
    required: true,
  })
  lastOperation: { operator: string; operatedAt: Date };

  @Prop({ required: true, enum: ['sandbox', 'production'], default: 'sandbox' })
  environment: string;

  @Prop({ type: SchemaTypes.Mixed })
  data: Record<string, any>;
}

export const DownloadDetailSchema = SchemaFactory.createForClass(DownloadDetail);
