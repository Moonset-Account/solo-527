import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { User } from '../../entities/user.entity';
import { OperationLog } from '../../entities/operation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OperationLog]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'pet-grooming-secret-key-2024',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
