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
import { PetsService } from './pets.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { PetStatus, PetSource } from '../../entities/pet.entity';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('status') status?: PetStatus,
    @Query('source') source?: PetSource,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('volunteerId') volunteerId?: string,
  ) {
    return this.petsService.findAll({
      page,
      pageSize,
      status,
      source,
      startDate,
      endDate,
      volunteerId,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async create(@Body() dto: any, @Request() req) {
    return this.petsService.create(dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.petsService.update(id, dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.petsService.remove(id, req.user);
  }
}
