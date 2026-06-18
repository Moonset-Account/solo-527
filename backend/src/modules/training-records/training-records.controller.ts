import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrainingRecordsService } from './training-records.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('training-records')
export class TrainingRecordsController {
  constructor(private readonly trainingRecordsService: TrainingRecordsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('petId') petId?: string,
    @Query('trainerId') trainerId?: string,
  ) {
    return this.trainingRecordsService.findAll({
      page,
      pageSize,
      startDate,
      endDate,
      petId,
      trainerId,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.trainingRecordsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async create(@Body() dto: any, @Request() req) {
    return this.trainingRecordsService.create(dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.trainingRecordsService.update(id, dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.trainingRecordsService.remove(id, req.user);
  }
}
