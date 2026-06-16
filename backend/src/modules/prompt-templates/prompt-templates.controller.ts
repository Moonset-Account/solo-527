import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { PromptTemplatesService } from './prompt-templates.service';
import { CreatePromptTemplateDto, UpdatePromptTemplateDto, QueryPromptTemplateDto } from './dto/prompt-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('prompt-templates')
@UseGuards(JwtAuthGuard)
export class PromptTemplatesController {
  constructor(private readonly promptTemplatesService: PromptTemplatesService) {}

  @Post()
  async create(
    @Body() createPromptTemplateDto: CreatePromptTemplateDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.promptTemplatesService.create(createPromptTemplateDto, user.sub || user.id);
  }

  @Get()
  async findAll(@Query() queryDto: QueryPromptTemplateDto) {
    return this.promptTemplatesService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.promptTemplatesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePromptTemplateDto: UpdatePromptTemplateDto,
  ) {
    return this.promptTemplatesService.update(id, updatePromptTemplateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.promptTemplatesService.remove(id);
    return { success: true };
  }
}
