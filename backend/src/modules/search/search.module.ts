import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Anomaly, AnomalySchema } from '../anomalies/schemas/anomaly.schema';
import { Dataset, DatasetSchema } from '../datasets/schemas/dataset.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Anomaly.name, schema: AnomalySchema },
      { name: Dataset.name, schema: DatasetSchema },
      { name: Report.name, schema: ReportSchema },
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
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
