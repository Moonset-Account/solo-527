import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Project } from '../project/project.entity';
import { MaterialCost } from '../material-cost/material-cost.entity';
import { ConstructionStage } from '../construction-stage/construction-stage.entity';
import { ProjectService } from '../project/project.service';
import { MaterialCostService } from '../material-cost/material-cost.service';
import { DesignPlanService } from '../design-plan/design-plan.service';
import { ContractService } from '../contract/contract.service';
import { HouseSurveyService } from '../house-survey/house-survey.service';
import { ConstructionStageService } from '../construction-stage/construction-stage.service';
import { CustomerFeedbackService } from '../customer-feedback/customer-feedback.service';
import { AfterSalesService } from '../after-sales/after-sales.service';
import { InspectionTaskService } from '../inspection-task/inspection-task.service';
import { DelayReminderService } from '../delay-reminder/delay-reminder.service';
import { StagePhotoService } from '../stage-photo/stage-photo.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(MaterialCost)
    private materialCostRepository: Repository<MaterialCost>,
    @InjectRepository(ConstructionStage)
    private constructionStageRepository: Repository<ConstructionStage>,
    private projectService: ProjectService,
    private materialCostService: MaterialCostService,
    private designPlanService: DesignPlanService,
    private contractService: ContractService,
    private houseSurveyService: HouseSurveyService,
    private constructionStageService: ConstructionStageService,
    private customerFeedbackService: CustomerFeedbackService,
    private afterSalesService: AfterSalesService,
    private inspectionTaskService: InspectionTaskService,
    private delayReminderService: DelayReminderService,
    private stagePhotoService: StagePhotoService,
  ) {}

  async getMaterialCostReport(projectId?: number, month?: string): Promise<any> {
    const result = await this.materialCostService.findAll(
      { page: 1, pageSize: 1000 } as any,
      projectId,
      month,
    );

    const materials = result.list;
    let totalAmount = 0;
    materials.forEach((item: any) => {
      totalAmount += parseFloat(item.totalPrice || 0);
    });

    return {
      month,
      projectId,
      materials,
      totalAmount,
    };
  }

  async getProjectSummary(projectId: number): Promise<any> {
    const project = await this.projectService.findOne(projectId);
    
    const [
      designPlans,
      contracts,
      houseSurveys,
      constructionStages,
      customerFeedbacks,
      afterSales,
      inspectionTasks,
      delayReminders,
      stagePhotos,
    ] = await Promise.all([
      this.designPlanService.findByProjectId(projectId),
      this.contractService.findByProjectId(projectId),
      this.houseSurveyService.findByProjectId(projectId),
      this.constructionStageService.findByProjectId(projectId),
      this.customerFeedbackService.findByProjectId(projectId),
      this.afterSalesService.findByProjectId(projectId),
      this.inspectionTaskService.findByProjectId(projectId),
      this.delayReminderService.findByProjectId(projectId),
      this.stagePhotoService.findByProjectId(projectId),
    ]);

    const materialTotalCost = await this.materialCostService.getTotalCostByProjectId(projectId);

    const completedStages = constructionStages.filter((s) => s.status === 'COMPLETED').length;
    const totalStages = constructionStages.length;
    const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    const totalContractAmount = contracts.reduce((sum, c) => sum + parseFloat(c.amount as any), 0);

    return {
      project,
      summary: {
        designPlanCount: designPlans.length,
        contractCount: contracts.length,
        houseSurveyCount: houseSurveys.length,
        constructionStageCount: totalStages,
        completedStageCount: completedStages,
        progress,
        customerFeedbackCount: customerFeedbacks.length,
        afterSalesCount: afterSales.length,
        inspectionTaskCount: inspectionTasks.length,
        delayReminderCount: delayReminders.length,
        stagePhotoCount: stagePhotos.length,
        materialTotalCost,
        totalContractAmount,
      },
    };
  }

  async getMonthlySummary(month: string): Promise<any> {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];

    const projects = await this.projectRepository.find({
      where: [
        { startDate: Between(startDate, endDate) },
        { endDate: Between(startDate, endDate) },
      ],
      relations: ['customer'],
    });

    const newProjects = projects.filter((p) => p.startDate && p.startDate >= startDate && p.startDate <= endDate);
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED');

    const materialCosts = await this.materialCostRepository.find({
      where: { purchaseDate: Between(startDate, endDate) },
    });

    const totalMaterialCost = materialCosts.reduce((sum, m) => sum + parseFloat(m.totalPrice as any), 0);

    const contracts = await this.contractService.findByDateRange(startDate, endDate);
    const totalContractAmount = contracts.reduce((sum, c) => sum + parseFloat(c.amount as any), 0);

    const feedbacks = await this.customerFeedbackService.findByDateRange(startDate, endDate);
    const inspections = await this.inspectionTaskService.findByDateRange(startDate, endDate);
    const afterSalesList = await this.afterSalesService.findByDateRange(startDate, endDate);

    const projectSummaries = [];
    for (const project of projects) {
      const summary = await this.getProjectSummary(project.id);
      projectSummaries.push({
        projectId: project.id,
        projectName: project.name,
        projectNo: project.projectNo,
        customerName: project.customer?.name,
        status: project.status,
        totalPrice: project.totalPrice,
        materialCost: summary.summary.materialTotalCost,
      });
    }

    const statusCounts: Record<string, number> = {};
    projects.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    return {
      month,
      totalProjects: projects.length,
      newProjects: newProjects.length,
      completedProjects: completedProjects.length,
      totalContractAmount,
      totalMaterialCost,
      totalFeedbacks: feedbacks.length,
      totalInspections: inspections.length,
      totalAfterSales: afterSalesList.length,
      statusCounts,
      projects: projectSummaries,
    };
  }
}
