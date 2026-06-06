package models

import "time"

type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"`
	Role      string    `json:"role"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type VaccineBatch struct {
	ID             int64     `json:"id"`
	BatchNo        string    `json:"batch_no"`
	BoxNo          string    `json:"box_no"`
	VaccineName    string    `json:"vaccine_name"`
	Manufacturer   string    `json:"manufacturer"`
	Quantity       int       `json:"quantity"`
	ReceiveTemp    float64   `json:"receive_temp"`
	TempMin        float64   `json:"temp_min"`
	TempMax        float64   `json:"temp_max"`
	ExpireDate     string    `json:"expire_date"`
	ReceiverID     int64     `json:"receiver_id"`
	ReceiverName   string    `json:"receiver_name"`
	Signature      string    `json:"signature"`
	Status         string    `json:"status"`
	TemperatureOk  bool      `json:"temperature_ok"`
	IsolationReason string   `json:"isolation_reason,omitempty"`
	ReceivedAt     time.Time `json:"received_at"`
	CreatedAt      time.Time `json:"created_at"`
}

type HandoverRecord struct {
	ID             int64     `json:"id"`
	BatchID        int64     `json:"batch_id"`
	BatchNo        string    `json:"batch_no"`
	VaccineName    string    `json:"vaccine_name"`
	Quantity       int       `json:"quantity"`
	CheckTemp      float64   `json:"check_temp"`
	TempOk         bool      `json:"temp_ok"`
	SenderID       int64     `json:"sender_id"`
	SenderName     string    `json:"sender_name"`
	ReceiverID     int64     `json:"receiver_id"`
	ReceiverName   string    `json:"receiver_name"`
	ReceiverSignature string  `json:"receiver_signature"`
	Status         string    `json:"status"`
	FailureReason  string    `json:"failure_reason,omitempty"`
	HandlerID      int64     `json:"handler_id,omitempty"`
	HandlerName    string    `json:"handler_name,omitempty"`
	NextReviewTime string    `json:"next_review_time,omitempty"`
	HandoverAt     time.Time `json:"handover_at"`
	CreatedAt      time.Time `json:"created_at"`
}

type TempAttachment struct {
	ID         int64     `json:"id"`
	BatchID    int64     `json:"batch_id"`
	FileName   string    `json:"file_name"`
	FileType   string    `json:"file_type"`
	FileData   []byte    `json:"-"`
	UploadedBy int64     `json:"uploaded_by"`
	CreatedAt  time.Time `json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ReceiveBatchRequest struct {
	BatchNo      string  `json:"batch_no"`
	BoxNo        string  `json:"box_no"`
	VaccineName  string  `json:"vaccine_name"`
	Manufacturer string  `json:"manufacturer"`
	Quantity     int     `json:"quantity"`
	ReceiveTemp  float64 `json:"receive_temp"`
	TempMin      float64 `json:"temp_min"`
	TempMax      float64 `json:"temp_max"`
	ExpireDate   string  `json:"expire_date"`
	Signature    string  `json:"signature"`
}

type HandoverRequest struct {
	BatchID    int64   `json:"batch_id"`
	Quantity   int     `json:"quantity"`
	CheckTemp  float64 `json:"check_temp"`
	ReceiverID int64   `json:"receiver_id"`
	Signature  string  `json:"signature"`
}

type HandoverFailureRequest struct {
	HandoverID     int64  `json:"handover_id"`
	FailureReason  string `json:"failure_reason"`
	HandlerID      int64  `json:"handler_id"`
	NextReviewTime string `json:"next_review_time"`
}

type IsolateRequest struct {
	BatchID int64  `json:"batch_id"`
	Reason  string `json:"reason"`
}
