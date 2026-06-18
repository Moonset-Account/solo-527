import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AlertRulesService } from './alert-rules.service';
import { AlertRulesController } from './alert-rules.controller';
import { AlertRule, AlertRuleSchema } from './schemas/alert-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AlertRule.name, schema: AlertRuleSchema },
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
  controllers: [AlertRulesController],
  providers: [AlertRulesService],
  exports: [AlertRulesService],
})
export class AlertRulesModule implements OnModuleInit {
  constructor(private readonly alertRulesService: AlertRulesService) {}

  async onModuleInit() {
    await this.alertRulesService.initMockData();
  }
}
