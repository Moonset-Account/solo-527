import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SeedService } from './seed.service.js';
import { SandboxMode, SandboxGuard } from '../../common/decorators/sandbox.decorator.js';

@ApiTags('seed')
@Controller('seed')
@UseGuards(SandboxGuard)
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @SandboxMode(true)
  async seed(@Req() req: Request): Promise<{ success: boolean; message: string }> {
    return this.seedService.seed();
  }

  @Get('status')
  @SandboxMode(true)
  async getStatus(@Req() req: Request): Promise<{ available: boolean; isSandbox: boolean }> {
    return {
      available: true,
      isSandbox: req.isSandbox,
    };
  }
}
