import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';
import {
  CreateAnomalyDto,
  UpdateAnomalyDto,
  QueryAnomaliesDto,
  BatchAssignDto,
} from './dto/anomaly.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('anomalies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Post()
  @Roles('admin', 'manager', 'operator')
  create(@Body() createDto: CreateAnomalyDto, @CurrentUser() user: any) {
    return this.anomaliesService.create(createDto, user);
  }

  @Get()
  findAll(@Query() query: QueryAnomaliesDto) {
    return this.anomaliesService.findAll(query);
  }

  @Get('statistics')
  getStatistics() {
    return this.anomaliesService.getStatistics();
  }

  @Get('pending-summary')
  getPendingSummary() {
    return this.anomaliesService.getPendingSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.anomaliesService.findOne(id);
  }

  @Get(':id/events')
  getEvents(@Param('id') id: string) {
    return this.anomaliesService.getEvents(id);
  }

  @Get(':id/trend')
  getTrendData(@Param('id') id: string) {
    return this.anomaliesService.getTrendData(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAnomalyDto,
    @CurrentUser() user: any,
  ) {
    return this.anomaliesService.update(id, updateDto, user);
  }

  @Post('batch-assign')
  @Roles('admin', 'manager')
  batchAssign(@Body() batchDto: BatchAssignDto, @CurrentUser() user: any) {
    return this.anomaliesService.batchAssign(batchDto, user);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.anomaliesService.remove(id, user);
  }
}
