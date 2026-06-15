import { type Types } from 'mongoose';

export type UserRole = 'pm' | 'admin';

export type UserStatus = 'active' | 'disabled';

export type ItemStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'archived';

export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReviewConclusion = 'completed' | 'partial' | 'incomplete' | 'escalated';

export type ConfigType = 'switch' | 'review_template' | 'system';

export type LogType = 'claim' | 'progress' | 'review' | 'config_change' | 'overdue_mark' | 'user_action';

export type RefType = 'item' | 'config';

export interface IUser {
  _id: Types.ObjectId | string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  department: Types.ObjectId;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IItem {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: ItemStatus;
  priority: ItemPriority;
  department: Types.ObjectId;
  assignee: Types.ObjectId | null;
  deadline: Date;
  claimedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProgress {
  _id: Types.ObjectId;
  itemId: Types.ObjectId;
  content: string;
  attachments: string[];
  operator: Types.ObjectId;
  createdAt: Date;
}

export interface IReview {
  _id: Types.ObjectId;
  itemId: Types.ObjectId;
  conclusion: ReviewConclusion;
  remark: string;
  operator: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConfig {
  _id: Types.ObjectId;
  type: ConfigType;
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartment {
  _id: Types.ObjectId;
  name: string;
  head: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  _id: Types.ObjectId;
  filename: string;
  url: string;
  version: number;
  refId: Types.ObjectId;
  refType: RefType;
  operator: Types.ObjectId;
  createdAt: Date;
}

export interface ILogDetail {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface ILog {
  _id: Types.ObjectId;
  type: LogType;
  operator: Types.ObjectId;
  targetId: Types.ObjectId;
  detail: ILogDetail;
  createdAt: Date;
}
