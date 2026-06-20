import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchDto } from '../common/dto/search.dto';
import { DifficultyLevel } from './schemas/question.schema';

@Controller('question-bank')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Post()
  @Roles(Role.ADMIN, Role.INTERVIEWER)
  create(@Body() createQuestionDto: CreateQuestionDto, @CurrentUser() user: any) {
    return this.questionBankService.create(createQuestionDto, user.id);
  }

  @Get()
  findAll(@Query() searchDto: SearchDto) {
    return this.questionBankService.findAll(searchDto);
  }

  @Get('categories')
  getCategories() {
    return this.questionBankService.getCategories();
  }

  @Get('statistics')
  getStatistics() {
    return this.questionBankService.getStatistics();
  }

  @Get('random')
  getRandomQuestions(
    @Query('count') count: number = 5,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: DifficultyLevel,
    @Query('excludeIds') excludeIds?: string,
  ) {
    const excludeIdArray = excludeIds ? excludeIds.split(',') : undefined;
    return this.questionBankService.getRandomQuestions(count, category, difficulty, excludeIdArray);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionBankService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.INTERVIEWER)
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: CreateQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.questionBankService.update(id, updateQuestionDto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.questionBankService.remove(id, user.id);
  }
}
