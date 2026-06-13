export enum ContentStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FILMING = 'filming',
  EDITING = 'editing',
  PENDING_PUBLISH = 'pending_publish',
  PUBLISHED = 'published',
  PUBLISH_FAILED = 'publish_failed',
  ARCHIVED = 'archived',
}

export enum ReviewNodeType {
  AND = 'and',
  OR = 'or',
  SINGLE = 'single',
}

export enum PlatformType {
  DOUYIN = 'douyin',
  KUAISHOU = 'kuaishou',
  XHS = 'xhs',
  BILIBILI = 'bilibili',
  WECHAT = 'wechat',
  WEIBO = 'weibo',
}
