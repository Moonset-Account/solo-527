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
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  QueryReportsDto,
} from './dto/report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles('admin', 'manager')
  create(
    @Body() createDto: CreateReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.create(createDto, user);
  }

  @Get()
  findAll(@Query() query: QueryReportsDto) {
    return this.reportsService.findAll(query);
  }

  @Get('latest/:type')
  getLatestPublished(@Param('type') type: 'weekly' | 'monthly') {
    return this.reportsService.getLatestPublished(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.update(id, updateDto, user);
  }

  @Patch(':id/publish')
  @Roles('admin', 'manager')
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.publish(id, user);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
