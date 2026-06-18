import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatasetsService } from './datasets.service';
import { DatasetsController } from './datasets.controller';
import { Dataset, DatasetSchema } from './schemas/dataset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dataset.name, schema: DatasetSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DatasetsController],
  providers: [DatasetsService],
  exports: [DatasetsService],
})
export class DatasetsModule implements OnModuleInit {
  constructor(private readonly datasetsService: DatasetsService) {}

  async onModuleInit() {
    await this.datasetsService.initMockData();
  }
}
