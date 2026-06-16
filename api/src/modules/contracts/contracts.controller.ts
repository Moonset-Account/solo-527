import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ContractsService } from './contracts.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { SignContractDto } from './dto/sign-contract.dto.js';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto.js';
import { UpdateContractTemplateDto } from './dto/update-contract-template.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.contractsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.remove(id);
  }

  @Put(':id/sign')
  sign(@Param('id', ParseIntPipe) id: number, @Body() dto: SignContractDto) {
    return this.contractsService.sign(id, dto);
  }

  @Get('templates')
  findAllTemplates(@Query() query: PaginationQueryDto) {
    return this.contractsService.findAllTemplates(query);
  }

  @Get('templates/:id')
  findOneTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.findOneTemplate(id);
  }

  @Post('templates')
  createTemplate(@Body() dto: CreateContractTemplateDto) {
    return this.contractsService.createTemplate(dto);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContractTemplateDto) {
    return this.contractsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.removeTemplate(id);
  }
}
