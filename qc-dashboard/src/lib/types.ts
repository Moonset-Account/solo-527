export interface Session {
  id: string
  order_no: string
  agent_name: string
  status: "pending" | "inspecting" | "completed" | "appealed"
  score: number | null
  service_rating: 1 | 2 | 3 | 4 | 5 | null
  knowledge_version: string | null
  has_timeout_risk: boolean
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: string
  session_id: string
  inspector_name: string
  attitude_score: number
  professional_score: number
  response_score: number
  compliance_score: number
  total_score: number
  result: "pass" | "fail" | "warning"
  notes: string
  processing_result: "resolved" | "escalated" | "pending" | "dismissed"
  created_at: string
  updated_at: string
}

export interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: "answer" | "tutorial"
  version: number
  status: "draft" | "published" | "archived"
  hit_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface KnowledgeHit {
  id: string
  entry_id: string
  entry_title: string
  session_id: string
  role: "agent" | "customer" | "system"
  knowledge_version: number
  hit_at: string
}

export interface KnowledgeVersion {
  id: string
  entry_id: string
  version: number
  content: string
  diff_summary: string
  published_by: string
  published_at: string
}

export interface Issue {
  id: string
  title: string
  description: string
  category: string
  duplicate_count: number
  status: "open" | "processing" | "resolved" | "closed"
  has_timeout_risk: boolean
  processing_result: "resolved" | "escalated" | "pending" | "dismissed"
  related_session_count: number
  created_at: string
  updated_at: string
}

export interface IssueNote {
  id: string
  issue_id: string
  author_name: string
  content: string
  created_at: string
}

export interface Attachment {
  id: string
  session_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  uploaded_at: string
}

export interface ModificationRecord {
  id: string
  entity_type: "inspection" | "issue" | "knowledge"
  entity_id: string
  field: string
  old_value: string
  new_value: string
  modified_by: string
  modified_at: string
}

export interface FilterPreset {
  id: string
  name: string
  filters: {
    status?: string[]
    service_rating?: number[]
    knowledge_version?: string[]
    has_timeout_risk?: boolean
    date_from?: string
    date_to?: string
    query?: string
  }
}

export interface ChatMessage {
  id: string
  session_id: string
  role: "agent" | "customer" | "system"
  content: string
  timestamp: string
}

export interface DashboardMetrics {
  today_inspected: number
  avg_score: number
  pending_count: number
  timeout_risk_count: number
}

export interface TimeoutRiskItem {
  label: string
  count: number
}
