export interface User {
	id: number;
	username: string;
	role: 'admin' | 'nurse' | 'vaccinator';
	name: string;
	created_at: string;
}

export interface VaccineBatch {
	id: number;
	batch_no: string;
	box_no: string;
	vaccine_name: string;
	manufacturer: string;
	quantity: number;
	receive_temp: number;
	temp_min: number;
	temp_max: number;
	expire_date: string;
	receiver_id: number;
	receiver_name: string;
	signature?: string;
	status: 'available' | 'isolated' | 'used_up';
	temperature_ok: boolean;
	isolation_reason?: string;
	received_at: string;
	created_at: string;
}

export interface HandoverRecord {
	id: number;
	batch_id: number;
	batch_no: string;
	vaccine_name: string;
	quantity: number;
	check_temp: number;
	temp_ok: boolean;
	sender_id: number;
	sender_name: string;
	receiver_id?: number;
	receiver_name?: string;
	receiver_signature?: string;
	status: 'pending' | 'completed' | 'failed' | 'temp_fail';
	failure_reason?: string;
	handler_id?: number;
	handler_name?: string;
	next_review_time?: string;
	handover_at: string;
	created_at: string;
}

export interface TempAttachment {
	id: number;
	batch_id: number;
	file_name: string;
	file_type: string;
	uploaded_by: number;
	created_at: string;
}

export interface AbnormalData {
	temperature_violations: VaccineBatch[];
	missing_signatures: VaccineBatch[];
	expiring_soon: VaccineBatch[];
}

export interface StatsData {
	received_today: number;
	handover_today: number;
	pending: number;
	isolated: number;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: User;
}

export interface NavItem {
	path: string;
	label: string;
	icon: string;
	roles?: string[];
}
