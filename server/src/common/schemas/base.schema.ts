import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema()
export class BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt: Date | null;
}
