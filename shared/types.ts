export enum UserRole {
  admin = 'admin',
  manager = 'manager',
  engineer = 'engineer',
}

export enum TicketType {
  application = 'application',
  fault = 'fault',
}

export enum TicketStatus {
  pending = 'pending',
  assigned = 'assigned',
  processing = 'processing',
  approved = 'approved',
  rejected = 'rejected',
  closed = 'closed',
}

export enum TicketPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  critical = 'critical',
}

export enum EventType {
  rollback = 'rollback',
  vulnerability_fix = 'vulnerability_fix',
  config_change = 'config_change',
  status_change = 'status_change',
  comment = 'comment',
}

export enum EventResult {
  success = 'success',
  failed = 'failed',
}

export enum AssetType {
  server = 'server',
  network = 'network',
  software = 'software',
  account = 'account',
}

export enum AssetStatus {
  active = 'active',
  inactive = 'inactive',
  maintenance = 'maintenance',
}

export enum Environment {
  production = 'production',
  staging = 'staging',
  development = 'development',
}

export enum SlaStage {
  created = 'created',
  assigned = 'assigned',
  processing = 'processing',
  approved = 'approved',
  closed = 'closed',
}

export enum TargetType {
  ticket = 'ticket',
  asset = 'asset',
  config_item = 'config_item',
  user = 'user',
}
