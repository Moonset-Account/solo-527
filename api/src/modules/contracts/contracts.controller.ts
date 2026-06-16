import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ContractsService } from './contracts.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { SignContractDto } from './dto/sign-contract.dto.js';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto);
  }

  @Get()
  findAll() {
    return this.contractsService.findAll();
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
}
