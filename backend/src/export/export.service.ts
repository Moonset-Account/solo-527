import { Injectable } from '@nestjs/common';
import { ProjectService } from '../project/project.service';
import { CustomerService } from '../customer/customer.service';
import { DesignPlanService } from '../design-plan/design-plan.service';
import { ContractService } from '../contract/contract.service';
import { HouseSurveyService } from '../house-survey/house-survey.service';
import { ConstructionStageService } from '../construction-stage/construction-stage.service';
import { CustomerFeedbackService } from '../customer-feedback/customer-feedback.service';
import { AfterSalesService } from '../after-sales/after-sales.service';
import { InspectionTaskService } from '../inspection-task/inspection-task.service';
import { DelayReminderService } from '../delay-reminder/delay-reminder.service';
import { StagePhotoService } from '../stage-photo/stage-photo.service';
import { MaterialCostService } from '../material-cost/material-cost.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MaterialCost } from '../material-cost/material-cost.entity';
import { Repository, Between } from 'typeorm';

@Injectable()
export class ExportService {
  constructor(
    private projectService: ProjectService,
    private customerService: CustomerService,
    private designPlanService: DesignPlanService,
    private contractService: ContractService,
    private houseSurveyService: HouseSurveyService,
    private constructionStageService: ConstructionStageService,
    private customerFeedbackService: CustomerFeedbackService,
    private afterSalesService: AfterSalesService,
    private inspectionTaskService: InspectionTaskService,
    private delayReminderService: DelayReminderService,
    private stagePhotoService: StagePhotoService,
    private materialCostService: MaterialCostService,
    @InjectRepository(MaterialCost)
    private materialCostRepository: Repository<MaterialCost>,
  ) {}

  async exportProject(id: number): Promise<any> {
    const project = await this.projectService.findOne(id);
    const customer = await this.customerService.findOne(project.customerId);

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
      materialCosts,
    ] = await Promise.all([
      this.designPlanService.findByProjectId(id),
      this.contractService.findByProjectId(id),
      this.houseSurveyService.findByProjectId(id),
      this.constructionStageService.findByProjectId(id),
      this.customerFeedbackService.findByProjectId(id),
      this.afterSalesService.findByProjectId(id),
      this.inspectionTaskService.findByProjectId(id),
      this.delayReminderService.findByProjectId(id),
      this.stagePhotoService.findByProjectId(id),
      this.materialCostService.findByProjectId(id),
    ]);

    const totalMaterialCost = materialCosts.reduce(
      (sum, m) => sum + parseFloat(m.totalPrice as any),
      0
    );

    const completedStages = constructionStages.filter((s) => s.status === 'COMPLETED').length;
    const progress = constructionStages.length > 0
      ? Math.round((completedStages / constructionStages.length) * 100)
      : 0;

    return {
      exportTime: new Date().toISOString(),
      project: {
        ...project,
        customer,
      },
      summary: {
        designPlanCount: designPlans.length,
        contractCount: contracts.length,
        houseSurveyCount: houseSurveys.length,
        constructionStageCount: constructionStages.length,
        completedStageCount: completedStages,
        progress,
        customerFeedbackCount: customerFeedbacks.length,
        afterSalesCount: afterSales.length,
        inspectionTaskCount: inspectionTasks.length,
        delayReminderCount: delayReminders.length,
        stagePhotoCount: stagePhotos.length,
        materialCostCount: materialCosts.length,
        totalMaterialCost,
      },
      details: {
        designPlans,
        contracts,
        houseSurveys,
        constructionStages,
        customerFeedbacks,
        afterSales,
        inspectionTasks,
        delayReminders,
        stagePhotos,
        materialCosts,
      },
    };
  }

  async exportMaterialCost(projectId?: number, month?: string): Promise<any> {
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];
      where.purchaseDate = Between(startDate, endDate);
    }

    const materialCosts = await this.materialCostRepository.find({
      where,
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });

    const totalCost = materialCosts.reduce(
      (sum, m) => sum + parseFloat(m.totalPrice as any),
      0
    );

    const summary = await this.materialCostRepository
      .createQueryBuilder('materialCost')
      .select('materialCost.materialName', 'materialName')
      .addSelect('SUM(materialCost.quantity)', 'totalQuantity')
      .addSelect('SUM(materialCost.totalPrice)', 'totalAmount')
      .addSelect('materialCost.unit', 'unit')
      .groupBy('materialCost.materialName')
      .addGroupBy('materialCost.unit')
      .getRawMany();

    return {
      exportTime: new Date().toISOString(),
      filters: { projectId, month },
      totalCost,
      itemCount: materialCosts.length,
      summary,
      details: materialCosts,
    };
  }

  async exportMonthlyReport(month: string): Promise<any> {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];

    const materialCosts = await this.materialCostRepository.find({
      where: { purchaseDate: Between(startDate, endDate) as any },
      relations: ['project'],
      order: { purchaseDate: 'DESC' },
    });

    const totalMaterialCost = materialCosts.reduce(
      (sum, m) => sum + parseFloat(m.totalPrice as any),
      0
    );

    const projectStats: Record<number, { projectName: string; materialCost: number; itemCount: number }> = {};
    materialCosts.forEach((m) => {
      if (!projectStats[m.projectId]) {
        projectStats[m.projectId] = {
          projectName: m.project?.name || '',
          materialCost: 0,
          itemCount: 0,
        };
      }
      projectStats[m.projectId].materialCost += parseFloat(m.totalPrice as any);
      projectStats[m.projectId].itemCount += 1;
    });

    return {
      exportTime: new Date().toISOString(),
      month,
      startDate,
      endDate,
      summary: {
        totalMaterialCost,
        totalItems: materialCosts.length,
        projectCount: Object.keys(projectStats).length,
      },
      projectStats: Object.values(projectStats),
      materialCosts,
    };
  }
}
