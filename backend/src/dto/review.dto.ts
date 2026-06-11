import { Types } from 'mongoose';

export type FollowUpStatus = 'pending' | 'done';

export class CreateReviewDto {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  tags?: string[];
  content?: string;
}

export class UpdateReviewDto {
  rating?: number;
  tags?: string[];
  content?: string;
  reply?: string;
  followUpStatus?: FollowUpStatus;
  followUpContent?: string;
  followUpBy?: string;
  followUpAt?: Date | string;
}

export class QueryReviewDto {
  orderId?: Types.ObjectId;
  userId?: Types.ObjectId;
  workerId?: Types.ObjectId;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  followUpStatus?: FollowUpStatus;
  community?: string;
  communities?: string[];
  startTime?: Date;
  endTime?: Date;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export class PendingFollowUpDto {
  page?: number;
  pageSize?: number;
}

export class FollowUpDto {
  followUpContent: string;
  followUpBy: string;
}

export class ReplyReviewDto {
  reply: string;
}

export class BatchFollowUpDto {
  reviewIds: Types.ObjectId[];
  followUpContent: string;
  followUpBy: string;
}

export interface BatchFollowUpResult {
  success: { id: string; message: string }[];
  failed: { id: string; message: string }[];
}

export interface ReviewStats {
  averageRating: number;
  totalCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  pendingFollowUpCount: number;
  doneFollowUpCount: number;
  followUpRate: number;
  tagCloud: { tag: string; count: number }[];
}
