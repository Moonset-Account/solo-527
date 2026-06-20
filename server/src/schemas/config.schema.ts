import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Config extends Document {
  @Prop({ required: true, enum: ['notification_receipt', 'club_activity', 'secondhand_trade'] })
  type: string;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop({
    type: {
      userId: { type: String, required: true },
      userName: { type: String, required: true },
    },
    required: true,
  })
  updatedBy: { userId: string; userName: string };

  @Prop()
  description: string;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
