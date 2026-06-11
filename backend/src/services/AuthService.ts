import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../entities/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async login(username: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = await this.userRepository.findOneBy({ username });
    
    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    const token = generateToken(user);
    return { user, token };
  }

  async register(params: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    email?: string;
    phone?: string;
  }): Promise<User> {
    const existing = await this.userRepository.findOneBy({ username: params.username });
    if (existing) {
      throw new Error('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(params.password, 10);
    
    const user = this.userRepository.create({
      username: params.username,
      password: hashedPassword,
      name: params.name,
      role: params.role,
      email: params.email,
      phone: params.phone,
    });

    return await this.userRepository.save(user);
  }

  async getUsers(params: { role?: UserRole; page?: number; pageSize?: number }): Promise<{ items: User[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (params.role) {
      queryBuilder.where('user.role = :role', { role: params.role });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    
    return { items, total };
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async updateUser(id: string, params: Partial<User>): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;

    if (params.password) {
      params.password = await bcrypt.hash(params.password, 10);
    }

    Object.assign(user, params);
    return await this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}

export const authService = new AuthService();
