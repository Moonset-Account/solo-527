import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerFeedback } from './customer-feedback.entity';
import { CreateCustomerFeedbackDto } from './dto/create-customer-feedback.dto';
import { UpdateCustomerFeedbackDto } from './dto/update-customer-feedback.dto';
import { ReplyCustomerFeedbackDto } from './dto/reply-customer-feedback.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { FeedbackStatus } from '../common/enums/feedback-status.enum';

@Injectable()
export class CustomerFeedbackService {
  constructor(
    @InjectRepository(CustomerFeedback)
    private feedbackRepository: Repository<CustomerFeedback>,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number, status?: string): Promise<PaginatedResult<CustomerFeedback>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.feedbackRepository.findAndCount({
      where,
      relations: ['project'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<CustomerFeedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!feedback) {
      throw new NotFoundException(`CustomerFeedback with id ${id} not found`);
    }
    return feedback;
  }

  async findByProjectId(projectId: number): Promise<CustomerFeedback[]> {
    return this.feedbackRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateCustomerFeedbackDto): Promise<CustomerFeedback> {
    const feedback = this.feedbackRepository.create({
      ...createDto,
      feedbackTime: new Date(),
    });
    return this.feedbackRepository.save(feedback);
  }

  async update(id: number, updateDto: UpdateCustomerFeedbackDto): Promise<CustomerFeedback> {
    const feedback = await this.findOne(id);
    const updateData: any = { ...updateDto };
    
    if (updateDto.reply && !feedback.reply) {
      updateData.replyTime = new Date();
      updateData.status = FeedbackStatus.PROCESSED;
    }
    
    Object.assign(feedback, updateData);
    return this.feedbackRepository.save(feedback);
  }

  async reply(id: number, replyDto: ReplyCustomerFeedbackDto): Promise<CustomerFeedback> {
    const feedback = await this.findOne(id);
    feedback.reply = replyDto.reply;
    feedback.replyTime = new Date();
    feedback.status = FeedbackStatus.PROCESSED;
    if (replyDto.handler) {
      feedback.handler = replyDto.handler;
    }
    return this.feedbackRepository.save(feedback);
  }

  async remove(id: number): Promise<void> {
    const result = await this.feedbackRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`CustomerFeedback with id ${id} not found`);
    }
  }
}
