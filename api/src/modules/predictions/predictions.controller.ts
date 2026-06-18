import { Controller, Get, UseGuards } from '@nestjs/common';
import { PredictionsService } from './predictions.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Get()
  async findAll() {
    const result = await this.predictionsService.findAll();
    return { list: result, total: result.length, page: 1, pageSize: result.length };
  }

  @Get('funnel')
  async getFunnel() {
    return this.predictionsService.getFunnel();
  }

  @Get('risks')
  async getRisks() {
    const result = await this.predictionsService.getRisks();
    return [...result.high, ...result.medium];
  }
}
