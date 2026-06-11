import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Config, ConfigSchema } from '../../schemas/config.schema';
import { ConfigsService } from './configs.service';
import { ConfigsController } from './configs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }]),
  ],
  controllers: [ConfigsController],
  providers: [ConfigsService],
  exports: [ConfigsService],
})
export class ConfigsModule {}
