using Counseling.Domain.Entities;
using Counseling.Domain.Interfaces;
using Counseling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Counseling.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<List<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        entity.CreatedAt = DateTime.UtcNow;
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await UpdateAsync(entity);
        }
    }

    public virtual async Task<bool> ExistsAsync(int id)
    {
        return await _dbSet.AnyAsync(e => e.Id == id && !e.IsDeleted);
    }
}

public class AppointmentRepository : Repository<Appointment>, IAppointmentRepository
{
    public AppointmentRepository(AppDbContext context) : base(context) { }

    public async Task<Appointment?> GetByAppointmentNoAsync(string appointmentNo)
    {
        return await _dbSet.FirstOrDefaultAsync(a => a.AppointmentNo == appointmentNo);
    }

    public async Task<List<Appointment>> GetByClientIdAsync(int clientId)
    {
        return await _dbSet
            .Where(a => a.ClientId == clientId)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<List<Appointment>> GetByCounselorIdAsync(int counselorId, DateTime date)
    {
        return await _dbSet
            .Where(a => a.CounselorId == counselorId && a.AppointmentDate.Date == date.Date)
            .OrderBy(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<List<Appointment>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(a => a.AppointmentDate >= startDate.Date && a.AppointmentDate <= endDate.Date)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<List<Appointment>> GetByStatusAsync(AppointmentStatus status)
    {
        return await _dbSet
            .Where(a => a.Status == status)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<Appointment?> GetWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(a => a.Client)
            .Include(a => a.Counselor)
                .ThenInclude(c => c!.User)
            .Include(a => a.ServiceItem)
            .Include(a => a.CheckInRecord)
            .Include(a => a.RefundRecord)
            .Include(a => a.NoShowRecord)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<int> GetCountByDateAsync(DateTime date)
    {
        return await _dbSet
            .CountAsync(a => a.AppointmentDate.Date == date.Date);
    }
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByPhoneAsync(string phone)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Phone == phone);
    }

    public async Task<List<User>> GetByRoleAsync(UserRole role)
    {
        return await _dbSet
            .Where(u => u.Role == role)
            .OrderBy(u => u.FullName)
            .ToListAsync();
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        return await _dbSet.AnyAsync(u => u.Username == username);
    }

    public async Task<bool> PhoneExistsAsync(string phone)
    {
        return await _dbSet.AnyAsync(u => u.Phone == phone);
    }
}

public class CounselorRepository : Repository<Counselor>, ICounselorRepository
{
    public CounselorRepository(AppDbContext context) : base(context) { }

    public async Task<Counselor?> GetByUserIdAsync(int userId)
    {
        return await _dbSet.FirstOrDefaultAsync(c => c.UserId == userId);
    }

    public async Task<List<Counselor>> GetAvailableAsync(DateTime date, TimeSpan startTime, TimeSpan endTime)
    {
        var busyCounselorIds = await _context.Appointments
            .Where(a => a.AppointmentDate.Date == date.Date
                && a.Status != AppointmentStatus.Cancelled
                && a.Status != AppointmentStatus.NoShow
                && ((a.StartTime <= startTime && a.EndTime > startTime)
                    || (a.StartTime < endTime && a.EndTime >= endTime)
                    || (a.StartTime >= startTime && a.EndTime <= endTime)))
            .Select(a => a.CounselorId)
            .Distinct()
            .ToListAsync();

        return await _dbSet
            .Include(c => c.User)
            .Include(c => c.ServiceItems)
            .Where(c => c.User != null && c.User.IsActive && !busyCounselorIds.Contains(c.Id))
            .OrderBy(c => c.User!.FullName)
            .ToListAsync();
    }

    public async Task<List<Counselor>> GetByServiceItemIdAsync(int serviceItemId)
    {
        return await _dbSet
            .Include(c => c.User)
            .Where(c => c.ServiceItems.Any(s => s.Id == serviceItemId))
            .OrderBy(c => c.User!.FullName)
            .ToListAsync();
    }

    public async Task<Counselor?> GetWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(c => c.User)
            .Include(c => c.ServiceItems)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
}

public class ServiceItemRepository : Repository<ServiceItem>, IServiceItemRepository
{
    public ServiceItemRepository(AppDbContext context) : base(context) { }

    public async Task<List<ServiceItem>> GetActiveAsync()
    {
        return await _dbSet
            .Where(s => s.Status == ServiceStatus.Active)
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    public async Task<List<ServiceItem>> GetByPrivacyLevelAsync(PrivacyLevel level)
    {
        return await _dbSet
            .Where(s => s.PrivacyLevel <= level)
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    public async Task<bool> NameExistsAsync(string name)
    {
        return await _dbSet.AnyAsync(s => s.Name == name);
    }
}

public class CheckInRecordRepository : Repository<CheckInRecord>, ICheckInRecordRepository
{
    public CheckInRecordRepository(AppDbContext context) : base(context) { }

    public async Task<CheckInRecord?> GetByAppointmentIdAsync(int appointmentId)
    {
        return await _dbSet.FirstOrDefaultAsync(c => c.AppointmentId == appointmentId);
    }

    public async Task<List<CheckInRecord>> GetByDateAsync(DateTime date)
    {
        return await _dbSet
            .Where(c => c.CheckInTime.Date == date.Date)
            .OrderByDescending(c => c.CheckInTime)
            .ToListAsync();
    }

    public async Task<List<CheckInRecord>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(c => c.CheckInTime >= startDate && c.CheckInTime <= endDate)
            .OrderByDescending(c => c.CheckInTime)
            .ToListAsync();
    }
}

public class NoShowRecordRepository : Repository<NoShowRecord>, INoShowRecordRepository
{
    public NoShowRecordRepository(AppDbContext context) : base(context) { }

    public async Task<NoShowRecord?> GetByAppointmentIdAsync(int appointmentId)
    {
        return await _dbSet.FirstOrDefaultAsync(n => n.AppointmentId == appointmentId);
    }

    public async Task<List<NoShowRecord>> GetByClientIdAsync(int clientId)
    {
        return await _dbSet
            .Where(n => n.Appointment != null && n.Appointment.ClientId == clientId)
            .OrderByDescending(n => n.RecordedAt)
            .ToListAsync();
    }

    public async Task<List<NoShowRecord>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(n => n.RecordedAt >= startDate && n.RecordedAt <= endDate)
            .OrderByDescending(n => n.RecordedAt)
            .ToListAsync();
    }
}

public class RefundRecordRepository : Repository<RefundRecord>, IRefundRecordRepository
{
    public RefundRecordRepository(AppDbContext context) : base(context) { }

    public async Task<RefundRecord?> GetByAppointmentIdAsync(int appointmentId)
    {
        return await _dbSet.FirstOrDefaultAsync(r => r.AppointmentId == appointmentId);
    }

    public async Task<List<RefundRecord>> GetByStatusAsync(RefundStatus status)
    {
        return await _dbSet
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<RefundRecord>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(r => r.CreatedAt >= startDate && r.CreatedAt <= endDate)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }
}

public class WaitlistItemRepository : Repository<WaitlistItem>, IWaitlistItemRepository
{
    public WaitlistItemRepository(AppDbContext context) : base(context) { }

    public async Task<List<WaitlistItem>> GetActiveByServiceItemIdAsync(int serviceItemId)
    {
        return await _dbSet
            .Include(w => w.Client)
            .Include(w => w.ServiceItem)
            .Where(w => w.ServiceItemId == serviceItemId && w.IsActive)
            .OrderBy(w => w.Priority)
            .ThenBy(w => w.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<WaitlistItem>> GetByClientIdAsync(int clientId)
    {
        return await _dbSet
            .Where(w => w.ClientId == clientId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<WaitlistItem>> GetActiveByDateAsync(DateTime date)
    {
        return await _dbSet
            .Include(w => w.Client)
            .Include(w => w.ServiceItem)
            .Include(w => w.PreferredCounselor)
            .Where(w => w.PreferredDate.Date == date.Date && w.IsActive)
            .OrderBy(w => w.Priority)
            .ThenBy(w => w.CreatedAt)
            .ToListAsync();
    }
}

public class ReminderRepository : Repository<Reminder>, IReminderRepository
{
    public ReminderRepository(AppDbContext context) : base(context) { }

    public async Task<List<Reminder>> GetByUserIdAsync(int userId, bool onlyUnread = false)
    {
        var query = _dbSet.Where(r => r.UserId == userId);
        if (onlyUnread)
        {
            query = query.Where(r => !r.IsRead);
        }
        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Reminder>> GetPendingRemindersAsync(DateTime beforeTime)
    {
        return await _dbSet
            .Where(r => !r.IsSent && r.ScheduledAt <= beforeTime)
            .OrderBy(r => r.ScheduledAt)
            .ToListAsync();
    }

    public async Task<List<Reminder>> GetByTypeAsync(ReminderType type, DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(r => r.Type == type && r.CreatedAt >= startDate && r.CreatedAt <= endDate)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _dbSet.CountAsync(r => r.UserId == userId && !r.IsRead);
    }

    public async Task MarkAsReadAsync(int id)
    {
        var reminder = await GetByIdAsync(id);
        if (reminder != null)
        {
            reminder.IsRead = true;
            reminder.ReadAt = DateTime.UtcNow;
            await UpdateAsync(reminder);
        }
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var reminders = await _dbSet.Where(r => r.UserId == userId && !r.IsRead).ToListAsync();
        foreach (var reminder in reminders)
        {
            reminder.IsRead = true;
            reminder.ReadAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
    }
}

public class StoreClosureRepository : Repository<StoreClosure>, IStoreClosureRepository
{
    public StoreClosureRepository(AppDbContext context) : base(context) { }

    public async Task<List<StoreClosure>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(s => s.ClosureDate >= startDate.Date && s.ClosureDate <= endDate.Date)
            .OrderBy(s => s.ClosureDate)
            .ThenBy(s => s.StartTime)
            .ToListAsync();
    }

    public async Task<List<StoreClosure>> GetActiveClosuresAsync(DateTime date)
    {
        return await _dbSet
            .Where(s => s.ClosureDate.Date == date.Date)
            .OrderBy(s => s.StartTime)
            .ToListAsync();
    }

    public async Task<bool> IsStoreClosedAsync(DateTime date, TimeSpan time)
    {
        return await _dbSet
            .AnyAsync(s => s.ClosureDate.Date == date.Date
                && s.StartTime <= time
                && s.EndTime > time);
    }
}

public class StatisticsRepository : IStatisticsRepository
{
    private readonly AppDbContext _context;

    public StatisticsRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StatisticsDaily> GetDailyStatisticsAsync(DateTime date)
    {
        var start = date.Date;
        var end = date.Date.AddDays(1);

        var appointments = await _context.Appointments
            .Where(a => a.AppointmentDate >= start && a.AppointmentDate < end)
            .ToListAsync();

        var checkedInCount = appointments.Count(a => a.Status == AppointmentStatus.CheckedIn || a.Status == AppointmentStatus.Completed);
        var noShowCount = appointments.Count(a => a.Status == AppointmentStatus.NoShow);
        var cancelledCount = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);
        var totalAppointments = appointments.Count;

        var refunds = await _context.RefundRecords
            .Where(r => r.CreatedAt >= start && r.CreatedAt < end && r.Status == RefundStatus.Completed)
            .ToListAsync();

        return new StatisticsDaily
        {
            Date = date.Date,
            TotalAppointments = totalAppointments,
            CheckedInCount = checkedInCount,
            NoShowCount = noShowCount,
            CancelledCount = cancelledCount,
            AttendanceRate = totalAppointments > 0 ? (decimal)checkedInCount / totalAppointments * 100 : 0,
            Revenue = appointments.Where(a => a.Status == AppointmentStatus.CheckedIn || a.Status == AppointmentStatus.Completed).Sum(a => a.Price),
            NewClients = 0,
            RefundCount = refunds.Count,
            RefundAmount = refunds.Sum(r => r.Amount)
        };
    }

    public async Task<List<StatisticsDaily>> GetStatisticsByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var results = new List<StatisticsDaily>();
        var current = startDate.Date;
        while (current <= endDate.Date)
        {
            results.Add(await GetDailyStatisticsAsync(current));
            current = current.AddDays(1);
        }
        return results;
    }

    public async Task<decimal> GetAttendanceRateAsync(DateTime startDate, DateTime endDate)
    {
        var appointments = await _context.Appointments
            .Where(a => a.AppointmentDate >= startDate.Date && a.AppointmentDate <= endDate.Date)
            .ToListAsync();

        var total = appointments.Count;
        if (total == 0) return 0;

        var checkedIn = appointments.Count(a => a.Status == AppointmentStatus.CheckedIn || a.Status == AppointmentStatus.Completed);
        return (decimal)checkedIn / total * 100;
    }

    public async Task<int> GetTotalAppointmentsAsync(DateTime startDate, DateTime endDate)
    {
        return await _context.Appointments
            .CountAsync(a => a.AppointmentDate >= startDate.Date && a.AppointmentDate <= endDate.Date);
    }
}
