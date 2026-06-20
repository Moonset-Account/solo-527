import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { Permission } from '../../entities/permission.entity';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any): Promise<CurrentUserPayload> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      return null;
    }

    const userRoles = await this.userRoleRepo.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    const roles = userRoles.map((ur) => ur.role?.code).filter(Boolean);

    const roleIds = userRoles.map((ur) => ur.roleId).filter(Boolean);
    let permissions: string[] = [];

    if (roleIds.length > 0) {
      const rolePerms = await this.rolePermRepo
        .createQueryBuilder('rp')
        .innerJoinAndSelect('rp.permission', 'p')
        .where('rp.roleId IN (:...roleIds)', { roleIds })
        .getMany();

      permissions = [...new Set(rolePerms.map((rp) => rp.permission?.code).filter(Boolean))];
    }

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      roles,
      permissions,
    };
  }
}
