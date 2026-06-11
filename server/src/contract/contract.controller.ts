import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContractService } from './contract.service.js';
import { CreateContractDto, UpdateContractDto } from './dto.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Get('projects/:projectId/contract')
  async findByProject(@Param('projectId') projectId: string) {
    return this.contractService.findByProject(projectId);
  }

  @Post('projects/:projectId/contract')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractService.create(projectId, dto);
  }

  @Patch('contracts/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractService.update(id, dto);
  }

  @Post('contracts/:id/send')
  async send(@Param('id') id: string) {
    return this.contractService.send(id);
  }

  @Post('contracts/:id/sign')
  async sign(@Param('id') id: string, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.contractService.sign(id, ip);
  }
}
