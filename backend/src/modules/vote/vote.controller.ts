import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VoteService } from './vote.service';
import { CreateVoteDto, UpdateVoteDto, CastVoteDto, CreateVoteRuleDto, QueryVoteDto } from './dto/vote.dto';
import { Vote } from './entities/vote.entity';
import { VoteRecord } from './entities/vote-record.entity';
import { VoteRule } from './entities/vote-rule.entity';

@Controller('votes')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post('rules')
  createRule(@Body() createVoteRuleDto: CreateVoteRuleDto): Promise<VoteRule> {
    return this.voteService.createRule(createVoteRuleDto);
  }

  @Get('rules')
  findAllRules(): Promise<VoteRule[]> {
    return this.voteService.findAllRules();
  }

  @Get('rules/:id')
  findOneRule(@Param('id') id: string): Promise<VoteRule> {
    return this.voteService.findOneRule(id);
  }

  @Put('rules/:id')
  updateRule(
    @Param('id') id: string,
    @Body() updateVoteRuleDto: Partial<CreateVoteRuleDto>,
  ): Promise<VoteRule> {
    return this.voteService.updateRule(id, updateVoteRuleDto);
  }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string): Promise<void> {
    return this.voteService.deleteRule(id);
  }

  @Post()
  create(@Body() createVoteDto: CreateVoteDto): Promise<Vote> {
    return this.voteService.create(createVoteDto);
  }

  @Get()
  findAll(@Query() query?: QueryVoteDto): Promise<Vote[]> {
    return this.voteService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Vote> {
    return this.voteService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateVoteDto: UpdateVoteDto): Promise<Vote> {
    return this.voteService.update(id, updateVoteDto);
  }

  @Post(':id/start')
  startVote(@Param('id') id: string): Promise<Vote> {
    return this.voteService.startVote(id);
  }

  @Post(':id/end')
  endVote(@Param('id') id: string): Promise<Vote> {
    return this.voteService.endVote(id);
  }

  @Post(':id/vote')
  castVote(@Param('id') id: string, @Body() castVoteDto: CastVoteDto): Promise<VoteRecord> {
    return this.voteService.castVote(id, castVoteDto);
  }

  @Get(':id/records')
  getVoteRecords(@Param('id') id: string): Promise<VoteRecord[]> {
    return this.voteService.getVoteRecords(id);
  }

  @Get(':id/record/:voterId')
  getVoteRecord(
    @Param('id') id: string,
    @Param('voterId') voterId: string,
  ): Promise<VoteRecord | null> {
    return this.voteService.getVoteRecord(id, voterId);
  }
}
