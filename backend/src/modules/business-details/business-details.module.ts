import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BusinessDetailsService } from './business-details.service';
import { BusinessDetailsController } from './business-details.controller';
import { BusinessDetail, BusinessDetailSchema } from './schemas/business-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessDetail.name, schema: BusinessDetailSchema },
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
  controllers: [BusinessDetailsController],
  providers: [BusinessDetailsService],
  exports: [BusinessDetailsService],
})
export class BusinessDetailsModule {}
