import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import type { IConfig, IDepartment, IAttachment, ILog } from '../../common/types/index.js';

@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly uploadDir: string;

  constructor(
    @InjectModel('Config') private readonly configModel: Model<IConfig>,
    @InjectModel('Department') private readonly departmentModel: Model<IDepartment>,
    @InjectModel('Attachment') private readonly attachmentModel: Model<IAttachment>,
    @InjectModel('Log') private readonly logModel: Model<ILog>,
  ) {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async onModuleInit() {
    await this.initDefaultConfig();
  }

  async initDefaultConfig() {
    const defaultSwitches = [
      { key: 'overdue_alert', value: true },
      { key: 'auto_remind', value: true },
    ];

    const defaultTemplates = ['已完成', '部分完成', '未完成', '需升级处理'];

    for (const sw of defaultSwitches) {
      const existing = await this.configModel.findOne({ key: sw.key });
      if (!existing) {
        await this.configModel.create({
          type: 'switch',
          key: sw.key,
          value: sw.value,
        });
      }
    }

    for (const template of defaultTemplates) {
      const existing = await this.configModel.findOne({ key: template });
      if (!existing) {
        await this.configModel.create({
          type: 'review_template',
          key: template,
          value: true,
        });
      }
    }
  }

  async getConfig() {
    const [switches, reviewTemplates, departments] = await Promise.all([
      this.configModel.find({ type: 'switch' }),
      this.configModel.find({ type: 'review_template' }),
      this.departmentModel.find().populate('head', 'name'),
    ]);

    return {
      switches: switches.map((s) => ({ key: s.key, value: s.value })),
      reviewTemplates: reviewTemplates.map((t) => t.key),
      departments,
    };
  }

  async updateSwitch(key: string, value: boolean, operatorId: Types.ObjectId | string) {
    const config = await this.configModel.findOne({ key, type: 'switch' });
    if (!config) {
      throw new NotFoundException('配置项不存在');
    }

    const oldValue = config.value;
    config.value = value;
    await config.save();

    await this.logModel.create({
      type: 'config_change',
      operator: operatorId,
      targetId: config._id,
      detail: {
        field: key,
        oldValue,
        newValue: value,
      },
    });

    return config;
  }

  async getDepartments() {
    return this.departmentModel.find().populate('head', 'name');
  }

  async createDepartment(name: string, head: Types.ObjectId | string, operatorId: Types.ObjectId | string) {
    const existing = await this.departmentModel.findOne({ name });
    if (existing) {
      throw new BadRequestException('部门名称已存在');
    }

    const department = await this.departmentModel.create({ name, head });

    await this.logModel.create({
      type: 'config_change',
      operator: operatorId,
      targetId: department._id,
      detail: {
        field: 'department',
        oldValue: null,
        newValue: { name, head },
      },
    });

    return department.populate('head', 'name');
  }

  async updateDepartment(
    id: string,
    name: string | undefined,
    head: Types.ObjectId | string | undefined,
    operatorId: Types.ObjectId | string,
  ) {
    const department = await this.departmentModel.findById(id);
    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (name !== undefined && name !== department.name) {
      const existing = await this.departmentModel.findOne({ name, _id: { $ne: id } });
      if (existing) {
        throw new BadRequestException('部门名称已存在');
      }
      oldValues.name = department.name;
      newValues.name = name;
      department.name = name;
    }

    if (head !== undefined && head.toString() !== department.head.toString()) {
      const headObjectId = typeof head === 'string' ? new Types.ObjectId(head) : head;
      oldValues.head = department.head;
      newValues.head = head;
      department.head = headObjectId;
    }

    await department.save();

    if (Object.keys(newValues).length > 0) {
      await this.logModel.create({
        type: 'config_change',
        operator: operatorId,
        targetId: department._id,
        detail: {
          field: 'department',
          oldValue: oldValues,
          newValue: newValues,
        },
      });
    }

    return department.populate('head', 'name');
  }

  async deleteDepartment(id: string, operatorId: Types.ObjectId | string) {
    const department = await this.departmentModel.findById(id);
    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    await this.departmentModel.findByIdAndDelete(id);

    await this.logModel.create({
      type: 'config_change',
      operator: operatorId,
      targetId: department._id,
      detail: {
        field: 'department',
        oldValue: { name: department.name, head: department.head },
        newValue: null,
      },
    });

    return { message: '删除成功' };
  }

  async getAttachments(refId: string, refType: string) {
    const query: Record<string, any> = { refType };
    if (refId) {
      query.refId = refId;
    }
    return this.attachmentModel.find(query).sort({ createdAt: -1 }).populate('operator', 'name');
  }

  async uploadAttachment(
    file: Express.Multer.File,
    refId: Types.ObjectId | string,
    refType: 'item' | 'config',
    operatorId: Types.ObjectId | string,
  ) {
    const lastAttachment = await this.attachmentModel
      .findOne({ refId, refType, filename: file.originalname })
      .sort({ version: -1 });

    const version = lastAttachment ? lastAttachment.version + 1 : 1;
    const ext = extname(file.originalname);
    const baseName = file.originalname.replace(ext, '');
    const savedFilename = `${baseName}_v${version}${ext}`;
    const filePath = join(this.uploadDir, savedFilename);

    const writeStream = createWriteStream(filePath);
    writeStream.write(file.buffer);
    writeStream.end();

    const url = `/uploads/${savedFilename}`;

    const attachment = await this.attachmentModel.create({
      filename: file.originalname,
      url,
      version,
      refId,
      refType,
      operator: operatorId,
    });

    return attachment.populate('operator', 'name');
  }

  async getChangelog(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.logModel
        .find({ type: 'config_change' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('operator', 'name'),
      this.logModel.countDocuments({ type: 'config_change' }),
    ]);

    return {
      list: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
