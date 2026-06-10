import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Post()
  create(@Body() createDto: any, @CurrentUser('_id') userId: string) {
    return this.dictionaryService.create(createDto, userId);
  }

  @Post('batch')
  batchCreate(@Body() items: any[], @CurrentUser('_id') userId: string) {
    return this.dictionaryService.batchCreate(items, userId);
  }

  @Public()
  @Get()
  findAll(@Query() query: any) {
    return this.dictionaryService.findAll(query);
  }

  @Public()
  @Get('types')
  getDictTypes() {
    return this.dictionaryService.getDictTypes();
  }

  @Public()
  @Get('type/:dictType')
  findByType(@Param('dictType') dictType: string) {
    return this.dictionaryService.findByType(dictType);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dictionaryService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser('_id') userId: string,
  ) {
    return this.dictionaryService.update(id, updateDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dictionaryService.remove(id);
  }
}
