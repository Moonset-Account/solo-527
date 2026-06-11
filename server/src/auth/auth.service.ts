import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/user.entity.js';
import { Customer } from '../common/customer.entity.js';
import { LoginDto } from './dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email }, relations: ['company'] });
    if (user && user.password === dto.password) {
      const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId, type: 'user' };
      return {
        accessToken: this.jwtService.sign(payload),
        user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
      };
    }
    const customer = await this.customerRepo.findOne({ where: { email: dto.email }, relations: ['company'] });
    if (customer && customer.password === dto.password) {
      const payload = { sub: customer.id, email: customer.email, role: 'customer', companyId: customer.companyId, type: 'customer' };
      return {
        accessToken: this.jwtService.sign(payload),
        user: { id: customer.id, name: customer.name, email: customer.email, role: 'customer', companyId: customer.companyId },
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async portalLogin(token: string) {
    const customer = await this.customerRepo.findOne({ where: { accessToken: token }, relations: ['company'] });
    if (!customer) {
      throw new UnauthorizedException('Invalid access token');
    }
    const payload = { sub: customer.id, email: customer.email, role: 'customer', companyId: customer.companyId, type: 'customer' };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: customer.id, name: customer.name, email: customer.email, role: 'customer', companyId: customer.companyId },
    };
  }
}
