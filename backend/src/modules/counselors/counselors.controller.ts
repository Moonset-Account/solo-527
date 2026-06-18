import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { CounselorsService } from './counselors.service';
import { Counselor } from './counselor.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('counselors')
export class CounselorsController {
  constructor(private readonly counselorsService: CounselorsService) {}

  @Get()
  findAll(@Query('active') active?: string): Promise<Counselor[]> {
    return this.counselorsService.findAll(active === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Counselor | null> {
    return this.counselorsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() counselor: Partial<Counselor>): Promise<Counselor> {
    return this.counselorsService.create(counselor);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() counselor: Partial<Counselor>): Promise<Counselor | null> {
    return this.counselorsService.update(id, counselor);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.counselorsService.remove(id);
  }
}
