/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'operator';
    phone?: string;
}

interface Lead {
    id: number;
    name: string;
    phone: string;
    gender?: 'male' | 'female' | 'unknown';
    age?: number;
    source: string;
    status: string;
    quality: string;
    intention?: string;
    budget_min?: number;
    budget_max?: number;
    quote_version_id?: number;
    churn_reason_id?: number;
    owner_id?: number;
    assignee_id?: number;
    contract_pending_explanation?: string;
    contract_amount?: number;
    signed_at?: string;
    created_at: string;
    updated_at: string;
    owner?: User;
    assignee?: User;
    quoteVersion?: QuoteVersion;
    churnReason?: ChurnReason;
    consultations?: Consultation[];
    responseNodes?: ResponseNode[];
}

interface Consultation {
    id: number;
    lead_id: number;
    content: string;
    intention?: string;
    quality?: string;
    next_follow_at?: string;
    operator_id: number;
    created_at: string;
    operator?: User;
}

interface ResponseNode {
    id: number;
    lead_id: number;
    node_type: string;
    content: string;
    operator_id: number;
    created_at: string;
    operator?: User;
}

interface QuoteVersion {
    id: number;
    version: string;
    name: string;
    description?: string;
    is_active: boolean;
    effective_date: string;
    items?: QuoteItem[];
    created_at: string;
}

interface QuoteItem {
    id: number;
    quote_version_id: number;
    category: string;
    name: string;
    price: number;
    unit: string;
}

interface OceanRule {
    id: number;
    name: string;
    days_unassigned: number;
    days_no_follow: number;
    description?: string;
    is_active: boolean;
    created_at: string;
}

interface ChurnReason {
    id: number;
    name: string;
    category: string;
    description?: string;
    is_active: boolean;
    sort_order: number;
}

interface LeadSourceStat {
    source: string;
    source_label: string;
    total: number;
    contacted: number;
    consulting: number;
    quoted: number;
    signed: number;
    conversion_rate: number;
}

interface LeadQualityStat {
    quality: string;
    quality_label: string;
    total: number;
    signed: number;
    conversion_rate: number;
    avg_amount: number;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: any[];
}

interface FlashMessage {
    message?: string;
    success?: string;
    error?: string;
}

interface PageProps {
    auth: {
        user: User | null;
    };
    flash: FlashMessage;
    leadStatuses: SelectOption[];
    leadSources: SelectOption[];
    leadQualities: SelectOption[];
    responseNodeTypes: SelectOption[];
    errors?: Record<string, string[]>;
}

interface SelectOption {
    value: string;
    label: string;
}
