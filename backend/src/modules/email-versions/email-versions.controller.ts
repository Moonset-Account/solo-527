import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EmailVersionsService } from './email-versions.service';
import { CreateEmailVersionDto, QueryEmailVersionDto } from './dto/email-version.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('email-versions')
@UseGuards(JwtAuthGuard)
export class EmailVersionsController {
  constructor(private readonly emailVersionsService: EmailVersionsService) {}

  @Post()
  async create(
    @Body() createEmailVersionDto: CreateEmailVersionDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.emailVersionsService.create(createEmailVersionDto, user.sub || user.id);
  }

  @Get()
  async findByDraftId(@Query() queryDto: QueryEmailVersionDto) {
    return this.emailVersionsService.findByDraftId(queryDto);
  }

  @Get('latest/:draftId')
  async getLatestVersion(@Param('draftId') draftId: string) {
    return this.emailVersionsService.getLatestVersion(draftId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.emailVersionsService.findOne(id);
  }
}
