import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ChangeWindowsService } from './change-windows.service';
import { CreateChangeWindowDto } from './dto/create-change-window.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('change-windows')
@UseGuards(JwtAuthGuard)
export class ChangeWindowsController {
  constructor(private changeWindowsService: ChangeWindowsService) {}

  @Get()
  async findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.changeWindowsService.findAll(entityType, entityId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.changeWindowsService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateChangeWindowDto, @CurrentUser() user: any) {
    return this.changeWindowsService.create(createDto, user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateChangeWindowDto>, @CurrentUser() user: any) {
    return this.changeWindowsService.update(id, updateDto, user);
  }
}
