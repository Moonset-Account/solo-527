import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { CustomerFeedbackService } from './customer-feedback.service';
import { CreateCustomerFeedbackDto } from './dto/create-customer-feedback.dto';
import { UpdateCustomerFeedbackDto } from './dto/update-customer-feedback.dto';
import { ReplyCustomerFeedbackDto } from './dto/reply-customer-feedback.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('customer-feedbacks')
export class CustomerFeedbackController {
  constructor(private readonly customerFeedbackService: CustomerFeedbackService) {}

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.customerFeedbackService.findAll(paginationDto, projectIdNum, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerFeedbackService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.customerFeedbackService.findByProjectId(projectId);
  }

  @Post()
  create(@Body() createDto: CreateCustomerFeedbackDto) {
    return this.customerFeedbackService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCustomerFeedbackDto) {
    return this.customerFeedbackService.update(id, updateDto);
  }

  @Patch(':id/reply')
  reply(@Param('id', ParseIntPipe) id: number, @Body() replyDto: ReplyCustomerFeedbackDto) {
    return this.customerFeedbackService.reply(id, replyDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerFeedbackService.remove(id);
  }
}
