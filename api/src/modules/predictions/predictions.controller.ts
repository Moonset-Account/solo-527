import { Controller, Get, UseGuards } from '@nestjs/common';
import { PredictionsService } from './predictions.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Get()
  async findAll() {
    return this.predictionsService.findAll();
  }

  @Get('funnel')
  async getFunnel() {
    return this.predictionsService.getFunnel();
  }

  @Get('risks')
  async getRisks() {
    return this.predictionsService.getRisks();
  }
}
