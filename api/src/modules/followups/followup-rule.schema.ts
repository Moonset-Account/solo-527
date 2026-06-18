import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class FollowupRule {
  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    type: {
      event: { type: String, required: true },
      params: { type: Object, default: {} },
    },
  })
  triggerCondition: {
    event: string;
    params: Record<string, any>;
  };

  @Prop({
    required: true,
    type: {
      remindHours: { type: Number, required: true },
      remindMethod: { type: [String], required: true },
      remindTarget: { type: [String], default: [] },
    },
  })
  action: {
    remindHours: number;
    remindMethod: string[];
    remindTarget: string[];
  };

  @Prop({
    type: {
      departments: { type: [String], default: [] },
      roles: { type: [String], default: [] },
      leadSources: { type: [String], default: [] },
    },
    default: {},
  })
  scope: {
    departments: string[];
    roles: string[];
    leadSources: string[];
  };

  @Prop({ default: 0 })
  priority: number;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type FollowupRuleDocument = FollowupRule & Document;
export const FollowupRuleSchema = SchemaFactory.createForClass(FollowupRule);

FollowupRuleSchema.index({ enabled: 1 });
FollowupRuleSchema.index({ priority: 1 });
