import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StagePhoto } from './stage-photo.entity';
import { CreateStagePhotoDto } from './dto/create-stage-photo.dto';
import { UpdateStagePhotoDto } from './dto/update-stage-photo.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class StagePhotoService {
  constructor(
    @InjectRepository(StagePhoto)
    private stagePhotoRepository: Repository<StagePhoto>,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number, stageId?: number): Promise<PaginatedResult<StagePhoto>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (stageId) {
      where.stageId = stageId;
    }

    const [list, total] = await this.stagePhotoRepository.findAndCount({
      where,
      relations: ['stage', 'project'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<StagePhoto> {
    const photo = await this.stagePhotoRepository.findOne({
      where: { id },
      relations: ['stage', 'project'],
    });
    if (!photo) {
      throw new NotFoundException(`StagePhoto with id ${id} not found`);
    }
    return photo;
  }

  async findByProjectId(projectId: number): Promise<StagePhoto[]> {
    return this.stagePhotoRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStageId(stageId: number): Promise<StagePhoto[]> {
    return this.stagePhotoRepository.find({
      where: { stageId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateStagePhotoDto): Promise<StagePhoto> {
    const photo = this.stagePhotoRepository.create({
      ...createDto,
      uploadTime: new Date(),
    });
    return this.stagePhotoRepository.save(photo);
  }

  async update(id: number, updateDto: UpdateStagePhotoDto): Promise<StagePhoto> {
    const photo = await this.findOne(id);
    Object.assign(photo, updateDto);
    return this.stagePhotoRepository.save(photo);
  }

  async remove(id: number): Promise<void> {
    const result = await this.stagePhotoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`StagePhoto with id ${id} not found`);
    }
  }
}
