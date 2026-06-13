import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MaterialDocument = Material & Document;

@Prop()
class MaterialFile {
  @Prop()
  name: string;

  @Prop()
  url: string;

  @Prop()
  type: string;

  @Prop()
  duration?: number;
}

@Schema({ collection: 'materials', timestamps: true })
export class Material extends BaseSchema {
  @Prop({ required: true })
  title: string;

  @Prop()
  interviewee?: string;

  @Prop()
  interviewDate?: Date;

  @Prop()
  location?: string;

  @Prop()
  keywords?: string[];

  @Prop({ type: [MaterialFile] })
  files: MaterialFile[];

  @Prop()
  uploader: string;

  @Prop()
  remark?: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
