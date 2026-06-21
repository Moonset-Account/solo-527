using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Entities;
using Counseling.Domain.Enums;
using Counseling.Domain.Interfaces;

namespace Counseling.Application.Services;

public class CheckInService : ICheckInService
{
    private readonly ICheckInRecordRepository _checkInRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IReminderService _reminderService;
    private readonly ICacheService _cache;

    public CheckInService(
        ICheckInRecordRepository checkInRepository,
        IAppointmentRepository appointmentRepository,
        IReminderService reminderService,
        ICacheService cache)
    {
        _checkInRepository = checkInRepository;
        _appointmentRepository = appointmentRepository;
        _reminderService = reminderService;
        _cache = cache;
    }

    public async Task<CheckInRecordDto?> GetByIdAsync(int id)
    {
        var record = await _checkInRepository.GetByIdAsync(id);
        return record != null ? MapToDto(record) : null;
    }

    public async Task<CheckInRecordDto?> GetByAppointmentIdAsync(int appointmentId)
    {
        var record = await _checkInRepository.GetByAppointmentIdAsync(appointmentId);
        return record != null ? MapToDto(record) : null;
    }

    public async Task<List<CheckInRecordDto>> GetByDateAsync(DateTime date)
    {
        var records = await _checkInRepository.GetByDateAsync(date);
        return records.Select(MapToDto).ToList();
    }

    public async Task<List<CheckInRecordDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var records = await _checkInRepository.GetByDateRangeAsync(startDate, endDate);
        return records.Select(MapToDto).ToList();
    }

    public async Task<CheckInRecordDto> CheckInAsync(CheckInCreateDto dto, string checkedInBy)
    {
        if (string.IsNullOrWhiteSpace(dto.AppointmentNo))
            throw new Exception("预约单号不能为空，请输入正确的预约单号");

        var appointment = await _appointmentRepository.GetByAppointmentNoAsync(dto.AppointmentNo.Trim());
        if (appointment == null)
            throw new Exception($"找不到预约单号 '{dto.AppointmentNo}' 对应的预约记录，请检查预约号是否正确");

        if (appointment.Status == AppointmentStatus.Cancelled)
            throw new Exception("该预约已取消，不能办理到店核销。如需服务请重新预约");

        if (appointment.Status == AppointmentStatus.NoShow)
            throw new Exception("该预约已标记为爽约，不能办理到店核销。如有疑问请联系前台");

        if (appointment.Status == AppointmentStatus.CheckedIn || appointment.Status == AppointmentStatus.Completed)
            throw new Exception("该预约已完成到店核销，无需重复操作。请前往咨询室等候");

        var now = DateTime.Now;
        var appointmentStart = appointment.AppointmentDate.Date.Add(appointment.StartTime);
        var appointmentEnd = appointment.AppointmentDate.Date.Add(appointment.EndTime);

        if (now < appointmentStart.AddMinutes(-30))
            throw new Exception($"还未到预约时间，最早可提前30分钟到店核销。当前预约时间是 {appointment.StartTime:hh\\:mm}，请稍候再试");

        if (now > appointmentEnd.AddMinutes(30))
            throw new Exception($"预约时间已过，无法办理到店核销。您的预约结束时间是 {appointment.EndTime:hh\\:mm}，如需服务请重新预约或联系前台");

        var existingRecord = await _checkInRepository.GetByAppointmentIdAsync(appointment.Id);
        if (existingRecord != null)
            throw new Exception("该预约已有核销记录，请勿重复核销");

        var checkInRecord = new CheckInRecord
        {
            AppointmentId = appointment.Id,
            CheckInTime = DateTime.Now,
            CheckInMethod = dto.CheckInMethod,
            CheckedInBy = checkedInBy,
            IsConfirmed = false,
            Remarks = dto.Remarks,
            CreatedBy = checkedInBy
        };

        var created = await _checkInRepository.AddAsync(checkInRecord);

        appointment.Status = AppointmentStatus.CheckedIn;
        appointment.UpdatedBy = checkedInBy;
        await _appointmentRepository.UpdateAsync(appointment);

        await _cache.RemoveAsync($"appointment:{appointment.Id}");

        return MapToDto(created);
    }

    public async Task ConfirmAsync(int id, CheckInConfirmDto dto, string confirmedBy)
    {
        var record = await _checkInRepository.GetByIdAsync(id);
        if (record == null)
            throw new Exception("核销记录不存在，无法确认。请检查核销记录ID是否正确");

        if (record.IsConfirmed)
            throw new Exception("该核销记录已确认，无需重复操作");

        record.IsConfirmed = dto.IsConfirmed;
        record.ConfirmedAt = DateTime.Now;
        record.ConfirmedBy = confirmedBy;
        if (!string.IsNullOrWhiteSpace(dto.Remarks))
            record.Remarks = dto.Remarks;
        record.UpdatedBy = confirmedBy;

        await _checkInRepository.UpdateAsync(record);

        if (dto.IsConfirmed)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(record.AppointmentId);
            if (appointment != null)
            {
                appointment.Status = AppointmentStatus.Completed;
                appointment.UpdatedBy = confirmedBy;
                await _appointmentRepository.UpdateAsync(appointment);
                await _cache.RemoveAsync($"appointment:{appointment.Id}");
            }
        }
    }

    private static CheckInRecordDto MapToDto(CheckInRecord record) => new()
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
}

public class NoShowService : INoShowService
{
    private readonly INoShowRecordRepository _noShowRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IReminderService _reminderService;
    private readonly ICacheService _cache;

    public NoShowService(
        INoShowRecordRepository noShowRepository,
        IAppointmentRepository appointmentRepository,
        IReminderService reminderService,
        ICacheService cache)
    {
        _noShowRepository = noShowRepository;
        _appointmentRepository = appointmentRepository;
        _reminderService = reminderService;
        _cache = cache;
    }

    public async Task<NoShowRecordDto?> GetByIdAsync(int id)
    {
        var record = await _noShowRepository.GetByIdAsync(id);
        return record != null ? MapToDto(record) : null;
    }

    public async Task<NoShowRecordDto?> GetByAppointmentIdAsync(int appointmentId)
    {
        var record = await _noShowRepository.GetByAppointmentIdAsync(appointmentId);
        return record != null ? MapToDto(record) : null;
    }

    public async Task<List<NoShowRecordDto>> GetByClientIdAsync(int clientId)
    {
        var records = await _noShowRepository.GetByClientIdAsync(clientId);
        return records.Select(MapToDto).ToList();
    }

    public async Task<List<NoShowRecordDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var records = await _noShowRepository.GetByDateRangeAsync(startDate, endDate);
        return records.Select(MapToDto).ToList();
    }

    public async Task<NoShowRecordDto> CreateAsync(NoShowCreateDto dto, string createdBy)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(dto.AppointmentId);
        if (appointment == null)
            throw new Exception("预约记录不存在，无法标记爽约。请检查预约ID是否正确");

        if (appointment.Status == AppointmentStatus.CheckedIn || appointment.Status == AppointmentStatus.Completed)
            throw new Exception("该预约已到店或已完成，不能标记为爽约。如有疑问请核实");

        if (appointment.Status == AppointmentStatus.NoShow)
            throw new Exception("该预约已标记为爽约，无需重复操作");

        if (appointment.Status == AppointmentStatus.Cancelled)
            throw new Exception("该预约已取消，不能标记为爽约");

        var now = DateTime.Now;
        var appointmentEnd = appointment.AppointmentDate.Date.Add(appointment.EndTime);
        if (now < appointmentEnd)
            throw new Exception($"预约尚未结束，不能标记为爽约。请在预约结束时间 {appointment.EndTime:hh\\:mm} 后再操作");

        var existingRecord = await _noShowRepository.GetByAppointmentIdAsync(dto.AppointmentId);
        if (existingRecord != null)
            throw new Exception("该预约已有爽约记录，请勿重复标记");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new Exception("请填写爽约原因，这对后续服务改进很重要");

        var noShowRecord = new NoShowRecord
        {
            AppointmentId = dto.AppointmentId,
            RecordedAt = DateTime.Now,
            RecordedBy = createdBy,
            Reason = dto.Reason,
            IsWaived = false,
            CreatedBy = createdBy
        };

        var created = await _noShowRepository.AddAsync(noShowRecord);

        appointment.Status = AppointmentStatus.NoShow;
        appointment.UpdatedBy = createdBy;
        await _appointmentRepository.UpdateAsync(appointment);

        await _reminderService.CreateReminderAsync(
            appointment.ClientId,
            appointment.Id,
            ReminderType.NoShowAlert,
            "预约爽约提醒",
            $"您在 {appointment.AppointmentDate:yyyy-MM-dd} {appointment.StartTime:hh\\:mm} 的{appointment.ServiceItem?.Name ?? "咨询"}预约未到店，已被标记为爽约。如有疑问请联系前台。多次爽约会影响您的预约信用。",
            DateTime.Now);

        await _cache.RemoveAsync($"appointment:{appointment.Id}");

        return MapToDto(created);
    }

    public async Task WaiveAsync(int id, NoShowWaiveDto dto, string waivedBy)
    {
        var record = await _noShowRepository.GetByIdAsync(id);
        if (record == null)
            throw new Exception("爽约记录不存在，无法豁免。请检查记录ID是否正确");

        if (record.IsWaived)
            throw new Exception("该爽约记录已豁免，无需重复操作");

        if (string.IsNullOrWhiteSpace(dto.WaivedReason))
            throw new Exception("请填写豁免原因，这对后续管理很重要");

        record.IsWaived = true;
        record.WaivedReason = dto.WaivedReason;
        record.WaivedBy = waivedBy;
        record.UpdatedBy = waivedBy;

        await _noShowRepository.UpdateAsync(record);

        var appointment = await _appointmentRepository.GetByIdAsync(record.AppointmentId);
        if (appointment != null)
        {
            appointment.Status = AppointmentStatus.Cancelled;
            appointment.UpdatedBy = waivedBy;
            await _appointmentRepository.UpdateAsync(appointment);
            await _cache.RemoveAsync($"appointment:{appointment.Id}");
        }
    }

    private static NoShowRecordDto MapToDto(NoShowRecord record) => new()
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
