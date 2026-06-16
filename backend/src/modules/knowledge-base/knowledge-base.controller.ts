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
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto, QueryKnowledgeBaseDto } from './dto/knowledge-base.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Post()
  async create(
    @Body() createKnowledgeBaseDto: CreateKnowledgeBaseDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.knowledgeBaseService.create(createKnowledgeBaseDto, user.sub || user.id);
  }

  @Get()
  async findAll(@Query() queryDto: QueryKnowledgeBaseDto) {
    return this.knowledgeBaseService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.knowledgeBaseService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateKnowledgeBaseDto: UpdateKnowledgeBaseDto,
  ) {
    return this.knowledgeBaseService.update(id, updateKnowledgeBaseDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.knowledgeBaseService.remove(id);
    return { success: true };
  }
}
