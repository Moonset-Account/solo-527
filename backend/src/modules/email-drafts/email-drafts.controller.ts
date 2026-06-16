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
import { EmailDraftsService } from './email-drafts.service';
import { CreateEmailDraftDto, UpdateEmailDraftDto, QueryEmailDraftDto, SubmitReviewDto, ReviewDraftDto } from './dto/email-draft.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request } from 'express';

@Controller('email-drafts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailDraftsController {
  constructor(private readonly emailDraftsService: EmailDraftsService) {}

  @Post()
  async create(
    @Body() createEmailDraftDto: CreateEmailDraftDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    const isDemo = user.role === 'demo';
    return this.emailDraftsService.create(createEmailDraftDto, user.sub || user.id, isDemo);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryEmailDraftDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.emailDraftsService.findAll(queryDto, user.sub || user.id, user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.emailDraftsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEmailDraftDto: UpdateEmailDraftDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.emailDraftsService.update(id, updateEmailDraftDto, user.sub || user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req['user'];
    await this.emailDraftsService.remove(id, user.sub || user.id, user.role);
    return { success: true };
  }

  @Post(':id/submit')
  async submitForReview(
    @Param('id') id: string,
    @Body() submitReviewDto: SubmitReviewDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.emailDraftsService.submitForReview(id, submitReviewDto, user.sub || user.id);
  }

  @Post(':id/review')
  @Roles('admin')
  async review(
    @Param('id') id: string,
    @Body() reviewDto: ReviewDraftDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.emailDraftsService.review(id, reviewDto, user.sub || user.id);
  }

  @Post(':id/send')
  async sendDraft(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.emailDraftsService.sendDraft(id, user.sub || user.id);
  }
}
