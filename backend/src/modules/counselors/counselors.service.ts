import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counselor } from '../../entities/counselor.entity';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CounselorsService {
  constructor(
    @InjectRepository(Counselor)
    private counselorsRepository: Repository<Counselor>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(page = 1, pageSize = 10, status?: string, specialty?: string) {
    const query = this.counselorsRepository.createQueryBuilder('counselor')
      .leftJoinAndSelect('counselor.user', 'user');

    if (status) {
      query.andWhere('counselor.status = :status', { status });
    }

    if (specialty) {
      query.andWhere('counselor.specialties LIKE :specialty', { specialty: `%${specialty}%` });
    }

    query.orderBy('counselor.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        introduction: item.introduction,
        specialties: item.specialties,
        certifications: item.certifications,
        experienceYears: item.experienceYears,
        status: item.status,
        hourlyRate: item.hourlyRate,
        rating: item.rating,
        reviewCount: item.reviewCount,
        appointmentCount: item.appointmentCount,
        avatar: item.avatar,
        userId: item.userId,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findAllPublic() {
    const counselors = await this.counselorsRepository.find({
      where: { status: 'active' },
      order: { rating: 'DESC' },
    });
    return counselors.map(item => ({
      id: item.id,
      name: item.name,
      introduction: item.introduction,
      specialties: item.specialties,
      certifications: item.certifications,
      experienceYears: item.experienceYears,
      hourlyRate: item.hourlyRate,
      rating: item.rating,
      reviewCount: item.reviewCount,
      appointmentCount: item.appointmentCount,
      avatar: item.avatar,
    }));
  }

  async findOne(id: string) {
    const counselor = await this.counselorsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!counselor) {
      throw new NotFoundException('咨询师不存在');
    }
    const { user, ...rest } = counselor;
    return {
      ...rest,
      username: user?.username,
      email: user?.email,
      phone: user?.phone,
    };
  }

  async create(createCounselorDto: any) {
    const hashedPassword = await bcrypt.hash(createCounselorDto.password || '123456', 10);
    const user = this.usersRepository.create({
      username: createCounselorDto.username,
      password: hashedPassword,
      name: createCounselorDto.name,
      email: createCounselorDto.email,
      phone: createCounselorDto.phone,
      role: 'counselor',
    });
    await this.usersRepository.save(user);

    const counselor = this.counselorsRepository.create({
      userId: user.id,
      name: createCounselorDto.name,
      introduction: createCounselorDto.introduction,
      specialties: createCounselorDto.specialties,
      certifications: createCounselorDto.certifications,
      experienceYears: createCounselorDto.experienceYears || 0,
      status: createCounselorDto.status || 'active',
      hourlyRate: createCounselorDto.hourlyRate || 0,
      avatar: createCounselorDto.avatar,
    });

    return this.counselorsRepository.save(counselor);
  }

  async update(id: string, updateCounselorDto: any) {
    const counselor = await this.findOne(id);
    if (!counselor) {
      throw new NotFoundException('咨询师不存在');
    }

    const { username, email, phone, password, ...counselorData } = updateCounselorDto;

    if (username || email || phone || password) {
      const userUpdate: any = {};
      if (username) userUpdate.username = username;
      if (email) userUpdate.email = email;
      if (phone) userUpdate.phone = phone;
      if (password) userUpdate.password = await bcrypt.hash(password, 10);
      await this.usersRepository.update(counselor.userId, userUpdate);
    }

    if (Object.keys(counselorData).length > 0) {
      await this.counselorsRepository.update(id, counselorData);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const counselor = await this.counselorsRepository.findOne({ where: { id } });
    if (!counselor) {
      throw new NotFoundException('咨询师不存在');
    }
    await this.usersRepository.delete(counselor.userId);
    await this.counselorsRepository.delete(id);
    return { success: true };
  }
}
