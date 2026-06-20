import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalFlow, ApprovalStatus, ApprovalNodeType } from '../../entities/approval-flow.entity';
import { Contract, ContractStatus } from '../../entities/contract.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { NotificationService } from '../notification/notification.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

export interface SubmitApprovalDto {
  contractId: string;
  steps: {
    nodeName: string;
    approverId: string;
    nodeType?: ApprovalNodeType;
  }[];
}

export interface ApproveDto {
  opinion?: string;
  signature?: Record<string, any>;
}

export interface RejectDto {
  rejectionReason: string;
  opinion?: string;
}

export interface TransferApprovalDto {
  newApproverId: string;
  reason: string;
}

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalFlow) private approvalRepo: Repository<ApprovalFlow>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
    private notificationService: NotificationService,
  ) {}

  async submitApproval(dto: SubmitApprovalDto, user: CurrentUserPayload) {
    const contract = await this.contractRepo.findOne({ where: { id: dto.contractId } });
    if (!contract) throw new NotFoundException('合同不存在');
    if (contract.status !== ContractStatus.DRAFT && contract.status !== ContractStatus.REJECTED) {
      throw new BadRequestException('当前状态不允许提交审批');
    }
    if (!contract.materialsComplete) {
      throw new BadRequestException('材料不完整，无法提交审批');
    }
    if (!dto.steps?.length) {
      throw new BadRequestException('审批流程不能为空');
    }

    await this.approvalRepo.delete({ contractId: contract.id });

    const steps: ApprovalFlow[] = [];
    dto.steps.forEach((s, idx) => {
      steps.push(
        this.approvalRepo.create({
          contractId: contract.id,
          nodeName: s.nodeName,
          stepOrder: idx + 1,
          approverId: s.approverId,
          nodeType: s.nodeType || ApprovalNodeType.SINGLE,
          status: idx === 0 ? ApprovalStatus.PENDING : ApprovalStatus.PENDING,
        }),
      );
    });
    await this.approvalRepo.save(steps);

    contract.status = ContractStatus.APPROVING;
    await this.contractRepo.save(contract);

    const firstApprover = steps[0];
    await this.notificationService.createNotification({
      recipientId: firstApprover.approverId,
      type: 'approval_request',
      channel: 'in_app',
      title: '新的审批待处理',
      content: `合同【${contract.contractNo}】${contract.title} 需要您审批，节点：${firstApprover.nodeName}`,
      relatedData: { contractId: contract.id, approvalId: firstApprover.id },
    });

    await this.addAuditLog(user.id, user.realName, AuditAction.APPROVE, 'contract', contract.id, contract.title, null, { action: 'submit', steps: steps.length });
    return { contract, steps };
  }

  async approve(approvalId: string, dto: ApproveDto, user: CurrentUserPayload) {
    const approval = await this.approvalRepo.findOne({ where: { id: approvalId }, relations: ['contract'] });
    if (!approval) throw new NotFoundException('审批记录不存在');
    if (approval.approverId !== user.id) throw new ForbiddenException('不是您的审批任务');
    if (approval.status !== ApprovalStatus.PENDING) throw new BadRequestException('审批已处理');

    const durationMs = Date.now() - new Date(approval.createdAt).getTime();
    approval.status = ApprovalStatus.APPROVED;
    approval.opinion = dto.opinion || '';
    approval.approvedAt = new Date();
    approval.durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
    approval.signature = dto.signature || null;
    await this.approvalRepo.save(approval);

    const contract = approval.contract;
    const remaining = await this.approvalRepo
      .createQueryBuilder('a')
      .where('a.contractId = :cid AND a.stepOrder > :so', { cid: contract.id, so: approval.stepOrder })
      .orderBy('a.stepOrder', 'ASC')
      .getMany();

    if (remaining.length === 0) {
      contract.status = ContractStatus.APPROVED;
      await this.contractRepo.save(contract);
      await this.notificationService.createNotification({
        recipientId: contract.applicantId,
        type: 'contract_approved',
        channel: 'in_app',
        title: '合同审批通过',
        content: `合同【${contract.contractNo}】${contract.title} 审批全部通过！`,
        relatedData: { contractId: contract.id },
      });
    } else {
      const next = remaining[0];
      next.status = ApprovalStatus.PENDING;
      await this.approvalRepo.save(next);
      await this.notificationService.createNotification({
        recipientId: next.approverId,
        type: 'approval_request',
        channel: 'in_app',
        title: '新的审批待处理',
        content: `合同【${contract.contractNo}】${contract.title} 需要您审批，节点：${next.nodeName}`,
        relatedData: { contractId: contract.id, approvalId: next.id },
      });
    }

    await this.addAuditLog(user.id, user.realName, AuditAction.APPROVE, 'approval', approval.id, approval.nodeName, null, { action: 'approve', contractId: contract.id });
    return approval;
  }

  async reject(approvalId: string, dto: RejectDto, user: CurrentUserPayload) {
    const approval = await this.approvalRepo.findOne({ where: { id: approvalId }, relations: ['contract'] });
    if (!approval) throw new NotFoundException('审批记录不存在');
    if (approval.approverId !== user.id) throw new ForbiddenException('不是您的审批任务');
    if (approval.status !== ApprovalStatus.PENDING) throw new BadRequestException('审批已处理');

    approval.status = ApprovalStatus.REJECTED;
    approval.rejectionReason = dto.rejectionReason;
    approval.opinion = dto.opinion || '';
    approval.approvedAt = new Date();
    await this.approvalRepo.save(approval);

    const contract = approval.contract;
    contract.status = ContractStatus.REJECTED;
    contract.rejectionReason = dto.rejectionReason;
    await this.contractRepo.save(contract);

    await this.notificationService.createNotification({
      recipientId: contract.applicantId,
      type: 'contract_rejected',
      channel: 'in_app',
      title: '合同审批被退回',
      content: `合同【${contract.contractNo}】${contract.title} 被退回。原因：${dto.rejectionReason}`,
      relatedData: { contractId: contract.id, approvalId: approval.id },
    });

    await this.addAuditLog(user.id, user.realName, AuditAction.REJECT, 'approval', approval.id, approval.nodeName, null, { action: 'reject', contractId: contract.id, reason: dto.rejectionReason });
    return approval;
  }

  async transfer(approvalId: string, dto: TransferApprovalDto, user: CurrentUserPayload) {
    const approval = await this.approvalRepo.findOne({ where: { id: approvalId }, relations: ['contract'] });
    if (!approval) throw new NotFoundException('审批记录不存在');
    if (approval.approverId !== user.id) throw new ForbiddenException('只能转交给自己的审批');
    if (approval.status !== ApprovalStatus.PENDING) throw new BadRequestException('审批已处理');

    approval.transferredToId = dto.newApproverId;
    approval.status = ApprovalStatus.TRANSFERRED;
    approval.opinion = `转交原因：${dto.reason}`;
    approval.approvedAt = new Date();
    await this.approvalRepo.save(approval);

    const newStep = this.approvalRepo.create({
      contractId: approval.contractId,
      nodeName: approval.nodeName + '(转交)',
      stepOrder: approval.stepOrder,
      approverId: dto.newApproverId,
      nodeType: approval.nodeType,
      status: ApprovalStatus.PENDING,
    });
    await this.approvalRepo.save(newStep);

    await this.notificationService.createNotification({
      recipientId: dto.newApproverId,
      type: 'approval_request',
      channel: 'in_app',
      title: '转交的审批任务',
      content: `审批人${user.realName}将合同【${approval.contract.contractNo}】的"${approval.nodeName}"节点转交给您处理。转交原因：${dto.reason}`,
      relatedData: { contractId: approval.contractId, approvalId: newStep.id },
    });

    await this.addAuditLog(user.id, user.realName, AuditAction.TRANSFER, 'approval', approval.id, approval.nodeName, null, { newApproverId: dto.newApproverId, reason: dto.reason });
    return { original: approval, new: newStep };
  }

  async getMyApprovalTasks(user: CurrentUserPayload, page = 1, pageSize = 20, status?: ApprovalStatus) {
    const qb = this.approvalRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.contract', 'c')
      .leftJoinAndSelect('c.applicant', 'applicant')
      .where('a.approverId = :uid', { uid: user.id });
    if (status) qb.andWhere('a.status = :st', { st: status });

    const [list, total] = await qb
      .orderBy('CASE WHEN a.status = :pending THEN 0 ELSE 1 END, a.createdAt', 'DESC')
      .setParameter('pending', ApprovalStatus.PENDING)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  async getApprovalHistory(contractId: string) {
    return this.approvalRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.approver', 'approver')
      .leftJoinAndSelect('a.transferredTo', 'transferredTo')
      .where('a.contractId = :cid', { cid: contractId })
      .orderBy('a.stepOrder', 'ASC')
      .addOrderBy('a.createdAt', 'ASC')
      .getMany();
  }

  private async addAuditLog(userId: string, userName: string, action: AuditAction, targetType: string, targetId: string, targetName?: string, beforeData?: any, afterData?: any) {
    try {
      const log = this.auditLogRepo.create({ userId, userName, action, targetType, targetId, targetName, beforeData, afterData });
      await this.auditLogRepo.save(log);
    } catch (e) {}
  }
}
