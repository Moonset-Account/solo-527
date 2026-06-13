import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: CurrentUserPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('账户已失效');
    }

    const roles = user.roles?.map(r => r.name) || [];
    const permissions = this.extractPermissions(user.roles);

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      clinicId: user.clinicId,
      roles,
      permissions,
    } as CurrentUserPayload;
  }

  private extractPermissions(roles: Role[] | undefined): string[] {
    if (!roles) return [];
    const permissionSet = new Set<string>();
    roles.forEach(role => {
      role.permissions?.forEach(perm => {
        permissionSet.add(perm.code);
      });
    });
    return Array.from(permissionSet);
  }
}
