using Counseling.Application.DTOs;
using Counseling.Domain.Enums;

namespace Counseling.Application.Interfaces;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
    Task<bool> ExistsAsync(string key);
    Task<List<T>?> GetListAsync<T>(string key);
    Task SetListAsync<T>(string key, List<T> values, TimeSpan? expiration = null);
}

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto?> GetByUsernameAsync(string username);
    Task<List<UserDto>> GetAllAsync();
    Task<List<UserDto>> GetByRoleAsync(UserRole role);
    Task<UserDto> CreateAsync(UserCreateDto dto, string createdBy);
    Task UpdateAsync(int id, UserUpdateDto dto, string updatedBy);
    Task DeleteAsync(int id, string deletedBy);
    Task<bool> ValidatePasswordAsync(string username, string password);
}

public interface ICounselorService
{
    Task<CounselorDto?> GetByIdAsync(int id);
    Task<CounselorDto?> GetByUserIdAsync(int userId);
    Task<List<CounselorDto>> GetAllAsync();
    Task<List<CounselorDto>> GetAvailableAsync(DateTime date, TimeSpan startTime, TimeSpan endTime);
    Task<List<CounselorDto>> GetByServiceItemIdAsync(int serviceItemId);
    Task<CounselorDto> CreateAsync(CounselorCreateDto dto, string createdBy);
    Task UpdateAsync(int id, CounselorCreateDto dto, string updatedBy);
    Task DeleteAsync(int id, string deletedBy);
}

public interface IServiceItemService
{
    Task<ServiceItemDto?> GetByIdAsync(int id);
    Task<List<ServiceItemDto>> GetAllAsync();
    Task<List<ServiceItemDto>> GetActiveAsync();
    Task<List<ServiceItemDto>> GetByPrivacyLevelAsync(PrivacyLevel level);
    Task<ServiceItemDto> CreateAsync(ServiceItemCreateDto dto, string createdBy);
    Task UpdateAsync(int id, ServiceItemUpdateDto dto, string updatedBy);
    Task DeleteAsync(int id, string deletedBy);
}

public interface IAppointmentService
{
    Task<AppointmentDto?> GetByIdAsync(int id);
    Task<AppointmentDto?> GetByAppointmentNoAsync(string appointmentNo);
    Task<List<AppointmentDto>> GetByClientIdAsync(int clientId);
    Task<List<AppointmentDto>> GetByCounselorIdAsync(int counselorId, DateTime date);
    Task<List<AppointmentDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<PagedResult<AppointmentDto>> GetPagedAsync(AppointmentQueryParams queryParams);
    Task<AppointmentDto> CreateAsync(AppointmentCreateDto dto, string createdBy);
    Task UpdateAsync(int id, AppointmentUpdateDto dto, string updatedBy);
    Task CancelAsync(int id, string cancelledBy, string? reason = null);
    Task<bool> IsTimeSlotAvailableAsync(int counselorId, DateTime date, TimeSpan startTime, TimeSpan endTime, int? excludeAppointmentId = null);
    string GenerateAppointmentNo();
}

public interface ICheckInService
{
    Task<CheckInRecordDto?> GetByIdAsync(int id);
    Task<CheckInRecordDto?> GetByAppointmentIdAsync(int appointmentId);
    Task<List<CheckInRecordDto>> GetByDateAsync(DateTime date);
    Task<List<CheckInRecordDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<CheckInRecordDto> CheckInAsync(CheckInCreateDto dto, string checkedInBy);
    Task ConfirmAsync(int id, CheckInConfirmDto dto, string confirmedBy);
}

public interface INoShowService
{
    Task<NoShowRecordDto?> GetByIdAsync(int id);
    Task<NoShowRecordDto?> GetByAppointmentIdAsync(int appointmentId);
    Task<List<NoShowRecordDto>> GetByClientIdAsync(int clientId);
    Task<List<NoShowRecordDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<NoShowRecordDto> CreateAsync(NoShowCreateDto dto, string createdBy);
    Task WaiveAsync(int id, NoShowWaiveDto dto, string waivedBy);
}

public interface IRefundService
{
    Task<RefundRecordDto?> GetByIdAsync(int id);
    Task<RefundRecordDto?> GetByAppointmentIdAsync(int appointmentId);
    Task<List<RefundRecordDto>> GetByStatusAsync(RefundStatus status);
    Task<List<RefundRecordDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<RefundRecordDto> CreateAsync(RefundCreateDto dto, string createdBy);
    Task ProcessAsync(int id, RefundProcessDto dto, string processedBy);
    Task CompleteAsync(int id, string transactionId, string completedBy);
}

public interface IWaitlistService
{
    Task<WaitlistItemDto?> GetByIdAsync(int id);
    Task<List<WaitlistItemDto>> GetActiveByServiceItemIdAsync(int serviceItemId);
    Task<List<WaitlistItemDto>> GetByClientIdAsync(int clientId);
    Task<List<WaitlistItemDto>> GetActiveByDateAsync(DateTime date);
    Task<List<WaitlistItemDto>> GetAllActiveAsync();
    Task<WaitlistItemDto> CreateAsync(WaitlistCreateDto dto, string createdBy);
    Task MarkNotifiedAsync(int id, string notifiedBy);
    Task DeactivateAsync(int id, string updatedBy);
}

public interface IReminderService
{
    Task<ReminderDto?> GetByIdAsync(int id);
    Task<List<ReminderDto>> GetByUserIdAsync(int userId, bool onlyUnread = false);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int userId);
    Task CreateReminderAsync(int userId, int? appointmentId, ReminderType type, string title, string message, DateTime scheduledAt);
    Task SendPendingRemindersAsync();
}

public interface IStoreClosureService
{
    Task<StoreClosureDto?> GetByIdAsync(int id);
    Task<List<StoreClosureDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<List<StoreClosureDto>> GetActiveClosuresAsync(DateTime date);
    Task<bool> IsStoreClosedAsync(DateTime date, TimeSpan time);
    Task<StoreClosureDto> CreateAsync(StoreClosureCreateDto dto, string createdBy);
    Task DeleteAsync(int id, string deletedBy);
}

public interface IStatisticsService
{
    Task<StatisticsDailyDto> GetDailyStatisticsAsync(DateTime date);
    Task<List<StatisticsDailyDto>> GetStatisticsByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<decimal> GetAttendanceRateAsync(DateTime startDate, DateTime endDate);
    Task<CrossDepartmentReportDto> GetCrossDepartmentReportAsync(DateTime startDate, DateTime endDate);
}
