import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class AuditInfo {
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: String, required: false })
  createdBy: string;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: String, required: false })
  updatedBy: string;

  [key: string]: any;
}

export const AuditInfoSchema = SchemaFactory.createForClass(AuditInfo);
