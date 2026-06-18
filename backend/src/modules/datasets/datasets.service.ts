import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dataset, DatasetPermission } from './schemas/dataset.schema';
import {
  CreateDatasetDto,
  UpdateDatasetDto,
  AddPermissionDto,
  UpdatePermissionDto,
  QueryDatasetsDto,
} from './dto/dataset.dto';

@Injectable()
export class DatasetsService {
  constructor(
    @InjectModel(Dataset.name) private datasetModel: Model<Dataset>,
  ) {}

  async create(
    createDto: CreateDatasetDto,
    operator?: any,
  ): Promise<Dataset> {
    const existing = await this.datasetModel.findOne({ code: createDto.code });
    if (existing) {
      throw new ConflictException('数据集编码已存在');
    }

    const dataset = new this.datasetModel({
      ...createDto,
      ownerId: operator?.sub ? new Types.ObjectId(operator.sub) : null,
      ownerName: operator?.name || '系统',
    });
    return dataset.save();
  }

  async findAll(query: QueryDatasetsDto, currentUser?: any) {
    const { keyword, category, status, ownerId, page = 1, pageSize = 20 } = query;
    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (ownerId) filter.ownerId = new Types.ObjectId(ownerId);

    if (currentUser && currentUser.role !== 'admin') {
      const userId = new Types.ObjectId(currentUser.sub);
      filter.$or = filter.$or || [];
      filter.$or.push(
        { ownerId: userId },
        { 'permissions.userId': userId },
      );
    }

    const total = await this.datasetModel.countDocuments(filter);
    const list = await this.datasetModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Dataset> {
    const dataset = await this.datasetModel.findById(id);
    if (!dataset) {
      throw new NotFoundException('数据集不存在');
    }
    return dataset;
  }

  async update(
    id: string,
    updateDto: UpdateDatasetDto,
  ): Promise<Dataset> {
    const dataset = await this.datasetModel.findByIdAndUpdate(
      id,
      updateDto,
      { new: true, runValidators: true },
    );
    if (!dataset) {
      throw new NotFoundException('数据集不存在');
    }
    return dataset;
  }

  async addPermissions(
    id: string,
    dto: AddPermissionDto,
  ): Promise<Dataset> {
    const dataset = await this.datasetModel.findById(id);
    if (!dataset) {
      throw new NotFoundException('数据集不存在');
    }

    const existingUserIds = dataset.permissions.map((p) =>
      p.userId.toString(),
    );

    for (const perm of dto.permissions) {
      const userIdStr = perm.userId.toString();
      const userInfo = await this.getUserInfo(userIdStr);
      const newPerm: any = {
        userId: new Types.ObjectId(userIdStr),
        userName: userInfo?.name || '未知用户',
        level: perm.level,
        expireAt: perm.expireAt ? new Date(perm.expireAt) : undefined,
      };

      const existingIndex = existingUserIds.indexOf(userIdStr);
      if (existingIndex >= 0) {
        dataset.permissions[existingIndex] = newPerm;
      } else {
        dataset.permissions.push(newPerm);
      }
    }

    return dataset.save();
  }

  async updatePermission(
    id: string,
    dto: UpdatePermissionDto,
  ): Promise<Dataset> {
    const dataset = await this.datasetModel.findById(id);
    if (!dataset) {
      throw new NotFoundException('数据集不存在');
    }

    const userId = new Types.ObjectId(dto.userId);
    const permIndex = dataset.permissions.findIndex(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (permIndex < 0) {
      throw new NotFoundException('该用户无此数据集权限');
    }

    const userInfo = await this.getUserInfo(dto.userId);
    dataset.permissions[permIndex] = {
      userId,
      userName: userInfo?.name || dataset.permissions[permIndex].userName,
      level: dto.level,
      expireAt: dto.expireAt ? new Date(dto.expireAt) : undefined,
    };

    return dataset.save();
  }

  async removePermission(id: string, userId: string): Promise<Dataset> {
    const dataset = await this.datasetModel.findById(id);
    if (!dataset) {
      throw new NotFoundException('数据集不存在');
    }

    const userObjectId = new Types.ObjectId(userId);
    dataset.permissions = dataset.permissions.filter(
      (p) => p.userId.toString() !== userObjectId.toString(),
    );

    return dataset.save();
  }

  async checkPermission(
    datasetId: string,
    userId: string,
    requiredLevel: 'read' | 'write' | 'manage' = 'read',
  ): Promise<boolean> {
    const dataset = await this.datasetModel.findById(datasetId);
    if (!dataset) return false;

    const userObjectId = new Types.ObjectId(userId);
    if (dataset.ownerId?.toString() === userObjectId.toString()) {
      return true;
    }

    const levelOrder = { read: 1, write: 2, manage: 3 };
    const permission = dataset.permissions.find(
      (p) => p.userId.toString() === userObjectId.toString(),
    );

    if (!permission) return false;
    if (permission.expireAt && permission.expireAt < new Date()) {
      return false;
    }

    return levelOrder[permission.level] >= levelOrder[requiredLevel];
  }

  async remove(id: string): Promise<void> {
    const dataset = await this.datasetModel.findByIdAndDelete(id);
    if (!dataset) {
      throw new NotFoundException('数据集不存在');
    }
  }

  async getExpiringPermissions(days: number = 7) {
    const now = new Date();
    const expireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const datasets = await this.datasetModel.find({
      status: 'active',
      'permissions.expireAt': { $gte: now, $lte: expireDate },
    });

    const expiringList: any[] = [];
    for (const ds of datasets) {
      for (const perm of ds.permissions) {
        if (
          perm.expireAt &&
          perm.expireAt >= now &&
          perm.expireAt <= expireDate
        ) {
          expiringList.push({
            datasetId: ds._id,
            datasetName: ds.name,
            datasetCode: ds.code,
            userId: perm.userId,
            userName: perm.userName,
            level: perm.level,
            expireAt: perm.expireAt,
          });
        }
      }
    }

    return expiringList;
  }

  private async getUserInfo(userId: string) {
    try {
      const UserModel = this.datasetModel.db.collection('users');
      const user = await UserModel.findOne({ _id: new Types.ObjectId(userId) });
      return user;
    } catch {
      return null;
    }
  }

  async initMockData() {
    const count = await this.datasetModel.countDocuments();
    if (count > 0) return;

    const categories = ['用户增长', '留存分析', '转化漏斗', '营收数据', '性能监控'];
    const names = [
      '日新增用户数据集',
      '留存率分析数据集',
      '付费转化数据集',
      '营收核心指标集',
      '首屏性能数据集',
      '渠道质量分析集',
      '用户行为路径集',
      '推送效果数据集',
    ];
    const codes = [
      'ds_new_users',
      'ds_retention',
      'ds_conversion',
      'ds_revenue',
      'ds_performance',
      'ds_channel',
      'ds_behavior',
      'ds_push',
    ];

    const mockData = names.map((name, i) => ({
      name,
      code: codes[i],
      description: `包含${name.split('数据集')[0].split('指标集')[0]}相关的核心指标数据，用于日常监控和异常分析`,
      category: categories[i % categories.length],
      dataSource: ['MySQL', 'ClickHouse', 'Hive', 'MongoDB'][i % 4],
      status: 'active' as const,
      metrics: [
        { name: 'value', displayName: '当前值', unit: '' },
        { name: 'changePercent', displayName: '变化率', unit: '%' },
        { name: 'avg', displayName: '平均值', unit: '' },
      ],
      permissions: [],
      anomalyCount: Math.floor(Math.random() * 10),
      ruleCount: Math.floor(Math.random() * 3),
    }));

    await this.datasetModel.insertMany(mockData);
    console.log('✅ 数据集权限模拟数据初始化完成');
  }
}
