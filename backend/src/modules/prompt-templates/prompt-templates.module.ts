import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromptTemplatesService } from './prompt-templates.service';
import { PromptTemplatesController } from './prompt-templates.controller';
import { PromptTemplate, PromptTemplateSchema } from './schemas/prompt-template.schema';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PromptTemplate.name, schema: PromptTemplateSchema },
    ]),
    UsersModule,
    JwtModule,
  ],
  controllers: [PromptTemplatesController],
  providers: [PromptTemplatesService],
  exports: [PromptTemplatesService, MongooseModule],
})
export class PromptTemplatesModule {}
