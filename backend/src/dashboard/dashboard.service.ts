import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { Fault, FaultStatus } from '../faults/entities/fault.entity';
import { InspectionTask, TaskStatus } from '../inspection-tasks/entities/inspection-task.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(Fault)
    private faultRepository: Repository<Fault>,
    @InjectRepository(InspectionTask)
    private taskRepository: Repository<InspectionTask>,
  ) {}

  async getStats() {
    const [
      totalApplications,
      pendingApplications,
      totalFaults,
      openFaults,
      totalTasks,
      pendingTasks,
      completedTasks,
    ] = await Promise.all([
      this.applicationRepository.count(),
      this.applicationRepository.count({ where: { status: ApplicationStatus.PENDING } }),
      this.faultRepository.count(),
      this.faultRepository.count({ where: { status: FaultStatus.OPEN } }),
      this.taskRepository.count(),
      this.taskRepository.count({ where: { status: TaskStatus.PENDING } }),
      this.taskRepository.count({ where: { status: TaskStatus.COMPLETED } }),
    ]);

    return {
      applications: {
        total: totalApplications,
        pending: pendingApplications,
      },
      faults: {
        total: totalFaults,
        open: openFaults,
      },
      inspectionTasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
      },
    };
  }

  async getTimeliness() {
    const completedApps = await this.applicationRepository.find({
      where: { status: ApplicationStatus.COMPLETED },
    });

    const appTimeliness = completedApps.map((app) => {
      const created = new Date(app.createdAt).getTime();
      const updated = new Date(app.updatedAt).getTime();
      return { id: app.id, processingTimeHours: (updated - created) / (1000 * 60 * 60) };
    });

    const avgAppTime =
      appTimeliness.length > 0
        ? appTimeliness.reduce((sum, a) => sum + a.processingTimeHours, 0) / appTimeliness.length
        : 0;

    const resolvedFaults = await this.faultRepository.find({
      where: { status: FaultStatus.RESOLVED },
    });

    const faultTimeliness = resolvedFaults
      .filter((f) => f.resolvedAt)
      .map((fault) => {
        const created = new Date(fault.createdAt).getTime();
        const resolved = new Date(fault.resolvedAt).getTime();
        return { id: fault.id, processingTimeHours: (resolved - created) / (1000 * 60 * 60) };
      });

    const avgFaultTime =
      faultTimeliness.length > 0
        ? faultTimeliness.reduce((sum, f) => sum + f.processingTimeHours, 0) / faultTimeliness.length
        : 0;

    const slaHours = 24;
    const appSlaCompliance =
      appTimeliness.length > 0
        ? appTimeliness.filter((a) => a.processingTimeHours <= slaHours).length / appTimeliness.length
        : 1;

    const faultSlaCompliance =
      faultTimeliness.length > 0
        ? faultTimeliness.filter((f) => f.processingTimeHours <= slaHours).length / faultTimeliness.length
        : 1;

    return {
      applications: {
        avgProcessingTimeHours: Math.round(avgAppTime * 100) / 100,
        slaCompliance: Math.round(appSlaCompliance * 100),
      },
      faults: {
        avgProcessingTimeHours: Math.round(avgFaultTime * 100) / 100,
        slaCompliance: Math.round(faultSlaCompliance * 100),
      },
      slaThresholdHours: slaHours,
    };
  }

  async getTodo(userId: string, displayName: string) {
    const pendingApps = await this.applicationRepository.find({
      where: { responsiblePerson: displayName, status: ApplicationStatus.PENDING },
    });

    const processingApps = await this.applicationRepository.find({
      where: { responsiblePerson: displayName, status: ApplicationStatus.PROCESSING },
    });

    const openFaults = await this.faultRepository.find({
      where: { responsiblePerson: displayName, status: FaultStatus.OPEN },
    });

    const inProgressFaults = await this.faultRepository.find({
      where: { responsiblePerson: displayName, status: FaultStatus.IN_PROGRESS },
    });

    const pendingTasks = await this.taskRepository.find({
      where: { assignee: displayName, status: TaskStatus.PENDING },
    });

    const inProgressTasks = await this.taskRepository.find({
      where: { assignee: displayName, status: TaskStatus.IN_PROGRESS },
    });

    return {
      applications: [...pendingApps, ...processingApps],
      faults: [...openFaults, ...inProgressFaults],
      inspectionTasks: [...pendingTasks, ...inProgressTasks],
      totalPending: pendingApps.length + openFaults.length + pendingTasks.length,
    };
  }
}
