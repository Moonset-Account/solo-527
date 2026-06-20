export interface Trainer {
	id: number;
	name: string;
	email: string;
	team?: string;
	createdAt: string;
}

export interface Email {
	id: number;
	uuid: string;
	subject: string;
	recipient?: string;
	sender?: string;
	content: string;
	status: 'draft' | 'pending' | 'reviewed' | 'sent' | 'archived';
	trainerId?: number;
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
	needsReview: boolean;
	reviewed: boolean;
	reviewedAt?: string;
	reviewedBy?: string;
	sentAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface EmailVersion {
	id: number;
	emailId: number;
	version: number;
	subject: string;
	content: string;
	changeNote?: string;
	createdBy?: string;
	createdAt: string;
}

export interface RiskSample {
	id: number;
	emailId: number;
	emailVersionId?: number;
	riskType: string;
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	location?: string;
	markedBy?: string;
	resolved: boolean;
	resolvedAt?: string;
	createdAt: string;
}

export interface Review {
	id: number;
	emailId: number;
	reviewer: string;
	comment?: string;
	verdict: 'pending' | 'approved' | 'rejected' | 'needs_revision';
	assignedAt: string;
	completedAt?: string;
	dueDate?: string;
}

export interface ReferenceSource {
	id: number;
	title: string;
	category?: string;
	url?: string;
	source?: string;
	publishedAt?: string;
	createdAt: string;
}

export interface KnowledgeEntry {
	id: number;
	category: string;
	title: string;
	content: string;
	referenceSourceId?: number;
	tags?: string;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ForbiddenWord {
	id: number;
	word: string;
	category?: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	description?: string;
	active: boolean;
	createdAt: string;
}

export interface MissingReason {
	id: number;
	name: string;
	description?: string;
	createdAt: string;
}

export interface HitRate {
	id: number;
	emailId: number;
	emailVersionId?: number;
	knowledgeId?: number;
	forbiddenWordId?: number;
	trainerId?: number;
	hitType: 'knowledge' | 'forbidden' | 'missing_reference';
	matchText?: string;
	missingReasonId?: number;
	hitDate: string;
	count: number;
	createdAt: string;
}

export interface HitRateSummary {
	totalHits: number;
	byTrainer: { trainerId: number; trainerName: string; count: number }[];
	byDate: { date: string; count: number }[];
	byMissingReason: { reasonId: number; reasonName: string; count: number }[];
	byHitType: { type: string; count: number }[];
}
