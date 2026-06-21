using Counseling.Domain.Entities;
using Counseling.Domain.Enums;

namespace Counseling.Domain.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id);
    Task<List<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}

public interface IAppointmentRepository : IRepository<Appointment>
{
    Task<Appointment?> GetByAppointmentNoAsync(string appointmentNo);
    Task<List<Appointment>> GetByClientIdAsync(int clientId);
    Task<List<Appointment>> GetByCounselorIdAsync(int counselorId, DateTime date);
    Task<List<Appointment>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<List<Appointment>> GetByStatusAsync(AppointmentStatus status);
    Task<Appointment?> GetWithDetailsAsync(int id);
    Task<int> GetCountByDateAsync(DateTime date);
}

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByPhoneAsync(string phone);
    Task<List<User>> GetByRoleAsync(UserRole role);
    Task<bool> UsernameExistsAsync(string username);
    Task<bool> PhoneExistsAsync(string phone);
}

public interface ICounselorRepository : IRepository<Counselor>
{
    Task<Counselor?> GetByUserIdAsync(int userId);
    Task<List<Counselor>> GetAvailableAsync(DateTime date, TimeSpan startTime, TimeSpan endTime);
    Task<List<Counselor>> GetByServiceItemIdAsync(int serviceItemId);
    Task<Counselor?> GetWithDetailsAsync(int id);
}

public interface IServiceItemRepository : IRepository<ServiceItem>
{
    Task<List<ServiceItem>> GetActiveAsync();
    Task<List<ServiceItem>> GetByPrivacyLevelAsync(PrivacyLevel level);
    Task<bool> NameExistsAsync(string name);
}

public interface ICheckInRecordRepository : IRepository<CheckInRecord>
{
    Task<CheckInRecord?> GetByAppointmentIdAsync(int appointmentId);
    Task<List<CheckInRecord>> GetByDateAsync(DateTime date);
    Task<List<CheckInRecord>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
}

public interface INoShowRecordRepository : IRepository<NoShowRecord>
{
    Task<NoShowRecord?> GetByAppointmentIdAsync(int appointmentId);
    Task<List<NoShowRecord>> GetByClientIdAsync(int clientId);
    Task<List<NoShowRecord>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
}

public interface IRefundRecordRepository : IRepository<RefundRecord>
{
    Task<RefundRecord?> GetByAppointmentIdAsync(int appointmentId);
    Task<List<RefundRecord>> GetByStatusAsync(RefundStatus status);
    Task<List<RefundRecord>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
}

public interface IWaitlistItemRepository : IRepository<WaitlistItem>
{
    Task<List<WaitlistItem>> GetActiveByServiceItemIdAsync(int serviceItemId);
    Task<List<WaitlistItem>> GetByClientIdAsync(int clientId);
    Task<List<WaitlistItem>> GetActiveByDateAsync(DateTime date);
}

public interface IReminderRepository : IRepository<Reminder>
{
    Task<List<Reminder>> GetByUserIdAsync(int userId, bool onlyUnread = false);
    Task<List<Reminder>> GetPendingRemindersAsync(DateTime beforeTime);
    Task<List<Reminder>> GetByTypeAsync(ReminderType type, DateTime startDate, DateTime endDate);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int userId);
}

public interface IStoreClosureRepository : IRepository<StoreClosure>
{
    Task<List<StoreClosure>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<List<StoreClosure>> GetActiveClosuresAsync(DateTime date);
    Task<bool> IsStoreClosedAsync(DateTime date, TimeSpan time);
}

public interface IStatisticsRepository
{
    Task<StatisticsDaily> GetDailyStatisticsAsync(DateTime date);
    Task<List<StatisticsDaily>> GetStatisticsByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<decimal> GetAttendanceRateAsync(DateTime startDate, DateTime endDate);
    Task<int> GetTotalAppointmentsAsync(DateTime startDate, DateTime endDate);
}
