import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import {
  AppointmentsService,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentsDto,
  UpdateStatusDto,
  ReviewAppointmentDto,
} from './appointments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { AppointmentStatus, ReviewRating, BadReviewReason } from '../../entities/appointment.entity';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsDateString, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class CreateAppointmentRequestDto implements CreateAppointmentDto {
  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsUUID()
  petId: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsUUID()
  serviceId: string;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateAppointmentRequestDto implements UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class QueryAppointmentsRequestDto implements QueryAppointmentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  petId?: string;
}

class UpdateStatusRequestDto implements UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}

class ReviewAppointmentRequestDto implements ReviewAppointmentDto {
  @IsEnum(ReviewRating)
  reviewRating: ReviewRating;

  @IsOptional()
  @IsString()
  reviewComment?: string;

  @IsOptional()
  @IsEnum(BadReviewReason)
  badReviewReason?: BadReviewReason;
}

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(@Query() query: QueryAppointmentsRequestDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async create(@Body() dto: CreateAppointmentRequestDto, @Request() req) {
    return this.appointmentsService.create(dto, req.user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentRequestDto, @Request() req) {
    return this.appointmentsService.update(id, dto, req.user);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusRequestDto, @Request() req) {
    return this.appointmentsService.updateStatus(id, dto, req.user);
  }

  @Put(':id/review')
  async review(@Param('id') id: string, @Body() dto: ReviewAppointmentRequestDto, @Request() req) {
    return this.appointmentsService.review(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.remove(id, req.user);
  }
}
