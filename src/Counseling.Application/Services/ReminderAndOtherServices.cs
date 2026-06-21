using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Entities;
using Counseling.Domain.Enums;
using Counseling.Domain.Interfaces;

namespace Counseling.Application.Services;

public class ReminderService : IReminderService
{
    private readonly IReminderRepository _reminderRepository;
    private readonly ICacheService _cache;

    public ReminderService(IReminderRepository reminderRepository, ICacheService cache)
    {
        _reminderRepository = reminderRepository;
        _cache = cache;
    }

    public async Task<ReminderDto?> GetByIdAsync(int id)
    {
        var reminder = await _reminderRepository.GetByIdAsync(id);
        return reminder != null ? MapToDto(reminder) : null;
    }

    public async Task<List<ReminderDto>> GetByUserIdAsync(int userId, bool onlyUnread = false)
    {
        var reminders = await _reminderRepository.GetByUserIdAsync(userId, onlyUnread);
        return reminders.Select(MapToDto).ToList();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        var cacheKey = $"reminders:unread:{userId}";
        var cached = await _cache.GetAsync<int?>(cacheKey);
        if (cached.HasValue) return cached.Value;

        var count = await _reminderRepository.GetUnreadCountAsync(userId);
        await _cache.SetAsync(cacheKey, count, TimeSpan.FromMinutes(5));
        return count;
    }

    public async Task MarkAsReadAsync(int id)
    {
        await _reminderRepository.MarkAsReadAsync(id);
        var reminder = await _reminderRepository.GetByIdAsync(id);
        if (reminder != null)
        {
            await _cache.RemoveAsync($"reminders:unread:{reminder.UserId}");
        }
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        await _reminderRepository.MarkAllAsReadAsync(userId);
        await _cache.RemoveAsync($"reminders:unread:{userId}");
    }

    public async Task CreateReminderAsync(int userId, int? appointmentId, ReminderType type, string title, string message, DateTime scheduledAt)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new Exception("提醒标题不能为空");

        if (string.IsNullOrWhiteSpace(message))
            throw new Exception("提醒内容不能为空");

        var reminder = new Reminder
        {
            UserId = userId,
            AppointmentId = appointmentId,
            Type = type,
            Title = title,
            Message = message,
            IsRead = false,
            ScheduledAt = scheduledAt,
            IsSent = scheduledAt <= DateTime.Now,
            SentAt = scheduledAt <= DateTime.Now ? DateTime.Now : null,
            CreatedBy = "system"
        };

        await _reminderRepository.AddAsync(reminder);
        await _cache.RemoveAsync($"reminders:unread:{userId}");
    }

    public async Task SendPendingRemindersAsync()
    {
        var now = DateTime.Now;
        var pendingReminders = await _reminderRepository.GetPendingRemindersAsync(now);

        foreach (var reminder in pendingReminders)
        {
            reminder.IsSent = true;
            reminder.SentAt = now;
            await _reminderRepository.UpdateAsync(reminder);
            await _cache.RemoveAsync($"reminders:unread:{reminder.UserId}");
        }
    }

    private static ReminderDto MapToDto(Reminder reminder) => new()
    {
        Id = reminder.Id,
        AppointmentId = reminder.AppointmentId,
        UserId = reminder.UserId,
        Type = reminder.Type,
        Title = reminder.Title,
        Message = reminder.Message,
        IsRead = reminder.IsRead,
        ReadAt = reminder.ReadAt,
        ScheduledAt = reminder.ScheduledAt,
        IsSent = reminder.IsSent,
        SentAt = reminder.SentAt,
        CreatedAt = reminder.CreatedAt
    };
}

public class StoreClosureService : IStoreClosureService
{
    private readonly IStoreClosureRepository _repository;
    private readonly ICacheService _cache;

    public StoreClosureService(IStoreClosureRepository repository, ICacheService cache)
    {
        _repository = repository;
        _cache = cache;
    }

    public async Task<StoreClosureDto?> GetByIdAsync(int id)
    {
        var closure = await _repository.GetByIdAsync(id);
        return closure != null ? MapToDto(closure) : null;
    }

    public async Task<List<StoreClosureDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var closures = await _repository.GetByDateRangeAsync(startDate, endDate);
        return closures.Select(MapToDto).ToList();
    }

    public async Task<List<StoreClosureDto>> GetActiveClosuresAsync(DateTime date)
    {
        var cacheKey = $"closures:{date:yyyyMMdd}";
        var cached = await _cache.GetListAsync<StoreClosureDto>(cacheKey);
        if (cached != null) return cached;

        var closures = await _repository.GetActiveClosuresAsync(date);
        var dtos = closures.Select(MapToDto).ToList();
        await _cache.SetListAsync(cacheKey, dtos, TimeSpan.FromHours(1));
        return dtos;
    }

    public async Task<bool> IsStoreClosedAsync(DateTime date, TimeSpan time)
    {
        return await _repository.IsStoreClosedAsync(date, time);
    }

    public async Task<StoreClosureDto> CreateAsync(StoreClosureCreateDto dto, string createdBy)
    {
        if (dto.ClosureDate < DateTime.Today)
            throw new Exception("关店日期不能是过去的日期，请选择今天或之后的日期");

        if (dto.IsFullDay)
        {
            dto.StartTime = TimeSpan.FromHours(0);
            dto.EndTime = TimeSpan.FromHours(24);
        }
        else
        {
            if (!dto.StartTime.HasValue || !dto.EndTime.HasValue)
                throw new Exception("非全天关店必须设置开始和结束时间");

            if (dto.StartTime.Value >= dto.EndTime.Value)
                throw new Exception("关店开始时间必须早于结束时间，请检查时间设置");
        }

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new Exception("请填写关店原因，这对通知来访者很重要");

        var closure = new StoreClosure
        {
            ClosureDate = dto.ClosureDate.Date,
            StartTime = dto.StartTime.Value,
            EndTime = dto.EndTime.Value,
            Reason = dto.Reason,
            IsFullDay = dto.IsFullDay,
            AffectedCounselors = dto.AffectedCounselors,
            CreatedBy = createdBy
        };

        var created = await _repository.AddAsync(closure);
        await _cache.RemoveAsync($"closures:{dto.ClosureDate:yyyyMMdd}");

        return MapToDto(created);
    }

    public async Task DeleteAsync(int id, string deletedBy)
    {
        var closure = await _repository.GetByIdAsync(id);
        if (closure == null)
            throw new Exception("关店记录不存在，无法删除。请检查记录ID是否正确");

        await _repository.DeleteAsync(id);
        await _cache.RemoveAsync($"closures:{closure.ClosureDate:yyyyMMdd}");
    }

    private static StoreClosureDto MapToDto(StoreClosure closure) => new()
    {
        Id = closure.Id,
        ClosureDate = closure.ClosureDate,
        StartTime = closure.StartTime,
        EndTime = closure.EndTime,
        Reason = closure.Reason,
        IsFullDay = closure.IsFullDay,
        AffectedCounselors = closure.AffectedCounselors,
        CreatedBy = closure.CreatedBy,
        CreatedAt = closure.CreatedAt
    };
}

public class StatisticsService : IStatisticsService
{
    private readonly IStatisticsRepository _statisticsRepository;
    private readonly IStoreClosureService _storeClosureService;
    private readonly IAppointmentService _appointmentService;
    private readonly ICacheService _cache;

    public StatisticsService(
        IStatisticsRepository statisticsRepository,
        IStoreClosureService storeClosureService,
        IAppointmentService appointmentService,
        ICacheService cache)
    {
        _statisticsRepository = statisticsRepository;
        _storeClosureService = storeClosureService;
        _appointmentService = appointmentService;
        _cache = cache;
    }

    public async Task<StatisticsDailyDto> GetDailyStatisticsAsync(DateTime date)
    {
        var cacheKey = $"stats:daily:{date:yyyyMMdd}";
        var cached = await _cache.GetAsync<StatisticsDailyDto>(cacheKey);
        if (cached != null) return cached;

        var stats = await _statisticsRepository.GetDailyStatisticsAsync(date);
        var dto = MapDailyToDto(stats);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromHours(2));
        return dto;
    }

    public async Task<List<StatisticsDailyDto>> GetStatisticsByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var stats = await _statisticsRepository.GetStatisticsByDateRangeAsync(startDate, endDate);
        return stats.Select(MapDailyToDto).ToList();
    }

    public async Task<decimal> GetAttendanceRateAsync(DateTime startDate, DateTime endDate)
    {
        return await _statisticsRepository.GetAttendanceRateAsync(startDate, endDate);
    }

    public async Task<CrossDepartmentReportDto> GetCrossDepartmentReportAsync(DateTime startDate, DateTime endDate)
    {
        var cacheKey = $"stats:cross:{startDate:yyyyMMdd}-{endDate:yyyyMMdd}";
        var cached = await _cache.GetAsync<CrossDepartmentReportDto>(cacheKey);
        if (cached != null) return cached;

        var dailyStats = await GetStatisticsByDateRangeAsync(startDate, endDate);
        var storeClosures = await _storeClosureService.GetByDateRangeAsync(startDate, endDate);
        var recentRecords = await _appointmentService.GetByDateRangeAsync(
            endDate.AddDays(-7) > startDate ? endDate.AddDays(-7) : startDate,
            endDate);

        var totalAppointments = dailyStats.Sum(d => d.TotalAppointments);
        var totalCheckedIn = dailyStats.Sum(d => d.CheckedInCount);
        var totalNoShow = dailyStats.Sum(d => d.NoShowCount);
        var totalCancelled = dailyStats.Sum(d => d.CancelledCount);

        var report = new CrossDepartmentReportDto
        {
            StartDate = startDate.Date,
            EndDate = endDate.Date,
            OverallAttendanceRate = totalAppointments > 0 ? (decimal)totalCheckedIn / totalAppointments * 100 : 0,
            TotalAppointments = totalAppointments,
            TotalCheckedIn = totalCheckedIn,
            TotalNoShow = totalNoShow,
            TotalCancelled = totalCancelled,
            StoreClosures = storeClosures,
            RecentProcessedRecords = recentRecords.Take(20).ToList(),
            DailyStatistics = dailyStats
        };

        await _cache.SetAsync(cacheKey, report, TimeSpan.FromHours(1));
        return report;
    }

    private static StatisticsDailyDto MapDailyToDto(StatisticsDaily stats) => new()
    {
        Date = stats.Date,
        TotalAppointments = stats.TotalAppointments,
        CheckedInCount = stats.CheckedInCount,
        NoShowCount = stats.NoShowCount,
        CancelledCount = stats.CancelledCount,
        AttendanceRate = stats.AttendanceRate,
        Revenue = stats.Revenue,
        NewClients = stats.NewClients,
        RefundCount = stats.RefundCount,
        RefundAmount = stats.RefundAmount
    };
}

public class CounselorService : ICounselorService
{
    private readonly ICounselorRepository _counselorRepository;
    private readonly IUserRepository _userRepository;
    private readonly IServiceItemRepository _serviceItemRepository;
    private readonly ICacheService _cache;

    public CounselorService(
        ICounselorRepository counselorRepository,
        IUserRepository userRepository,
        IServiceItemRepository serviceItemRepository,
        ICacheService cache)
    {
        _counselorRepository = counselorRepository;
        _userRepository = userRepository;
        _serviceItemRepository = serviceItemRepository;
        _cache = cache;
    }

    public async Task<CounselorDto?> GetByIdAsync(int id)
    {
        var cacheKey = $"counselor:{id}";
        var cached = await _cache.GetAsync<CounselorDto>(cacheKey);
        if (cached != null) return cached;

        var counselor = await _counselorRepository.GetWithDetailsAsync(id);
        if (counselor == null) return null;

        var dto = await MapToDto(counselor);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(30));
        return dto;
    }

    public async Task<CounselorDto?> GetByUserIdAsync(int userId)
    {
        var counselor = await _counselorRepository.GetByUserIdAsync(userId);
        if (counselor == null) return null;
        return await MapToDto(counselor);
    }

    public async Task<List<CounselorDto>> GetAllAsync()
    {
        var counselors = await _counselorRepository.GetAllAsync();
        var dtos = new List<CounselorDto>();
        foreach (var c in counselors)
        {
            dtos.Add(await MapToDto(c));
        }
        return dtos;
    }

    public async Task<List<CounselorDto>> GetAvailableAsync(DateTime date, TimeSpan startTime, TimeSpan endTime)
    {
        var counselors = await _counselorRepository.GetAvailableAsync(date, startTime, endTime);
        var dtos = new List<CounselorDto>();
        foreach (var c in counselors)
        {
            dtos.Add(await MapToDto(c));
        }
        return dtos;
    }

    public async Task<List<CounselorDto>> GetByServiceItemIdAsync(int serviceItemId)
    {
        var counselors = await _counselorRepository.GetByServiceItemIdAsync(serviceItemId);
        var dtos = new List<CounselorDto>();
        foreach (var c in counselors)
        {
            dtos.Add(await MapToDto(c));
        }
        return dtos;
    }

    public async Task<CounselorDto> CreateAsync(CounselorCreateDto dto, string createdBy)
    {
        var user = await _userRepository.GetByIdAsync(dto.UserId);
        if (user == null)
            throw new Exception("用户不存在，无法创建咨询师档案。请检查用户ID是否正确");

        if (user.Role != UserRole.Counselor && user.Role != UserRole.Admin)
            throw new Exception("该用户角色不是咨询师，请先将用户角色设置为咨询师");

        if (string.IsNullOrWhiteSpace(dto.Title))
            throw new Exception("请填写咨询师职称");

        if (string.IsNullOrWhiteSpace(dto.Specialties))
            throw new Exception("请填写咨询师擅长领域");

        var existing = await _counselorRepository.GetByUserIdAsync(dto.UserId);
        if (existing != null)
            throw new Exception("该用户已有咨询师档案，不能重复创建");

        var counselor = new Counselor
        {
            UserId = dto.UserId,
            Title = dto.Title,
            Specialties = dto.Specialties,
            Bio = dto.Bio,
            MaxDailyAppointments = dto.MaxDailyAppointments,
            CreatedBy = createdBy
        };

        var created = await _counselorRepository.AddAsync(counselor);

        if (dto.ServiceItemIds != null && dto.ServiceItemIds.Any())
        {
            var serviceItems = new List<ServiceItem>();
            foreach (var sid in dto.ServiceItemIds)
            {
                var si = await _serviceItemRepository.GetByIdAsync(sid);
                if (si != null) serviceItems.Add(si);
            }
            created.ServiceItems = serviceItems;
            await _counselorRepository.UpdateAsync(created);
        }

        return await MapToDto(created);
    }

    public async Task UpdateAsync(int id, CounselorCreateDto dto, string updatedBy)
    {
        var counselor = await _counselorRepository.GetWithDetailsAsync(id);
        if (counselor == null)
            throw new Exception("咨询师不存在，无法更新。请检查咨询师ID是否正确");

        if (!string.IsNullOrWhiteSpace(dto.Title))
            counselor.Title = dto.Title;
        if (!string.IsNullOrWhiteSpace(dto.Specialties))
            counselor.Specialties = dto.Specialties;
        if (dto.Bio != null)
            counselor.Bio = dto.Bio;
        if (dto.MaxDailyAppointments > 0)
            counselor.MaxDailyAppointments = dto.MaxDailyAppointments;

        if (dto.ServiceItemIds != null)
        {
            counselor.ServiceItems.Clear();
            foreach (var sid in dto.ServiceItemIds)
            {
                var si = await _serviceItemRepository.GetByIdAsync(sid);
                if (si != null) counselor.ServiceItems.Add(si);
            }
        }

        counselor.UpdatedBy = updatedBy;
        await _counselorRepository.UpdateAsync(counselor);
        await _cache.RemoveAsync($"counselor:{id}");
    }

    public async Task DeleteAsync(int id, string deletedBy)
    {
        var counselor = await _counselorRepository.GetByIdAsync(id);
        if (counselor == null)
            throw new Exception("咨询师不存在，无法删除。请检查咨询师ID是否正确");

        await _counselorRepository.DeleteAsync(id);
        await _cache.RemoveAsync($"counselor:{id}");
    }

    private async Task<CounselorDto> MapToDto(Counselor counselor)
    {
        var user = counselor.User ?? await _userRepository.GetByIdAsync(counselor.UserId);
        var serviceItems = counselor.ServiceItems != null
            ? counselor.ServiceItems.Select(si => new ServiceItemDto
            {
                Id = si.Id,
                Name = si.Name,
                Description = si.Description,
                Price = si.Price,
                DurationMinutes = si.DurationMinutes,
                Status = si.Status,
                PrivacyLevel = si.PrivacyLevel
            }).ToList()
            : null;

        return new CounselorDto
        {
            Id = counselor.Id,
            UserId = counselor.UserId,
            FullName = user?.FullName ?? "未知",
            Title = counselor.Title,
            Specialties = counselor.Specialties,
            Bio = counselor.Bio,
            MaxDailyAppointments = counselor.MaxDailyAppointments,
            ServiceItems = serviceItems
        };
    }
}
