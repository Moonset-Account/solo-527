import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'qinghe-jwt-secret-key-2024',
    });
  }

  async validate(payload: any) {
    return {
      _id: payload.sub,
      username: payload.username,
      role: payload.role,
      name: payload.name,
      storeId: payload.storeId,
      storeName: payload.storeName,
    };
  }
}
