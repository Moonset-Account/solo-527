using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Entities;
using Counseling.Domain.Enums;
using Counseling.Domain.Interfaces;

namespace Counseling.Application.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IServiceItemRepository _serviceItemRepository;
    private readonly ICounselorRepository _counselorRepository;
    private readonly IUserRepository _userRepository;
    private readonly IReminderService _reminderService;
    private readonly IStoreClosureService _storeClosureService;
    private readonly ICacheService _cache;

    public AppointmentService(
        IAppointmentRepository appointmentRepository,
        IServiceItemRepository serviceItemRepository,
        ICounselorRepository counselorRepository,
        IUserRepository userRepository,
        IReminderService reminderService,
        IStoreClosureService storeClosureService,
        ICacheService cache)
    {
        _appointmentRepository = appointmentRepository;
        _serviceItemRepository = serviceItemRepository;
        _counselorRepository = counselorRepository;
        _userRepository = userRepository;
        _reminderService = reminderService;
        _storeClosureService = storeClosureService;
        _cache = cache;
    }

    public async Task<AppointmentDto?> GetByIdAsync(int id)
    {
        var cacheKey = $"appointment:{id}";
        var cached = await _cache.GetAsync<AppointmentDto>(cacheKey);
        if (cached != null) return cached;

        var appointment = await _appointmentRepository.GetWithDetailsAsync(id);
        if (appointment == null) return null;

        var dto = await MapToDto(appointment);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10));
        return dto;
    }

    public async Task<AppointmentDto?> GetByAppointmentNoAsync(string appointmentNo)
    {
        var appointment = await _appointmentRepository.GetByAppointmentNoAsync(appointmentNo);
        if (appointment == null) return null;
        return await MapToDto(appointment);
    }

    public async Task<List<AppointmentDto>> GetByClientIdAsync(int clientId)
    {
        var appointments = await _appointmentRepository.GetByClientIdAsync(clientId);
        var dtos = new List<AppointmentDto>();
        foreach (var appt in appointments)
        {
            dtos.Add(await MapToDto(appt));
        }
        return dtos;
    }

    public async Task<List<AppointmentDto>> GetByCounselorIdAsync(int counselorId, DateTime date)
    {
        var appointments = await _appointmentRepository.GetByCounselorIdAsync(counselorId, date);
        var dtos = new List<AppointmentDto>();
        foreach (var appt in appointments)
        {
            dtos.Add(await MapToDto(appt));
        }
        return dtos;
    }

    public async Task<List<AppointmentDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var appointments = await _appointmentRepository.GetByDateRangeAsync(startDate, endDate);
        var dtos = new List<AppointmentDto>();
        foreach (var appt in appointments)
        {
            dtos.Add(await MapToDto(appt));
        }
        return dtos;
    }

    public async Task<PagedResult<AppointmentDto>> GetPagedAsync(AppointmentQueryParams queryParams)
    {
        var allAppointments = await _appointmentRepository.GetAllAsync();
        var query = allAppointments.AsQueryable();

        if (queryParams.ClientId.HasValue)
            query = query.Where(a => a.ClientId == queryParams.ClientId.Value);
        if (queryParams.CounselorId.HasValue)
            query = query.Where(a => a.CounselorId == queryParams.CounselorId.Value);
        if (queryParams.ServiceItemId.HasValue)
            query = query.Where(a => a.ServiceItemId == queryParams.ServiceItemId.Value);
        if (queryParams.Status.HasValue)
            query = query.Where(a => a.Status == queryParams.Status.Value);
        if (queryParams.StartDate.HasValue)
            query = query.Where(a => a.AppointmentDate >= queryParams.StartDate.Value.Date);
        if (queryParams.EndDate.HasValue)
            query = query.Where(a => a.AppointmentDate <= queryParams.EndDate.Value.Date);

        var totalCount = query.Count();
        var items = query
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.StartTime)
            .Skip((queryParams.PageIndex - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToList();

        var dtos = new List<AppointmentDto>();
        foreach (var appt in items)
        {
            dtos.Add(await MapToDto(appt));
        }

        return new PagedResult<AppointmentDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageIndex = queryParams.PageIndex,
            PageSize = queryParams.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / queryParams.PageSize)
        };
    }

    public async Task<AppointmentDto> CreateAsync(AppointmentCreateDto dto, string createdBy)
    {
        var serviceItem = await _serviceItemRepository.GetByIdAsync(dto.ServiceItemId);
        if (serviceItem == null)
            throw new Exception($"服务项目不存在，无法预约。请检查服务项目ID是否正确");

        if (serviceItem.Status != ServiceStatus.Active)
            throw new Exception($"该服务项目当前不可用，请选择其他服务或联系管理员");

        var counselor = await _counselorRepository.GetByIdAsync(dto.CounselorId);
        if (counselor == null)
            throw new Exception($"咨询师不存在，请选择其他咨询师");

        var client = await _userRepository.GetByIdAsync(dto.ClientId);
        if (client == null)
            throw new Exception($"来访者信息不存在，请先注册或检查客户ID");

        if (client.Role != UserRole.Client)
            throw new Exception($"该用户不是来访者身份，不能预约咨询服务");

        var endTime = dto.StartTime.Add(TimeSpan.FromMinutes(serviceItem.DurationMinutes));

        if (await _storeClosureService.IsStoreClosedAsync(dto.AppointmentDate, dto.StartTime))
            throw new Exception($"所选时段店铺已关闭，请选择其他时间。您可以查看临时关店通知了解详情");

        if (!await IsTimeSlotAvailableAsync(dto.CounselorId, dto.AppointmentDate, dto.StartTime, endTime))
            throw new Exception($"该时段已被预约，请选择其他时间。您也可以加入候补队列等待空位");

        if (dto.AppointmentDate.Date < DateTime.Today)
            throw new Exception($"不能预约过去的日期，请选择今天或之后的日期");

        if (dto.AppointmentDate.Date == DateTime.Today && dto.StartTime <= DateTime.Now.TimeOfDay)
            throw new Exception($"不能预约今天已过的时间点，请选择稍后的时间或改约其他日期");

        var appointment = new Appointment
        {
            AppointmentNo = GenerateAppointmentNo(),
            ClientId = dto.ClientId,
            CounselorId = dto.CounselorId,
            ServiceItemId = dto.ServiceItemId,
            AppointmentDate = dto.AppointmentDate.Date,
            StartTime = dto.StartTime,
            EndTime = endTime,
            Reason = dto.Reason,
            Status = AppointmentStatus.Confirmed,
            Price = serviceItem.Price,
            CreatedBy = createdBy
        };

        var created = await _appointmentRepository.AddAsync(appointment);

        var reminderTime = dto.AppointmentDate.Date.AddDays(-1).AddHours(10);
        if (reminderTime > DateTime.UtcNow)
        {
            await _reminderService.CreateReminderAsync(
                dto.ClientId,
                created.Id,
                ReminderType.AppointmentReminder,
                "明天有心理咨询预约",
                $"您好，您明天 {dto.StartTime:hh\\:mm} 有一个{serviceItem.Name}预约，请准时到店。如有变动请提前取消。",
                reminderTime);
        }

        var cacheKey = $"appointments:counselor:{dto.CounselorId}:{dto.AppointmentDate:yyyyMMdd}";
        await _cache.RemoveAsync(cacheKey);

        var result = await MapToDto(created);
        return result;
    }

    public async Task UpdateAsync(int id, AppointmentUpdateDto dto, string updatedBy)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id);
        if (appointment == null)
            throw new Exception($"预约记录不存在，无法修改。请检查预约ID是否正确");

        if (appointment.Status == AppointmentStatus.CheckedIn || appointment.Status == AppointmentStatus.Completed)
            throw new Exception($"该预约已到店或已完成，不能修改。如需调整请联系前台工作人员");

        if (appointment.Status == AppointmentStatus.NoShow)
            throw new Exception($"该预约已标记为爽约，不能修改。如有疑问请联系前台工作人员");

        var serviceItem = await _serviceItemRepository.GetByIdAsync(appointment.ServiceItemId);
        var duration = serviceItem?.DurationMinutes ?? 60;

        var newDate = dto.AppointmentDate ?? appointment.AppointmentDate;
        var newStartTime = dto.StartTime ?? appointment.StartTime;
        var newCounselorId = dto.CounselorId ?? appointment.CounselorId;
        var newEndTime = newStartTime.Add(TimeSpan.FromMinutes(duration));

        if (dto.AppointmentDate.HasValue || dto.StartTime.HasValue || dto.CounselorId.HasValue)
        {
            if (!await IsTimeSlotAvailableAsync(newCounselorId, newDate, newStartTime, newEndTime, id))
                throw new Exception($"新选择的时段已被占用，请选择其他时间或咨询师");

            if (await _storeClosureService.IsStoreClosedAsync(newDate, newStartTime))
                throw new Exception($"新选择的时段店铺已关闭，请选择其他时间");

            appointment.AppointmentDate = newDate.Date;
            appointment.StartTime = newStartTime;
            appointment.EndTime = newEndTime;
            appointment.CounselorId = newCounselorId;
        }

        if (!string.IsNullOrWhiteSpace(dto.Reason))
            appointment.Reason = dto.Reason;
        if (dto.Notes != null)
            appointment.Notes = dto.Notes;
        if (dto.Status.HasValue)
            appointment.Status = dto.Status.Value;

        appointment.UpdatedBy = updatedBy;
        await _appointmentRepository.UpdateAsync(appointment);
        await _cache.RemoveAsync($"appointment:{id}");
    }

    public async Task CancelAsync(int id, string cancelledBy, string? reason = null)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id);
        if (appointment == null)
            throw new Exception($"预约记录不存在，无法取消。请检查预约ID是否正确");

        if (appointment.Status == AppointmentStatus.CheckedIn || appointment.Status == AppointmentStatus.Completed)
            throw new Exception($"该预约已到店或已完成，不能取消。如需退款请走退款流程");

        if (appointment.Status == AppointmentStatus.Cancelled)
            throw new Exception($"该预约已经取消，无需重复操作");

        appointment.Status = AppointmentStatus.Cancelled;
        if (!string.IsNullOrWhiteSpace(reason))
            appointment.Notes = reason;
        appointment.UpdatedBy = cancelledBy;

        await _appointmentRepository.UpdateAsync(appointment);
        await _cache.RemoveAsync($"appointment:{id}");
    }

    public async Task<bool> IsTimeSlotAvailableAsync(int counselorId, DateTime date, TimeSpan startTime, TimeSpan endTime, int? excludeAppointmentId = null)
    {
        var appointments = await _appointmentRepository.GetByCounselorIdAsync(counselorId, date);
        return !appointments.Any(a =>
            a.Id != excludeAppointmentId &&
            a.Status != AppointmentStatus.Cancelled &&
            a.Status != AppointmentStatus.NoShow &&
            ((a.StartTime <= startTime && a.EndTime > startTime) ||
             (a.StartTime < endTime && a.EndTime >= endTime) ||
             (a.StartTime >= startTime && a.EndTime <= endTime)));
    }

    public string GenerateAppointmentNo()
    {
        return $"APT{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    private async Task<AppointmentDto> MapToDto(Appointment appointment)
    {
        var client = appointment.Client ?? await _userRepository.GetByIdAsync(appointment.ClientId);
        var counselor = appointment.Counselor ?? await _counselorRepository.GetByIdAsync(appointment.CounselorId);
        var counselorUser = counselor?.User ?? (counselor != null ? await _userRepository.GetByIdAsync(counselor.UserId) : null);
        var serviceItem = appointment.ServiceItem ?? await _serviceItemRepository.GetByIdAsync(appointment.ServiceItemId);

        return new AppointmentDto
        {
            Id = appointment.Id,
            AppointmentNo = appointment.AppointmentNo,
            ClientId = appointment.ClientId,
            ClientName = client?.FullName ?? "未知",
            ClientPhone = client?.Phone ?? "",
            CounselorId = appointment.CounselorId,
            CounselorName = counselorUser?.FullName ?? "未知",
            ServiceItemId = appointment.ServiceItemId,
            ServiceItemName = serviceItem?.Name ?? "未知",
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Reason = appointment.Reason,
            Status = appointment.Status,
            Notes = appointment.Notes,
            Price = appointment.Price,
            IsFromWaitlist = appointment.IsFromWaitlist,
            CreatedAt = appointment.CreatedAt,
            CheckInRecord = appointment.CheckInRecord != null ? MapCheckInToDto(appointment.CheckInRecord) : null,
            RefundRecord = appointment.RefundRecord != null ? null : null,
            NoShowRecord = appointment.NoShowRecord != null ? MapNoShowToDto(appointment.NoShowRecord) : null
        };
    }

    private static CheckInRecordDto MapCheckInToDto(CheckInRecord record) => new()
    {
        Id = record.Id,
        AppointmentId = record.AppointmentId,
        CheckInTime = record.CheckInTime,
        CheckInMethod = record.CheckInMethod,
        CheckedInBy = record.CheckedInBy,
        IsConfirmed = record.IsConfirmed,
        ConfirmedAt = record.ConfirmedAt,
        ConfirmedBy = record.ConfirmedBy,
        Remarks = record.Remarks
    };

    private static NoShowRecordDto MapNoShowToDto(NoShowRecord record) => new()
    {
        Id = record.Id,
        AppointmentId = record.AppointmentId,
        RecordedAt = record.RecordedAt,
        RecordedBy = record.RecordedBy,
        Reason = record.Reason,
        IsWaived = record.IsWaived,
        WaivedReason = record.WaivedReason,
        WaivedBy = record.WaivedBy
    };
}
