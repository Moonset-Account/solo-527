import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnomaliesService } from './anomalies.service';
import { AnomaliesController } from './anomalies.controller';
import { Anomaly, AnomalySchema } from './schemas/anomaly.schema';
import { AnomalyEvent, AnomalyEventSchema } from './schemas/anomaly-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Anomaly.name, schema: AnomalySchema },
      { name: AnomalyEvent.name, schema: AnomalyEventSchema },
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
  controllers: [AnomaliesController],
  providers: [AnomaliesService],
  exports: [AnomaliesService],
})
export class AnomaliesModule implements OnModuleInit {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  async onModuleInit() {
    await this.anomaliesService.initMockData();
  }
}
