export type UserRole = 'admin' | 'coach' | 'receptionist' | 'member';
export type MemberStatus = 'active' | 'frozen' | 'expired' | 'cancelled';
export type CoachStatus = 'active' | 'inactive';
export type PackageStatus = 'active' | 'frozen' | 'expired' | 'exhausted' | 'cancelled';
export type AppointmentType = 'private' | 'group';
export type AppointmentStatus = 'booked' | 'checked_in' | 'cancelled' | 'no_show';
export type FreezeStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type MessageType = 'system' | 'reminder' | 'approval' | 'notification';
export type ScheduleType = 'private' | 'group' | 'rest' | 'leave';
export type ScheduleStatus = 'pending' | 'approved' | 'rejected';
export type RenewalStatus = 'expiring' | 'expired' | 'renewed' | 'lost';

export interface User { id: number; username: string; role: UserRole; name: string; phone: string; email: string; avatar_url?: string; coach_id?: number; member_id?: number; created_at: string; updated_at: string; }
export interface Member { id: number; name: string; phone: string; email?: string; gender?: string; birthday?: string; emergency_contact?: string; notes?: string; status: MemberStatus; created_at: string; updated_at: string; }
export interface Coach { id: number; name: string; phone: string; email?: string; specialties?: string; certifications?: string; bio?: string; status: CoachStatus; created_at: string; updated_at: string; }
export interface PackageType { id: number; name: string; total_sessions: number; valid_days: number; price: number; description?: string; active: boolean; created_at: string; }
export interface MemberPackage { id: number; member_id: number; package_type_id: number; remaining_sessions: number; total_sessions: number; start_date: string; expiry_date: string; paid_amount: number; status: PackageStatus; created_at: string; }
export interface GroupClass { id: number; name: string; coach_id: number; start_time: string; end_time: string; max_capacity: number; current_bookings: number; status: 'scheduled' | 'cancelled' | 'completed'; created_at: string; }
export interface Appointment { id: number; member_id: number; coach_id: number; member_package_id?: number; start_time: string; end_time: string; type: AppointmentType; group_class_id?: number; status: AppointmentStatus; notes?: string; checked_in_at?: string; created_at: string; }
export interface Freeze { id: number; member_id: number; member_package_id: number; start_date: string; end_date: string; reason?: string; status: FreezeStatus; approved_by?: number; approved_at?: string; extra_days: number; created_at: string; }
export interface BodyTest { id: number; member_id: number; coach_id: number; height?: number; weight?: number; body_fat?: number; muscle_mass?: number; waist?: number; chest?: number; hips?: number; notes?: string; test_date: string; created_at: string; }
export interface Message { id: number; user_id: number; title: string; content: string; type: MessageType; read: boolean; related_entity_type?: string; related_entity_id?: number; created_at: string; }
export interface Schedule { id: number; coach_id: number; date: string; start_time: string; end_time: string; type: ScheduleType; status: ScheduleStatus; approved_by?: number; created_at: string; }
export interface AuditLog { id: number; user_id?: number; entity_type: string; entity_id: number; action: string; old_value?: string; new_value?: string; created_at: string; }
export interface SessionDeduction { id: number; appointment_id: number; member_package_id: number; sessions_deducted: number; remaining_after: number; deducted_at: string; }
export interface RenewalTracking { id: number; member_id: number; member_package_id: number; status: RenewalStatus; follow_up_notes?: string; first_reminder_at?: string; last_reminder_at?: string; renewed_at?: string; created_at: string; }
export interface EmailLog { id: number; user_id?: number; to_address: string; subject: string; status: 'sent' | 'failed'; error_message?: string; sent_at: string; }

export interface AuthUser extends User { coach?: Coach; member?: Member; }
export interface DashboardStats { todayPrivateCount: number; todayGroupCount: number; pendingFreezeCount: number; expiringMemberCount: number; unreadMessageCount: number; coachPerformance?: { id: number; name: string; sessions: number; revenue: number }[]; renewalFunnel?: { expiring: number; expired: number; renewed: number; lost: number }; todayAppointments?: Appointment[]; }
