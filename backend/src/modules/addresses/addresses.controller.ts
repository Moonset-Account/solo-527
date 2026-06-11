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
import { AddressesService } from './addresses.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
  QueryAddressDto,
  SetDefaultDto,
} from '../../dto/address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAddressDto: CreateAddressDto) {
    try {
      const result = await this.addressesService.create(createAddressDto);
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
  async findAll(@Query() query: QueryAddressDto) {
    try {
      const result = await this.addressesService.findAll(query);
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
      const result = await this.addressesService.findOne(id);
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
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    try {
      const result = await this.addressesService.update(id, updateAddressDto);
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
      const result = await this.addressesService.remove(id);
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

  @Patch(':id/default')
  async setDefault(
    @Param('id') id: string,
    @Body() setDefaultDto: SetDefaultDto,
  ) {
    try {
      const result = await this.addressesService.setDefault(id, setDefaultDto);
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
