import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { Vehicle } from '../../schemas/vehicle.schema';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('车辆档案')
@Controller('vehicles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: '获取车辆分页列表' })
  @ApiResponse({ status: 200, description: '车辆列表' })
  async findAll(@Query() query: VehicleQueryDto): Promise<PaginatedResponse<Vehicle>> {
    return this.vehiclesService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索车辆' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: true })
  @ApiResponse({ status: 200, description: '搜索结果' })
  async search(
    @Query('keyword') keyword: string,
    @Query() query: VehicleQueryDto,
  ): Promise<PaginatedResponse<Vehicle>> {
    return this.vehiclesService.search(keyword, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取车辆详情' })
  @ApiResponse({ status: 200, description: '车辆详情', type: Vehicle })
  async findOne(@Param('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建车辆档案' })
  @ApiResponse({ status: 201, description: '创建成功', type: Vehicle })
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新车辆档案' })
  @ApiResponse({ status: 200, description: '更新成功', type: Vehicle })
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除车辆档案' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.vehiclesService.remove(id);
  }
}
