import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MaterialDocument = Material & Document;

@Schema({ collection: 'materials', timestamps: true })
export class Material {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  interviewee: string;

  @Prop()
  interviewDate: Date;

  @Prop()
  location: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({
    type: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        duration: { type: Number },
      },
    ],
    default: [],
  })
  files: Array<{ name: string; url: string; type: string; duration?: number }>;

  @Prop()
  uploader: string;

  @Prop()
  remark: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
