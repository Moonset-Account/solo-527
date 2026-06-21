import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import configuration from './config/configuration';
import { dataSourceOptions } from './config/data-source';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtStrategy } from './common/guards/jwt.strategy';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Contract } from './entities/contract.entity';
import { ContractAttachment } from './entities/contract-attachment.entity';
import { ApprovalFlow } from './entities/approval-flow.entity';
import { ConflictRecord } from './entities/conflict-record.entity';
import { Notification } from './entities/notification.entity';
import { CallbackLog } from './entities/callback-log.entity';
import { ContractNumberPool } from './entities/contract-number-pool.entity';
import { FileResource } from './entities/file-resource.entity';
import { AuditLog } from './entities/audit-log.entity';

import { AuthModule } from './modules/auth/auth.module';
import { ContractModule } from './modules/contract/contract.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ConflictModule } from './modules/conflict/conflict.module';
import { FileModule } from './modules/file/file.module';
import { CallbackModule } from './modules/callback/callback.module';
import { SeedModule } from './modules/seed/seed.module';

const entities = [
  User, Role, Permission, UserRole, RolePermission,
  Contract, ContractAttachment, ApprovalFlow, ConflictRecord,
  Notification, CallbackLog, ContractNumberPool, FileResource, AuditLog,
];

function PathRewriteMiddleware(req: any, res: any, next: any) {
  const path = req.url;
  if (path.startsWith('/auth') || path.startsWith('/contracts') ||
      path.startsWith('/approval') || path.startsWith('/conflicts') ||
      path.startsWith('/notifications') || path.startsWith('/files') ||
      path.startsWith('/callbacks')) {
    req.url = '/api' + path;
  }
  next();
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature(entities),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    ContractModule,
    ApprovalModule,
    NotificationModule,
    ConflictModule,
    FileModule,
    CallbackModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    JwtStrategy,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
