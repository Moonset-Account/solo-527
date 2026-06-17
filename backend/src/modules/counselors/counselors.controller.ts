import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CounselorsService } from './counselors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('counselors')
export class CounselorsController {
  constructor(private readonly counselorsService: CounselorsService) {}

  @Get('public')
  findAllPublic() {
    return this.counselorsService.findAllPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('status') status?: string,
    @Query('specialty') specialty?: string,
  ) {
    return this.counselorsService.findAll(page, pageSize, status, specialty);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.counselorsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCounselorDto: any) {
    return this.counselorsService.create(createCounselorDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateCounselorDto: any) {
    return this.counselorsService.update(id, updateCounselorDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.counselorsService.remove(id);
  }
}
