import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument, ProjectReport, ProjectReportDocument } from './schemas/project.schema';
import { CreateProjectDto, QueryProjectDto, CreateProjectReportDto } from './dto/project.dto';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { AuditAction } from '../../common/enums/index.enum';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectReport.name) private reportModel: Model<ProjectReportDocument>,
    private auditService: AuditService,
    private usersService: UsersService,
  ) {}

  async createProject(dto: CreateProjectDto, operatorId?: string): Promise<Project> {
    const existing = await this.projectModel.findOne({ projectNo: dto.projectNo });
    if (existing) throw new ConflictException('课题编号已存在');

    let piName = '';
    if (dto.principalInvestigatorId) {
      try {
        const pi = await this.usersService.findById(dto.principalInvestigatorId);
        piName = pi.realName;
      } catch {}
    }

    const project = new this.projectModel({
      ...dto,
      principalInvestigatorName: piName,
      status: dto.status || 'active',
      audit: { createdBy: operatorId, updatedBy: operatorId },
    });
    await project.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'project',
      targetId: project._id.toString(),
      targetName: project.name,
      operatorId,
      details: dto,
    });

    return project;
  }

  async findProjects(query: QueryProjectDto): Promise<{ list: Project[]; total: number }> {
    const { keyword, principalInvestigatorId, status, page, pageSize } = query;
    const filter: any = { isActive: true };

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { projectNo: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (principalInvestigatorId) filter.principalInvestigatorId = principalInvestigatorId;
    if (status) filter.status = status;

    const [list, total] = await Promise.all([
      this.projectModel.find(filter).skip((page - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }).populate('relatedDocumentIds'),
      this.projectModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findProjectById(id: string): Promise<Project> {
    const project = await this.projectModel.findById(id).populate('relatedDocumentIds');
    if (!project) throw new NotFoundException('课题不存在');
    return project;
  }

  async updateProject(id: string, dto: Partial<CreateProjectDto>, operatorId?: string): Promise<Project> {
    const project = await this.projectModel.findById(id);
    if (!project) throw new NotFoundException('课题不存在');

    Object.assign(project, dto, { audit: { ...project.audit, updatedBy: operatorId, updatedAt: new Date() } });
    await project.save();

    await this.auditService.create({
      action: AuditAction.UPDATE,
      module: 'project',
      targetId: id,
      targetName: project.name,
      operatorId,
      details: dto,
    });

    return project;
  }

  async createReport(dto: CreateProjectReportDto, userId: string): Promise<ProjectReport> {
    const user = await this.usersService.findById(userId);

    const report = new this.reportModel({
      ...dto,
      projectId: new Types.ObjectId(dto.projectId),
      relatedApplicationIds: dto.relatedApplicationIds?.map((id) => new Types.ObjectId(id)) || [],
      relatedReagentIds: dto.relatedReagentIds?.map((id) => new Types.ObjectId(id)) || [],
      relatedDocumentIds: dto.relatedDocumentIds?.map((id) => new Types.ObjectId(id)) || [],
      authorId: userId,
      authorName: user.realName,
      reportDate: dto.reportDate ? new Date(dto.reportDate) : new Date(),
      audit: { createdBy: userId, updatedBy: userId },
    });
    await report.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'project_report',
      targetId: report._id.toString(),
      targetName: report.title,
      operatorId: userId,
      operatorName: user.realName,
      details: dto,
    });

    return report;
  }

  async findReportsByProject(projectId: string): Promise<ProjectReport[]> {
    return this.reportModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ reportDate: -1 })
      .populate('relatedApplicationIds relatedReagentIds relatedDocumentIds');
  }
}
