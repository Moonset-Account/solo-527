import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { Event } from '../event/entities/event.entity';
import { Task } from '../task/entities/task.entity';
import { Todo } from '../todo/entities/todo.entity';
import { Vote } from '../vote/entities/vote.entity';
import { User } from '../user/entities/user.entity';
import { VoteRecord } from '../vote/entities/vote-record.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VoteRecord)
    private voteRecordRepository: Repository<VoteRecord>,
  ) {}

  async getHelpProgressReport(startDate?: string, endDate?: string): Promise<any> {
    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const dateRange = Between(start, end);

    const totalEvents = await this.eventRepository.count({
      where: { createdAt: dateRange, deleted: false },
    });

    const completedEvents = await this.eventRepository.count({
      where: { createdAt: dateRange, deleted: false, status: 'completed' },
    });

    const closedEvents = await this.eventRepository.count({
      where: { createdAt: dateRange, deleted: false, status: 'closed' },
    });

    const totalTasks = await this.taskRepository.count({
      where: { createdAt: dateRange, deleted: false },
    });

    const completedTasks = await this.taskRepository.count({
      where: { createdAt: dateRange, deleted: false, status: 'completed' },
    });

    const votingExceptions = await this.todoRepository.count({
      where: {
        createdAt: dateRange,
        deleted: false,
        type: 'voting_exception',
        affectsHelpProgress: true,
      },
    });

    const unresolvedVotingExceptions = await this.todoRepository.count({
      where: {
        createdAt: dateRange,
        deleted: false,
        type: 'voting_exception',
        affectsHelpProgress: true,
        status: Not('completed'),
      },
    });

    const eventClosureRate = totalEvents > 0 ? ((completedEvents + closedEvents) / totalEvents * 100).toFixed(2) : '0.00';
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : '0.00';

    const impactScore = Math.max(0, 100 - (unresolvedVotingExceptions * 10));

    return {
      period: { start, end },
      summary: {
        totalEvents,
        completedEvents,
        closedEvents,
        eventClosureRate: `${eventClosureRate}%`,
        totalTasks,
        completedTasks,
        taskCompletionRate: `${taskCompletionRate}%`,
        votingExceptions,
        unresolvedVotingExceptions,
        impactScore,
        helpProgressStatus: impactScore >= 80 ? '良好' : impactScore >= 60 ? '一般' : '较差',
      },
      impactAnalysis: {
        votingExceptionImpact: `投票资格异常导致帮扶进度扣减 ${unresolvedVotingExceptions * 10} 分`,
        recommendation: this.getRecommendation(unresolvedVotingExceptions, completedEvents, totalEvents),
      },
    };
  }

  async getEventClosureStats(): Promise<any> {
    const types = ['rectification', 'vote', 'patrol'] as const;
    const statuses = ['pending', 'processing', 'reviewing', 'voting', 'completed', 'closed'] as const;
    const result: any = {};

    for (const type of types) {
      result[type] = {};
      for (const status of statuses) {
        result[type][status] = await this.eventRepository.count({
          where: { type: type as any, status: status as any, deleted: false },
        });
      }
    }

    return result;
  }

  async getPerformanceByUser(startDate?: string, endDate?: string): Promise<any[]> {
    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const users = await this.userRepository.find({
      where: { deleted: false, role: In(['worker', 'manager']) },
    });

    const result = [];
    const dateRange = Between(start, end);

    for (const user of users) {
      const assignedEvents = await this.eventRepository.count({
        where: { assigneeId: user.id, createdAt: dateRange, deleted: false },
      });

      const completedEvents = await this.eventRepository.count({
        where: { assigneeId: user.id, createdAt: dateRange, deleted: false, status: In(['completed', 'closed']) },
      });

      const assignedTasks = await this.taskRepository.count({
        where: { assigneeId: user.id, createdAt: dateRange, deleted: false },
      });

      const completedTasks = await this.taskRepository.count({
        where: { assigneeId: user.id, createdAt: dateRange, deleted: false, status: 'completed' },
      });

      const todoCount = await this.todoRepository.count({
        where: { assigneeId: user.id, createdAt: dateRange, deleted: false },
      });

      const completedTodos = await this.todoRepository.count({
        where: { assigneeId: user.id, createdAt: dateRange, deleted: false, status: 'completed' },
      });

      result.push({
        userId: user.id,
        userName: user.name,
        role: user.role,
        shift: user.shift,
        gridArea: user.gridArea,
        assignedEvents,
        completedEvents,
        eventCompletionRate: assignedEvents > 0 ? (completedEvents / assignedEvents * 100).toFixed(2) : '0.00',
        assignedTasks,
        completedTasks,
        taskCompletionRate: assignedTasks > 0 ? (completedTasks / assignedTasks * 100).toFixed(2) : '0.00',
        todoCount,
        completedTodos,
        todoCompletionRate: todoCount > 0 ? (completedTodos / todoCount * 100).toFixed(2) : '0.00',
      });
    }

    return result.sort((a, b) => parseFloat(b.eventCompletionRate) - parseFloat(a.eventCompletionRate));
  }

  async getVoteParticipationStats(): Promise<any> {
    const totalVotes = await this.voteRepository.count({
      where: { deleted: false, status: 'ended' },
    });

    const totalVoteRecords = await this.voteRecordRepository.count({
      where: { deleted: false },
    });

    const exceptionRecords = await this.voteRecordRepository.count({
      where: { deleted: false, hasVotingException: true },
    });

    const users = await this.userRepository.find({
      where: { deleted: false, isVotingEligible: true },
    });

    const eligibleVoterCount = users.length;

    const averageParticipation = eligibleVoterCount > 0 && totalVotes > 0
      ? (totalVoteRecords / (eligibleVoterCount * totalVotes) * 100).toFixed(2)
      : '0.00';

    return {
      totalCompletedVotes: totalVotes,
      totalVotesCast: totalVoteRecords,
      exceptionRecords,
      exceptionRate: totalVoteRecords > 0 ? (exceptionRecords / totalVoteRecords * 100).toFixed(2) : '0.00',
      eligibleVoterCount,
      averageParticipationRate: `${averageParticipation}%`,
    };
  }

  async getShiftStats(): Promise<any> {
    const shifts = ['morning', 'afternoon', 'night'];
    const result: any = {};

    for (const shift of shifts) {
      const users = await this.userRepository.find({
        where: { shift: shift as any, deleted: false },
        select: ['id'],
      });
      const userIds = users.map(u => u.id);

      if (userIds.length > 0) {
        const pendingTasks = await this.taskRepository.count({
          where: { assigneeId: In(userIds), deleted: false, status: 'pending' },
        });

        const inProgressTasks = await this.taskRepository.count({
          where: { assigneeId: In(userIds), deleted: false, status: 'in_progress' },
        });

        const completedTasks = await this.taskRepository.count({
          where: { assigneeId: In(userIds), deleted: false, status: 'completed' },
        });

        result[shift] = {
          userCount: users.length,
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };
      } else {
        result[shift] = {
          userCount: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          completedTasks: 0,
        };
      }
    }

    return result;
  }

  private getRecommendation(unresolvedExceptions: number, completedEvents: number, totalEvents: number): string {
    const recommendations: string[] = [];

    if (unresolvedExceptions > 0) {
      recommendations.push(`请及时处理 ${unresolvedExceptions} 个投票资格异常待办`);
    }

    if (totalEvents > 0 && completedEvents / totalEvents < 0.6) {
      recommendations.push('事件闭环率偏低，建议加快处理进度');
    }

    if (recommendations.length === 0) {
      recommendations.push('帮扶进度良好，继续保持');
    }

    return recommendations.join('；');
  }
}
