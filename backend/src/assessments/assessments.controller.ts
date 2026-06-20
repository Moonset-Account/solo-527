import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchDto } from '../common/dto/search.dto';

@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.INTERVIEWER)
  create(@Body() createAssessmentDto: CreateAssessmentDto, @CurrentUser() user: any) {
    return this.assessmentsService.create(createAssessmentDto, user.id);
  }

  @Get()
  findAll(@Query() searchDto: SearchDto, @CurrentUser() user: any) {
    return this.assessmentsService.findAll(searchDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findById(id);
  }

  @Get('interview/:interviewId')
  findByInterviewId(@Param('interviewId') interviewId: string) {
    return this.assessmentsService.findByInterviewId(interviewId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.INTERVIEWER)
  update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: CreateAssessmentDto,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.update(id, updateAssessmentDto, user.id);
  }
}
