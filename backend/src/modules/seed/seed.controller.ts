import { Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { VoteRule } from '../vote/entities/vote-rule.entity';

@Controller('seed')
export class SeedController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VoteRule)
    private voteRuleRepository: Repository<VoteRule>,
  ) {}

  @Post()
  async seed() {
    const results: string[] = [];

    const existingAdmin = await this.userRepository.findOne({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const users = [
        { username: 'admin', password: hashedPassword, name: '系统管理员', role: 'admin' as const, shift: 'morning' as const, phone: '13800138000', gridArea: 'grid1', isVotingEligible: true },
        { username: 'manager1', password: hashedPassword, name: '张经理', role: 'manager' as const, shift: 'morning' as const, phone: '13800138001', gridArea: 'grid1', isVotingEligible: true },
        { username: 'worker1', password: hashedPassword, name: '李网格员', role: 'worker' as const, shift: 'afternoon' as const, phone: '13800138002', gridArea: 'grid2', isVotingEligible: true },
        { username: 'worker2', password: hashedPassword, name: '王网格员', role: 'worker' as const, shift: 'night' as const, phone: '13800138003', gridArea: 'grid3', isVotingEligible: false, votingIneligibleReason: '未完成培训' },
        { username: 'resident1', password: hashedPassword, name: '陈居民', role: 'resident' as const, shift: 'morning' as const, phone: '13800138004', gridArea: 'grid1', isVotingEligible: true },
      ];

      for (const userData of users) {
        const existing = await this.userRepository.findOne({
          where: { username: userData.username },
        });
        if (!existing) {
          const user = this.userRepository.create(userData);
          await this.userRepository.save(user);
          results.push(`用户 ${userData.name} 已创建`);
        }
      }
    } else {
      results.push('用户数据已存在，跳过');
    }

    const existingRule = await this.voteRuleRepository.findOne({
      where: { name: '普通投票规则' },
    });

    if (!existingRule) {
      const rules = [
        { name: '普通投票规则', description: '适用于一般社区事务的投票表决', passThreshold: 50, quorumThreshold: 30, votingDurationHours: 24, allowProxyVoting: true, isDefault: true, eligibleRoles: ['admin', 'manager', 'worker', 'resident'] },
        { name: '重大事项投票规则', description: '适用于重要事项的投票表决，要求更高的参与率和通过率', passThreshold: 67, quorumThreshold: 50, votingDurationHours: 72, allowProxyVoting: false, isDefault: false, eligibleRoles: ['admin', 'manager', 'worker'] },
      ];

      for (const ruleData of rules) {
        const existing = await this.voteRuleRepository.findOne({
          where: { name: ruleData.name },
        });
        if (!existing) {
          const rule = this.voteRuleRepository.create(ruleData);
          await this.voteRuleRepository.save(rule);
          results.push(`投票规则 ${ruleData.name} 已创建`);
        }
      }
    } else {
      results.push('投票规则已存在，跳过');
    }

    return { success: true, messages: results };
  }
}
