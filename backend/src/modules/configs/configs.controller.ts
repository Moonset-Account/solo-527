import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Patch,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ConfigsService } from './configs.service';
import {
  CreateConfigDto,
  UpdateConfigDto,
  QueryConfigDto,
  ConfigQueryDto,
} from '../../dto/config.dto';
import { Config, ChangeLog } from '../../schemas/config.schema';

export type ConfigQueryDtoAlias = ConfigQueryDto;

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createConfigDto: CreateConfigDto) {
    try {
      const result = await this.configsService.create(createConfigDto);
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
  async findAll(@Query() query: QueryConfigDto) {
    try {
      const result = await this.configsService.findAll(query);
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

  @Get('key/:key')
  async findByKey(@Param('key') key: string) {
    try {
      const result = await this.configsService.findByKey(key);
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

  @Get('type/:type')
  async getByType(@Param('type') type: string) {
    try {
      const result = await this.configsService.getByType(type);
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

  @Get('group/by-type')
  async groupByType() {
    try {
      const result = await this.configsService.groupByType();
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
      const result = await this.configsService.findOne(id);
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

  @Get(':id/changelog')
  async getChangeLog(@Param('id') id: string) {
    try {
      const result = await this.configsService.getChangeLog(id);
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
    @Body() updateConfigDto: UpdateConfigDto,
  ) {
    try {
      const result = await this.configsService.update(id, updateConfigDto);
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
      const result = await this.configsService.remove(id);
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

  @Patch(':id/enable')
  async enable(
    @Param('id') id: string,
    @Body('modifiedBy') modifiedBy?: string,
  ) {
    try {
      const result = await this.configsService.enable(id, modifiedBy);
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

  @Patch(':id/disable')
  async disable(
    @Param('id') id: string,
    @Body('modifiedBy') modifiedBy?: string,
  ) {
    try {
      const result = await this.configsService.disable(id, modifiedBy);
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
