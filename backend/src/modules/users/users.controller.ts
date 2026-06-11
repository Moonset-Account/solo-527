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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUserDto,
} from '../../dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const result = await this.usersService.create(createUserDto);
      return {
        code: 0,
        message: result.message || '操作成功',
        data: result.data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '错误',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(@Query() query: QueryUserDto) {
    try {
      const result = await this.usersService.findAll(query);
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

  @Get('phone/:phone')
  async findByPhone(@Param('phone') phone: string) {
    try {
      const result = await this.usersService.findByPhone(phone);
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
      const result = await this.usersService.findOne(id);
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
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const result = await this.usersService.update(id, updateUserDto);
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
      const result = await this.usersService.remove(id);
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
