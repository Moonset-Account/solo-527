import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ReminderTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: [String], default: [] })
  channels: string[];

  @Prop({ required: true })
  template: string;

  @Prop({
    type: {
      departments: { type: [String], default: [] },
      roles: { type: [String], default: [] },
    },
    default: {},
  })
  scope: {
    departments: string[];
    roles: string[];
  };

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type ReminderTemplateDocument = ReminderTemplate & Document;
export const ReminderTemplateSchema = SchemaFactory.createForClass(ReminderTemplate);

ReminderTemplateSchema.index({ type: 1 });
ReminderTemplateSchema.index({ enabled: 1 });
