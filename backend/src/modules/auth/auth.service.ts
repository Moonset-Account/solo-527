import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  realName: string;
  email: string;
  phone: string;
  department: string;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  department: string;
  avatar: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    private jwtService: JwtService,
  ) {
    this.initAdmin();
  }

  private async initAdmin() {
    try {
      const exist = await this.userRepo.findOne({ where: { username: 'admin' } });
      if (exist) return;

      const hashed = await bcrypt.hash('admin123', 10);
      const admin = this.userRepo.create({
        username: 'admin',
        password: hashed,
        realName: '系统管理员',
        email: 'admin@legal.com',
        phone: '13800000000',
        department: 'admin' as any,
        status: UserStatus.ACTIVE,
      });
      await this.userRepo.save(admin);

      let role = await this.roleRepo.findOne({ where: { code: 'super_admin' } });
      if (!role) {
        role = this.roleRepo.create({
          code: 'super_admin',
          name: '超级管理员',
          description: '拥有所有权限',
          enabled: true,
        });
        await this.roleRepo.save(role);
      }

      const userRole = this.userRoleRepo.create({ userId: admin.id, roleId: role.id });
      await this.userRoleRepo.save(userRole);

      const basePerms = [
        { code: 'contract:create', name: '创建合同', module: 'contract' },
        { code: 'contract:view', name: '查看合同', module: 'contract' },
        { code: 'contract:update', name: '修改合同', module: 'contract' },
        { code: 'contract:delete', name: '删除合同', module: 'contract' },
        { code: 'contract:archive', name: '归档合同', module: 'contract' },
        { code: 'contract:number:manage', name: '编号管理', module: 'contract' },
        { code: 'approval:submit', name: '提交审批', module: 'approval' },
        { code: 'approval:review', name: '审批操作', module: 'approval' },
        { code: 'approval:view', name: '查看审批', module: 'approval' },
        { code: 'file:upload', name: '上传文件', module: 'file' },
        { code: 'file:download', name: '下载文件', module: 'file' },
        { code: 'file:permission:manage', name: '文件权限管理', module: 'file' },
        { code: 'user:manage', name: '用户管理', module: 'user' },
        { code: 'role:manage', name: '角色管理', module: 'role' },
        { code: 'permission:manage', name: '权限管理', module: 'permission' },
        { code: 'conflict:view', name: '查看冲突', module: 'conflict' },
        { code: 'conflict:handle', name: '处理冲突', module: 'conflict' },
        { code: 'notification:send', name: '发送通知', module: 'notification' },
        { code: 'notification:manage', name: '通知管理', module: 'notification' },
        { code: 'callback:view', name: '查看回调日志', module: 'callback' },
        { code: 'callback:retry', name: '重试回调', module: 'callback' },
        { code: 'query:advanced', name: '高级查询', module: 'query' },
        { code: 'material:verify', name: '材料核对', module: 'material' },
      ];

      for (const p of basePerms) {
        let perm = await this.permRepo.findOne({ where: { code: p.code } });
        if (!perm) {
          perm = this.permRepo.create(p);
          await this.permRepo.save(perm);
        }
        const rp = this.rolePermRepo.create({ roleId: role.id, permissionId: perm.id });
        await this.rolePermRepo.save(rp);
      }

      console.log('✅ 初始化管理员完成: admin / admin123');
    } catch (e) {
      console.log('⚠️  初始化数据跳过:', e.message);
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账户已被禁用');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    const roles = await this.getUserRoles(user.id);
    const permissions = await this.getUserPermissions(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        department: user.department,
        avatar: user.avatar,
        roles,
        permissions,
      },
    };
  }

  async getUserRoles(userId: string) {
    const urs = await this.userRoleRepo.find({
      where: { userId },
      relations: ['role'],
    });
    return urs.map((ur) => ur.role?.code).filter(Boolean);
  }

  async getUserPermissions(userId: string) {
    const urs = await this.userRoleRepo.find({ where: { userId } });
    const roleIds = urs.map((ur) => ur.roleId);
    if (roleIds.length === 0) return [];

    const rps = await this.rolePermRepo.find({
      where: { roleId: In(roleIds) },
      relations: ['permission'],
    });
    return [...new Set(rps.map((rp) => rp.permission?.code).filter(Boolean))];
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('用户不存在');

    const roles = await this.getUserRoles(userId);
    const permissions = await this.getUserPermissions(userId);

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      avatar: user.avatar,
      roles,
      permissions,
    };
  }

  async listUsers(keyword?: string) {
    const qb = this.userRepo.createQueryBuilder('u').leftJoinAndSelect('u.userRoles', 'ur').leftJoinAndSelect('ur.role', 'r');
    if (keyword) {
      qb.where('u.username ILIKE :kw OR u.realName ILIKE :kw OR u.phone ILIKE :kw', { kw: `%${keyword}%` });
    }
    const [list, total] = await qb.orderBy('u.createdAt', 'DESC').getManyAndCount();
    return {
      list: list.map((u) => ({
        id: u.id,
        username: u.username,
        realName: u.realName,
        email: u.email,
        phone: u.phone,
        department: u.department,
        status: u.status,
        avatar: u.avatar,
        roles: u.userRoles?.map((ur) => ({ id: ur.role?.id, code: ur.role?.code, name: ur.role?.name })),
        createdAt: u.createdAt,
      })),
      total,
    };
  }

  async listRoles() {
    return this.roleRepo.find({ order: { sort: 'ASC', createdAt: 'ASC' } });
  }

  async listPermissions() {
    return this.permRepo.find({ order: { module: 'ASC', sort: 'ASC' } });
  }

  async assignRoles(userId: string, roleIds: string[]) {
    await this.userRoleRepo.delete({ userId });
    const urs = roleIds.map((rid) => this.userRoleRepo.create({ userId, roleId: rid }));
    await this.userRoleRepo.save(urs);
    return { success: true };
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.rolePermRepo.delete({ roleId });
    const rps = permissionIds.map((pid) => this.rolePermRepo.create({ roleId, permissionId: pid }));
    await this.rolePermRepo.save(rps);
    return { success: true };
  }
}
