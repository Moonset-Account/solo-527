import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExceptionsService } from './exceptions.service';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { CloseExceptionDto } from './dto/close-exception.dto';
import { ExceptionQueryDto } from './dto/exception-query.dto';
import { Exception } from '../../schemas/exception.schema';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('异常管理')
@ApiBearerAuth()
@Controller('api/exceptions')
@UseGuards(JwtAuthGuard)
export class ExceptionsController {
  constructor(private readonly exceptionsService: ExceptionsService) {}

  @Get()
  @ApiOperation({ summary: '获取异常记录列表' })
  @ApiResponse({ status: 200, description: '成功获取异常记录列表' })
  async findAll(@Query() query: ExceptionQueryDto): Promise<PaginatedResponse<Exception>> {
    return this.exceptionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取异常记录详情' })
  @ApiResponse({ status: 200, type: Exception })
  async findOne(@Param('id') id: string): Promise<Exception> {
    return this.exceptionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建异常记录' })
  @ApiResponse({ status: 201, type: Exception })
  async create(@Body() createExceptionDto: CreateExceptionDto): Promise<Exception> {
    return this.exceptionsService.create(createExceptionDto);
  }

  @Post(':id/process')
  @ApiOperation({ summary: '开始处理异常' })
  @ApiResponse({ status: 200, type: Exception })
  async process(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Exception> {
    return this.exceptionsService.process(id, user);
  }

  @Post(':id/close')
  @ApiOperation({ summary: '关闭异常' })
  @ApiResponse({ status: 200, type: Exception })
  async close(
    @Param('id') id: string,
    @Body() closeExceptionDto: CloseExceptionDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Exception> {
    return this.exceptionsService.close(id, closeExceptionDto, user);
  }
}
