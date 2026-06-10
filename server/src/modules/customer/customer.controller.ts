import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('客户管理')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: '获取客户列表' })
  findAll(@Query() pagination: PaginationDto) {
    return this.customerService.findAll(pagination);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索客户（按名称、联系人、电话）' })
  @ApiQuery({ name: 'name', required: false, description: '客户名称' })
  @ApiQuery({ name: 'contactPerson', required: false, description: '联系人' })
  @ApiQuery({ name: 'phone', required: false, description: '联系电话' })
  search(
    @Query() pagination: PaginationDto,
    @Query('name') name?: string,
    @Query('contactPerson') contactPerson?: string,
    @Query('phone') phone?: string,
  ) {
    return this.customerService.search(pagination, { name, contactPerson, phone });
  }

  @Get('name/:name')
  @ApiOperation({ summary: '按名称查找客户' })
  findByName(@Param('name') name: string) {
    return this.customerService.findByName(name);
  }

  @Get('contact/:contactPerson')
  @ApiOperation({ summary: '按联系人查找客户' })
  findByContactPerson(@Param('contactPerson') contactPerson: string) {
    return this.customerService.findByContactPerson(contactPerson);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取客户详情' })
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Get(':id/price-lists')
  @ApiOperation({ summary: '获取客户价目表' })
  getCustomerPriceLists(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.customerService.getCustomerPriceLists(id, pagination);
  }

  @Post()
  @ApiOperation({ summary: '创建客户' })
  create(@Body() dto: any, @Query('operator') operator: string = 'system') {
    return this.customerService.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新客户' })
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @Query('operator') operator: string = 'system',
  ) {
    return this.customerService.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除客户' })
  async remove(@Param('id') id: string) {
    await this.customerService.remove(id);
    return { success: true };
  }
}
