import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ExceptionsService } from './exceptions.service';
import { CreateExceptionDto, AssignExceptionDto, UpdateExceptionStatusDto, SubmitConclusionDto, CloseExceptionDto, UpdateRefundDto, QueryExceptionsDto } from './dto/exception.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('exceptions')
export class ExceptionsController {
  constructor(private readonly exceptionsService: ExceptionsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 20))
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateExceptionDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('name') userName: string,
  ) {
    return this.exceptionsService.create(dto, files, userId, userName);
  }

  @Get()
  findAll(
    @Query() query: QueryExceptionsDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.exceptionsService.findAll(query, userId, userRole);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.BLOGGER)
  getStatistics() {
    return this.exceptionsService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exceptionsService.findOne(id);
  }

  @Put(':id/assign')
  @Roles(UserRole.ADMIN)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignExceptionDto,
    @GetCurrentUser('id') operatorId: string,
    @GetCurrentUser('role') operatorRole: string,
  ) {
    return this.exceptionsService.assign(id, dto, operatorId, operatorRole);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExceptionStatusDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.exceptionsService.updateStatus(id, dto, userId, userRole);
  }

  @Put(':id/conclusion')
  @Roles(UserRole.BLOGGER, UserRole.ADMIN)
  submitConclusion(
    @Param('id') id: string,
    @Body() dto: SubmitConclusionDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.exceptionsService.submitConclusion(id, dto, userId, userRole);
  }

  @Put(':id/refund')
  @Roles(UserRole.ADMIN)
  updateRefund(
    @Param('id') id: string,
    @Body() dto: UpdateRefundDto,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.exceptionsService.updateRefund(id, dto, operatorId);
  }

  @Put(':id/close')
  @Roles(UserRole.ADMIN)
  close(
    @Param('id') id: string,
    @Body() dto: CloseExceptionDto,
    @GetCurrentUser('id') operatorId: string,
    @GetCurrentUser('role') operatorRole: string,
  ) {
    return this.exceptionsService.close(id, dto, operatorId, operatorRole);
  }

  @Post(':id/follow-up')
  addFollowUp(
    @Param('id') id: string,
    @Body('note') note: string,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.exceptionsService.addFollowUp(id, note, operatorId);
  }

  @Post(':id/upload')
  @UseInterceptors(FilesInterceptor('files', 20))
  uploadAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('isKey') isKey: string,
    @Body('remark') remark: string,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.exceptionsService.uploadAttachments(id, files, {
      isKey: isKey === 'true',
      remark,
    }, operatorId);
  }
}
