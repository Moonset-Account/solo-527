export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'curator' | 'registrar' | 'conservator' | 'logistics' | 'finance' | 'viewer';
export type ExhibitStatus = 'in_collection' | 'on_loan' | 'in_transit' | 'in_installation' | 'in_deinstallation' | 'under_conservation' | 'retired';
export type LoanStatus = 'draft' | 'pending_review' | 'qualified' | 'inventory_verified' | 'schedule_confirmed' | 'awaiting_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
export type InsuranceStatus = 'draft' | 'submitted' | 'verified' | 'expired' | 'cancelled';
export type ConditionReportStatus = 'draft' | 'pending_confirmation' | 'confirmed' | 'disputed';
export type TransportStatus = 'preparing' | 'in_transit' | 'delivered' | 'received' | 'returned';
export type LocationType = 'gallery' | 'storage' | 'conservation_lab' | 'loading_dock' | 'off_site';
export type NotificationType = 'system' | 'loan_status' | 'condition_report' | 'transport' | 'insurance' | 'reconciliation';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'import' | 'export';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ExhibitionLocation {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  floor?: string;
  area?: string;
  description?: string;
  max_exhibits: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BorrowingInstitution {
  id: string;
  name: string;
  type?: string;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  qualification_certificates?: string[];
  is_qualified: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Exhibit {
  id: string;
  accession_number: string;
  title: string;
  artist?: string;
  creation_date?: string;
  medium?: string;
  dimensions?: string;
  weight_kg?: number;
  description?: string;
  provenance?: string;
  status: ExhibitStatus;
  current_location_id?: string;
  estimated_value?: number;
  currency: string;
  images?: string[];
  condition_notes?: string;
  special_handling?: string;
  crate_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanContract {
  id: string;
  contract_number: string;
  title: string;
  borrowing_institution_id: string;
  start_date: string;
  end_date: string;
  purpose?: string;
  terms_and_conditions?: string;
  fee_amount?: number;
  currency: string;
  payment_terms?: string;
  signed_by_institution: boolean;
  signed_by_museum: boolean;
  signed_at?: string;
  contract_file_url?: string;
  status: LoanStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanApplication {
  id: string;
  contract_id: string;
  exhibit_id: string;
  requested_start_date: string;
  requested_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  display_location?: string;
  qualification_check_passed?: boolean;
  inventory_check_passed?: boolean;
  schedule_check_passed?: boolean;
  manual_confirmed_by?: string;
  manual_confirmed_at?: string;
  notes?: string;
  status: LoanStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InsurancePolicy {
  id: string;
  policy_number: string;
  insurance_company: string;
  application_id?: string;
  exhibit_id: string;
  coverage_amount: number;
  currency: string;
  coverage_start_date: string;
  coverage_end_date: string;
  policy_type?: string;
  coverage_details?: string;
  premium_amount?: number;
  policy_file_url?: string;
  verified_by?: string;
  verified_at?: string;
  status: InsuranceStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingCrate {
  id: string;
  crate_number: string;
  name?: string;
  dimensions?: string;
  max_weight_kg?: number;
  material?: string;
  climate_control: boolean;
  shock_sensors: boolean;
  current_status: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ConditionReport {
  id: string;
  report_number: string;
  exhibit_id: string;
  application_id?: string;
  report_type: string;
  report_date: string;
  overall_condition: string;
  condition_details?: string;
  previous_damage?: string;
  new_damage?: string;
  treatment_recommendations?: string;
  images?: string[];
  prepared_by?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  status: ConditionReportStatus;
  signature_data_sender?: string;
  signature_data_receiver?: string;
  signed_by_sender_at?: string;
  signed_by_receiver_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TransportHandover {
  id: string;
  handover_number: string;
  application_id: string;
  crate_id?: string;
  transport_type?: string;
  carrier_name?: string;
  tracking_number?: string;
  departure_location?: string;
  destination_location?: string;
  planned_departure?: string;
  actual_departure?: string;
  planned_arrival?: string;
  actual_arrival?: string;
  sender_signature?: string;
  sender_signed_by?: string;
  sender_signed_at?: string;
  receiver_signature?: string;
  receiver_signed_by?: string;
  receiver_signed_at?: string;
  condition_report_id?: string;
  status: TransportStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InstallationRecord {
  id: string;
  record_number: string;
  application_id: string;
  location_id?: string;
  planned_install_date?: string;
  actual_install_date?: string;
  installed_by?: string;
  condition_before_install?: string;
  installation_notes?: string;
  verified_by?: string;
  verified_at?: string;
  photos?: string[];
  is_completed: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeinstallationRecord {
  id: string;
  record_number: string;
  application_id: string;
  planned_deinstall_date?: string;
  actual_deinstall_date?: string;
  deinstalled_by?: string;
  condition_after_deinstall?: string;
  deinstallation_notes?: string;
  returned_to_storage: boolean;
  verified_by?: string;
  verified_at?: string;
  photos?: string[];
  is_completed: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionRecord {
  id: string;
  application_id: string;
  action: string;
  description?: string;
  performed_by?: string;
  performed_at: string;
  metadata?: Json;
  created_at: string;
}

export interface MonthlyReconciliation {
  id: string;
  reconciliation_month: string;
  total_contracts: number;
  total_fees: number;
  total_insurance_premiums: number;
  total_transport_costs: number;
  status: string;
  prepared_by?: string;
  prepared_at?: string;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationItem {
  id: string;
  reconciliation_id: string;
  application_id?: string;
  item_type: string;
  description?: string;
  amount: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  type: NotificationType;
  title: string;
  content?: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  created_at: string;
}

export interface ImportExportJob {
  id: string;
  job_type: JobType;
  entity_type: string;
  status: JobStatus;
  file_url?: string;
  file_name?: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  error_message?: string;
  created_by?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ErrorLog {
  id: string;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  path?: string;
  metadata?: Json;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Omit<Profile, 'id' | 'created_at'>> };
      exhibition_locations: { Row: ExhibitionLocation; Insert: Omit<ExhibitionLocation, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ExhibitionLocation, 'id' | 'created_at'>> };
      borrowing_institutions: { Row: BorrowingInstitution; Insert: Omit<BorrowingInstitution, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<BorrowingInstitution, 'id' | 'created_at'>> };
      exhibits: { Row: Exhibit; Insert: Omit<Exhibit, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Exhibit, 'id' | 'created_at'>> };
      loan_contracts: { Row: LoanContract; Insert: Omit<LoanContract, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<LoanContract, 'id' | 'created_at'>> };
      loan_applications: { Row: LoanApplication; Insert: Omit<LoanApplication, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<LoanApplication, 'id' | 'created_at'>> };
      insurance_policies: { Row: InsurancePolicy; Insert: Omit<InsurancePolicy, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<InsurancePolicy, 'id' | 'created_at'>> };
      shipping_crates: { Row: ShippingCrate; Insert: Omit<ShippingCrate, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ShippingCrate, 'id' | 'created_at'>> };
      condition_reports: { Row: ConditionReport; Insert: Omit<ConditionReport, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ConditionReport, 'id' | 'created_at'>> };
      transport_handovers: { Row: TransportHandover; Insert: Omit<TransportHandover, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<TransportHandover, 'id' | 'created_at'>> };
      installation_records: { Row: InstallationRecord; Insert: Omit<InstallationRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<InstallationRecord, 'id' | 'created_at'>> };
      deinstallation_records: { Row: DeinstallationRecord; Insert: Omit<DeinstallationRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DeinstallationRecord, 'id' | 'created_at'>> };
      execution_records: { Row: ExecutionRecord; Insert: Omit<ExecutionRecord, 'id' | 'created_at'>; Update: Partial<Omit<ExecutionRecord, 'id' | 'created_at'>> };
      monthly_reconciliations: { Row: MonthlyReconciliation; Insert: Omit<MonthlyReconciliation, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<MonthlyReconciliation, 'id' | 'created_at'>> };
      reconciliation_items: { Row: ReconciliationItem; Insert: Omit<ReconciliationItem, 'id' | 'created_at'>; Update: Partial<Omit<ReconciliationItem, 'id' | 'created_at'>> };
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Omit<Notification, 'id' | 'created_at'>> };
      import_export_jobs: { Row: ImportExportJob; Insert: Omit<ImportExportJob, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ImportExportJob, 'id' | 'created_at'>> };
      error_logs: { Row: ErrorLog; Insert: Omit<ErrorLog, 'id' | 'created_at'>; Update: Partial<Omit<ErrorLog, 'id' | 'created_at'>> };
    };
    Views: Record<string, never>;
    Functions: {
      check_exhibit_availability: { Args: { p_exhibit_id: string; p_start_date: string; p_end_date: string; p_exclude_application_id?: string }; Returns: boolean };
      check_institution_qualification: { Args: { p_institution_id: string }; Returns: boolean };
      check_condition_report_confirmed: { Args: { p_application_id: string }; Returns: boolean };
      check_transport_both_signed: { Args: { p_handover_id: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      exhibit_status: ExhibitStatus;
      loan_status: LoanStatus;
      insurance_status: InsuranceStatus;
      condition_report_status: ConditionReportStatus;
      transport_status: TransportStatus;
      location_type: LocationType;
      notification_type: NotificationType;
      job_status: JobStatus;
      job_type: JobType;
    };
  };
}
