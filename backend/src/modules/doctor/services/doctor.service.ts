import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async findAll(clinicId?: string, isActive?: boolean) {
    const queryBuilder = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (clinicId) {
      queryBuilder.andWhere('doctor.clinic_id = :clinicId', { clinicId });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('doctor.is_active = :isActive', { isActive });
    }

    return await queryBuilder
      .orderBy('doctor.created_at', 'ASC')
      .getMany();
  }

  async findOne(id: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user', 'user.roles'],
    });
    if (!doctor) {
      throw new NotFoundException('医生不存在');
    }
    return doctor;
  }

  async findByUserId(userId: string) {
    return await this.doctorRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }
}
