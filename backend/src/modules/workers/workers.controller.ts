import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { WorkersService } from './workers.service';
import {
  CreateWorkerDto,
  UpdateWorkerDto,
  QueryWorkerDto,
} from '../../dto/worker.dto';
import { Worker } from '../../schemas/worker.schema';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createWorkerDto: CreateWorkerDto) {
    try {
      const result = await this.workersService.create(createWorkerDto);
      return {
        code: 0,
        message: '操作成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(@Query() query: QueryWorkerDto) {
    try {
      const result = await this.workersService.findAll(query);
      return {
        code: 0,
        message: '操作成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('skill/:skillId')
  async findBySkill(@Param('skillId') skillId: string) {
    try {
      const result = await this.workersService.findBySkill(skillId);
      return {
        code: 0,
        message: '操作成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('community/:community')
  async findByCommunity(@Param('community') community: string) {
    try {
      const result = await this.workersService.findByCommunity(community);
      return {
        code: 0,
        message: '操作成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('available')
  async findAvailable(
    @Query('skillId') skillId?: string,
    @Query('community') community?: string,
  ) {
    try {
      const result = await this.workersService.findAvailable(skillId, community);
      return {
        code: 0,
        message: '操作成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.workersService.findOne(id);
      return {
        code: 0,
        message: '操作成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWorkerDto: UpdateWorkerDto,
  ) {
    try {
      const result = await this.workersService.update(id, updateWorkerDto);
      return {
        code: 0,
        message: '操作成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.workersService.remove(id);
      return {
        code: 0,
        message: '操作成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
