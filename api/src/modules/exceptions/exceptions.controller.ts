import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ExceptionsService } from './exceptions.service.js';
import { CreateExceptionDto } from './dto/create-exception.dto.js';
import { UpdateExceptionDto } from './dto/update-exception.dto.js';
import { ResolveExceptionDto } from './dto/resolve-exception.dto.js';

@Controller('exceptions')
export class ExceptionsController {
  constructor(private readonly exceptionsService: ExceptionsService) {}

  @Post()
  create(@Body() dto: CreateExceptionDto) {
    return this.exceptionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.exceptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exceptionsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExceptionDto) {
    return this.exceptionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.exceptionsService.remove(id);
  }

  @Put(':id/resolve')
  resolve(@Param('id', ParseIntPipe) id: number, @Body() dto: ResolveExceptionDto) {
    return this.exceptionsService.resolve(id, dto);
  }
}
