export type UserRole = 'admin' | 'manager' | 'worker' | 'resident';
export type UserShift = 'morning' | 'afternoon' | 'night';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  shift: UserShift;
  phone?: string;
  gridArea?: string;
  isVotingEligible: boolean;
  votingIneligibleReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'rectification' | 'vote' | 'patrol';
export type EventStatus = 'pending' | 'processing' | 'reviewing' | 'voting' | 'completed' | 'closed';

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  latitude?: number;
  longitude?: number;
  location?: string;
  gridArea?: string;
  deadline?: string;
  priority: number;
  reporterId: string;
  reporter?: User;
  assigneeId?: string;
  assignee?: User;
  reviewTime?: string;
  reviewResult?: string;
  isRectified: boolean;
  rectificationResult?: string;
  attachments?: Attachment[];
  notes?: Note[];
  histories?: History[];
  votes?: Vote[];
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  eventId: string;
  uploaderId: string;
  uploader?: User;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  eventId: string;
  creatorId: string;
  creator?: User;
  createdAt: string;
}

export interface History {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  changes?: string;
  eventId: string;
  operatorId: string;
  operator?: User;
  createdAt: string;
}

export type VoteStatus = 'draft' | 'ongoing' | 'ended' | 'cancelled';
export type VoteType = 'single' | 'multiple';

export interface VoteOption {
  id: string;
  text: string;
  count: number;
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  type: VoteType;
  status: VoteStatus;
  options: VoteOption[];
  startTime?: string;
  endTime?: string;
  totalVotes: number;
  eligibleVoters: number;
  allowAbstain: boolean;
  abstainCount: number;
  ruleId?: string;
  rule?: VoteRule;
  eventId?: string;
  event?: Event;
  creatorId: string;
  creator?: User;
  records?: VoteRecord[];
  createdAt: string;
}

export interface VoteRecord {
  id: string;
  selectedOptions?: string[];
  isAbstained: boolean;
  reason?: string;
  hasVotingException: boolean;
  votingExceptionReason?: string;
  voteId: string;
  voterId: string;
  voter?: User;
  createdAt: string;
}

export interface VoteRule {
  id: string;
  name: string;
  description: string;
  passThreshold: number;
  quorumThreshold: number;
  votingDurationHours: number;
  allowProxyVoting: boolean;
  isDefault: boolean;
  eligibleRoles?: string[];
  votes?: Vote[];
  createdAt: string;
}

export type TaskType = 'rectification' | 'patrol' | 'review';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  deadline?: string;
  checkpoints?: string;
  result?: string;
  eventId?: string;
  event?: Event;
  assigneeId: string;
  assignee?: User;
  creatorId: string;
  creator?: User;
  createdAt: string;
}

export type TodoType = 'voting_exception' | 'review' | 'follow_up' | 'urgent';
export type TodoStatus = 'pending' | 'processing' | 'completed';

export interface Todo {
  id: string;
  title: string;
  description: string;
  type: TodoType;
  status: TodoStatus;
  priority: number;
  relatedModule?: string;
  relatedId?: string;
  deadline?: string;
  affectsHelpProgress: boolean;
  helpProgressImpact?: string;
  assigneeId: string;
  assignee?: User;
  creatorId: string;
  creator?: User;
  createdAt: string;
}
