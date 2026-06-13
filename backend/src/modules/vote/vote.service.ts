import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Vote, VoteStatus } from './entities/vote.entity';
import { VoteRecord } from './entities/vote-record.entity';
import { VoteRule } from './entities/vote-rule.entity';
import { User } from '../user/entities/user.entity';
import { Todo } from '../todo/entities/todo.entity';
import { CreateVoteDto, UpdateVoteDto, CastVoteDto, CreateVoteRuleDto, QueryVoteDto } from './dto/vote.dto';

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
    @InjectRepository(VoteRecord)
    private voteRecordRepository: Repository<VoteRecord>,
    @InjectRepository(VoteRule)
    private voteRuleRepository: Repository<VoteRule>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async createRule(createVoteRuleDto: CreateVoteRuleDto): Promise<VoteRule> {
    if (createVoteRuleDto.isDefault) {
      await this.voteRuleRepository.update({ isDefault: true }, { isDefault: false });
    }
    const rule = this.voteRuleRepository.create(createVoteRuleDto);
    return this.voteRuleRepository.save(rule);
  }

  async findAllRules(): Promise<VoteRule[]> {
    return this.voteRuleRepository.find({
      where: { deleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneRule(id: string): Promise<VoteRule> {
    const rule = await this.voteRuleRepository.findOne({
      where: { id, deleted: false },
    });
    if (!rule) {
      throw new NotFoundException('投票规则不存在');
    }
    return rule;
  }

  async updateRule(id: string, updateVoteRuleDto: Partial<CreateVoteRuleDto>): Promise<VoteRule> {
    const rule = await this.findOneRule(id);
    
    if (updateVoteRuleDto.isDefault) {
      await this.voteRuleRepository.update({ isDefault: true, id: Not(id) }, { isDefault: false });
    }
    
    Object.assign(rule, updateVoteRuleDto);
    return this.voteRuleRepository.save(rule);
  }

  async deleteRule(id: string): Promise<void> {
    const rule = await this.findOneRule(id);
    rule.deleted = true;
    await this.voteRuleRepository.save(rule);
  }

  async create(createVoteDto: CreateVoteDto): Promise<Vote> {
    const options = createVoteDto.options.map((opt, index) => ({
      id: `opt_${Date.now()}_${index}`,
      text: opt.text,
      count: 0,
    }));

    let ruleId = createVoteDto.ruleId;
    if (!ruleId) {
      const defaultRule = await this.voteRuleRepository.findOne({
        where: { isDefault: true, deleted: false },
      });
      if (defaultRule) {
        ruleId = defaultRule.id;
      }
    }

    const eligibleVoters = await this.countEligibleVoters(ruleId);

    const vote = this.voteRepository.create({
      ...createVoteDto,
      options,
      ruleId,
      eligibleVoters,
      status: 'draft',
    });

    return this.voteRepository.save(vote);
  }

  async findAll(query?: QueryVoteDto): Promise<Vote[]> {
    const where: any = { deleted: false };
    if (query?.status) where.status = query.status;
    if (query?.creatorId) where.creatorId = query.creatorId;
    if (query?.eventId) where.eventId = query.eventId;

    return this.voteRepository.find({
      where,
      relations: ['creator', 'rule', 'event', 'records'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Vote> {
    const vote = await this.voteRepository.findOne({
      where: { id, deleted: false },
      relations: ['creator', 'rule', 'event', 'records', 'records.voter'],
    });
    if (!vote) {
      throw new NotFoundException('投票不存在');
    }
    return vote;
  }

  async update(id: string, updateVoteDto: UpdateVoteDto): Promise<Vote> {
    const vote = await this.findOne(id);
    
    if (vote.status === 'ongoing' || vote.status === 'ended') {
      throw new BadRequestException('投票进行中或已结束，无法修改');
    }

    if (updateVoteDto.options) {
      updateVoteDto.options = updateVoteDto.options.map((opt, index) => ({
        id: `opt_${Date.now()}_${index}`,
        text: opt.text,
        count: 0,
      })) as any;
    }

    Object.assign(vote, updateVoteDto);
    return this.voteRepository.save(vote);
  }

  async startVote(id: string): Promise<Vote> {
    const vote = await this.findOne(id);
    
    if (vote.status !== 'draft') {
      throw new BadRequestException('只能启动草稿状态的投票');
    }

    const now = new Date();
    vote.status = 'ongoing';
    vote.startTime = now;

    if (vote.rule && !vote.endTime) {
      const endTime = new Date(now.getTime() + vote.rule.votingDurationHours * 60 * 60 * 1000);
      vote.endTime = endTime;
    }

    return this.voteRepository.save(vote);
  }

  async endVote(id: string): Promise<Vote> {
    const vote = await this.findOne(id);
    
    if (vote.status !== 'ongoing') {
      throw new BadRequestException('只能结束进行中的投票');
    }

    vote.status = 'ended';
    vote.endTime = new Date();

    return this.voteRepository.save(vote);
  }

  async castVote(voteId: string, castVoteDto: CastVoteDto): Promise<VoteRecord> {
    const vote = await this.findOne(voteId);
    
    if (vote.status !== 'ongoing') {
      throw new BadRequestException('投票未开始或已结束');
    }

    const voter = await this.userRepository.findOne({
      where: { id: castVoteDto.voterId, deleted: false },
    });
    if (!voter) {
      throw new NotFoundException('投票人不存在');
    }

    const existingRecord = await this.voteRecordRepository.findOne({
      where: { voteId, voterId: castVoteDto.voterId, deleted: false },
    });
    if (existingRecord) {
      throw new BadRequestException('您已经投过票了');
    }

    let hasVotingException = false;
    let votingExceptionReason = '';

    if (!voter.isVotingEligible) {
      hasVotingException = true;
      votingExceptionReason = voter.votingIneligibleReason || '投票资格异常';
      
      await this.createVotingExceptionTodo(voter.id, voteId, votingExceptionReason);
    }

    if (vote.rule?.eligibleRoles && vote.rule.eligibleRoles.length > 0) {
      if (!vote.rule.eligibleRoles.includes(voter.role)) {
        hasVotingException = true;
        votingExceptionReason = '角色无投票权限';
        
        await this.createVotingExceptionTodo(voter.id, voteId, votingExceptionReason);
      }
    }

    const record = this.voteRecordRepository.create({
      ...castVoteDto,
      voteId,
      hasVotingException,
      votingExceptionReason,
    });

    const savedRecord = await this.voteRecordRepository.save(record);

    if (!castVoteDto.isAbstained && castVoteDto.selectedOptions) {
      for (const optionId of castVoteDto.selectedOptions) {
        const option = vote.options.find(opt => opt.id === optionId);
        if (option) {
          option.count++;
        }
      }
    } else if (castVoteDto.isAbstained) {
      vote.abstainCount++;
    }

    vote.totalVotes++;
    await this.voteRepository.save(vote);

    return savedRecord;
  }

  private async countEligibleVoters(ruleId?: string): Promise<number> {
    const where: any = { deleted: false, isVotingEligible: true };
    
    if (ruleId) {
      const rule = await this.voteRuleRepository.findOne({
        where: { id: ruleId, deleted: false },
      });
      if (rule?.eligibleRoles && rule.eligibleRoles.length > 0) {
        where.role = In(rule.eligibleRoles);
      }
    }

    return this.userRepository.count({ where });
  }

  private async createVotingExceptionTodo(
    userId: string,
    voteId: string,
    reason: string,
  ): Promise<void> {
    const manager = await this.userRepository.findOne({
      where: { role: 'manager', deleted: false },
    });

    if (manager) {
      const todo = this.todoRepository.create({
        title: '投票资格异常待处理',
        description: `用户投票资格异常: ${reason}`,
        type: 'voting_exception',
        status: 'pending',
        priority: 2,
        relatedModule: 'vote',
        relatedId: voteId,
        affectsHelpProgress: true,
        helpProgressImpact: '投票资格异常影响帮扶进度统计',
        assigneeId: manager.id,
        creatorId: manager.id,
      });

      await this.todoRepository.save(todo);
    }
  }

  async getVoteRecord(voteId: string, voterId: string): Promise<VoteRecord | null> {
    return this.voteRecordRepository.findOne({
      where: { voteId, voterId, deleted: false },
    });
  }

  async getVoteRecords(voteId: string): Promise<VoteRecord[]> {
    return this.voteRecordRepository.find({
      where: { voteId, deleted: false },
      relations: ['voter'],
      order: { createdAt: 'DESC' },
    });
  }
}
