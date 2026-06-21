using Counseling.Domain.Enums;

namespace Counseling.Application.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public UserRole Role { get; set; }
    public PrivacyLevel PrivacyLevel { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UserCreateDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public UserRole Role { get; set; }
    public PrivacyLevel PrivacyLevel { get; set; }
}

public class UserUpdateDto
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public PrivacyLevel? PrivacyLevel { get; set; }
    public bool? IsActive { get; set; }
}

public class CounselorDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Specialties { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public int MaxDailyAppointments { get; set; }
    public List<ServiceItemDto>? ServiceItems { get; set; }
}

public class CounselorCreateDto
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Specialties { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public int MaxDailyAppointments { get; set; } = 8;
    public List<int>? ServiceItemIds { get; set; }
}

public class ServiceItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
    public ServiceStatus Status { get; set; }
    public PrivacyLevel PrivacyLevel { get; set; }
}

public class ServiceItemCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
    public PrivacyLevel? PrivacyLevel { get; set; }
}

public class ServiceItemUpdateDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int? DurationMinutes { get; set; }
    public ServiceStatus? Status { get; set; }
    public PrivacyLevel? PrivacyLevel { get; set; }
}

public class AppointmentDto
{
    public int Id { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public int CounselorId { get; set; }
    public string CounselorName { get; set; } = string.Empty;
    public int ServiceItemId { get; set; }
    public string ServiceItemName { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; }
    public string? Notes { get; set; }
    public decimal Price { get; set; }
    public bool IsFromWaitlist { get; set; }
    public DateTime CreatedAt { get; set; }
    public CheckInRecordDto? CheckInRecord { get; set; }
    public RefundRecordDto? RefundRecord { get; set; }
    public NoShowRecordDto? NoShowRecord { get; set; }
}

public class AppointmentCreateDto
{
    public int ClientId { get; set; }
    public int CounselorId { get; set; }
    public int ServiceItemId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class AppointmentUpdateDto
{
    public DateTime? AppointmentDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public int? CounselorId { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public AppointmentStatus? Status { get; set; }
}

public class CheckInRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public DateTime CheckInTime { get; set; }
    public CheckInMethod CheckInMethod { get; set; }
    public string? CheckedInBy { get; set; }
    public bool IsConfirmed { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? ConfirmedBy { get; set; }
    public string? Remarks { get; set; }
}

public class CheckInCreateDto
{
    public string AppointmentNo { get; set; } = string.Empty;
    public CheckInMethod CheckInMethod { get; set; } = CheckInMethod.Manual;
    public string? Remarks { get; set; }
}

public class CheckInConfirmDto
{
    public bool IsConfirmed { get; set; }
    public string? Remarks { get; set; }
}

public class NoShowRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public DateTime RecordedAt { get; set; }
    public string? RecordedBy { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsWaived { get; set; }
    public string? WaivedReason { get; set; }
    public string? WaivedBy { get; set; }
}

public class NoShowCreateDto
{
    public int AppointmentId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class NoShowWaiveDto
{
    public string WaivedReason { get; set; } = string.Empty;
}

public class RefundRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public RefundStatus Status { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public string? RejectedReason { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? TransactionId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RefundCreateDto
{
    public int AppointmentId { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class RefundProcessDto
{
    public bool IsApproved { get; set; }
    public string? Comment { get; set; }
    public string? TransactionId { get; set; }
}

public class WaitlistItemDto
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public int ServiceItemId { get; set; }
    public string ServiceItemName { get; set; } = string.Empty;
    public int? PreferredCounselorId { get; set; }
    public string? PreferredCounselorName { get; set; }
    public DateTime PreferredDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int Priority { get; set; }
    public bool Notified { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WaitlistCreateDto
{
    public int ClientId { get; set; }
    public int ServiceItemId { get; set; }
    public int? PreferredCounselorId { get; set; }
    public DateTime PreferredDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int Priority { get; set; }
}

public class ReminderDto
{
    public int Id { get; set; }
    public int? AppointmentId { get; set; }
    public int UserId { get; set; }
    public ReminderType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime ScheduledAt { get; set; }
    public bool IsSent { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StoreClosureDto
{
    public int Id { get; set; }
    public DateTime ClosureDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsFullDay { get; set; }
    public string? AffectedCounselors { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class StoreClosureCreateDto
{
    public DateTime ClosureDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsFullDay { get; set; }
    public string? AffectedCounselors { get; set; }
}

public class StatisticsDailyDto
{
    public DateTime Date { get; set; }
    public int TotalAppointments { get; set; }
    public int CheckedInCount { get; set; }
    public int NoShowCount { get; set; }
    public int CancelledCount { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal Revenue { get; set; }
    public int NewClients { get; set; }
    public int RefundCount { get; set; }
    public decimal RefundAmount { get; set; }
}

public class CrossDepartmentReportDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal OverallAttendanceRate { get; set; }
    public int TotalAppointments { get; set; }
    public int TotalCompleted { get; set; }
    public int TotalCheckedIn { get; set; }
    public int TotalNoShow { get; set; }
    public int TotalCancelled { get; set; }
    public List<StoreClosureDto> StoreClosures { get; set; } = new();
    public List<AppointmentDto> RecentProcessedRecords { get; set; } = new();
    public List<StatisticsDailyDto> DailyStatistics { get; set; } = new();
    public List<RefundRecordDto> RefundRecords { get; set; } = new();
    public List<ServiceItemDto> ServiceItems { get; set; } = new();
    public List<WaitlistReminderDto> WaitlistReminders { get; set; } = new();
    public List<ServiceItemStatsDto> ServiceItemStats { get; set; } = new();
    public RefundSummaryDto RefundSummary { get; set; } = new();
    public decimal TotalRevenue { get; set; }
    public decimal TotalRefundAmount { get; set; }
}

public class ServiceItemStatsDto
{
    public int ServiceItemId { get; set; }
    public string ServiceItemName { get; set; } = string.Empty;
    public int AppointmentCount { get; set; }
    public int CompletedCount { get; set; }
    public decimal Revenue { get; set; }
    public int WaitlistCount { get; set; }
}

public class RefundSummaryDto
{
    public int TotalRefundCount { get; set; }
    public int PendingCount { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
    public int CompletedCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal CompletedAmount { get; set; }
}

public class WaitlistReminderDto
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int ServiceItemId { get; set; }
    public string ServiceItemName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public int Priority { get; set; }
    public bool Notified { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}

public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int Code { get; set; }
}

public class ApiResponse<T> : ApiResponse
{
    public T? Data { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class PaginationParams
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class AppointmentQueryParams : PaginationParams
{
    public int? ClientId { get; set; }
    public int? CounselorId { get; set; }
    public int? ServiceItemId { get; set; }
    public AppointmentStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Keyword { get; set; }
}
