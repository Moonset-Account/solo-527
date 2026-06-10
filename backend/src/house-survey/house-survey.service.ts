import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseSurvey } from './house-survey.entity';
import { CreateHouseSurveyDto } from './dto/create-house-survey.dto';
import { UpdateHouseSurveyDto } from './dto/update-house-survey.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class HouseSurveyService {
  constructor(
    @InjectRepository(HouseSurvey)
    private houseSurveyRepository: Repository<HouseSurvey>,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number): Promise<PaginatedResult<HouseSurvey>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const [list, total] = await this.houseSurveyRepository.findAndCount({
      where,
      relations: ['project'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<HouseSurvey> {
    const houseSurvey = await this.houseSurveyRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!houseSurvey) {
      throw new NotFoundException(`HouseSurvey with id ${id} not found`);
    }
    return houseSurvey;
  }

  async findByProjectId(projectId: number): Promise<HouseSurvey[]> {
    return this.houseSurveyRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createHouseSurveyDto: CreateHouseSurveyDto): Promise<HouseSurvey> {
    const houseSurvey = this.houseSurveyRepository.create({
      ...createHouseSurveyDto,
      handleTime: new Date(),
    });
    return this.houseSurveyRepository.save(houseSurvey);
  }

  async update(id: number, updateHouseSurveyDto: UpdateHouseSurveyDto): Promise<HouseSurvey> {
    const houseSurvey = await this.findOne(id);
    Object.assign(houseSurvey, updateHouseSurveyDto, { handleTime: new Date() });
    return this.houseSurveyRepository.save(houseSurvey);
  }

  async remove(id: number): Promise<void> {
    const result = await this.houseSurveyRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`HouseSurvey with id ${id} not found`);
    }
  }
}
