import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class AppController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
