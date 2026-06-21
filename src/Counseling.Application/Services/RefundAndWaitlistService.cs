using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Entities;
using Counseling.Domain.Enums;
using Counseling.Domain.Interfaces;

namespace Counseling.Application.Services;

public class RefundService : IRefundService
{
    private readonly IRefundRecordRepository _refundRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IReminderService _reminderService;
    private readonly ICacheService _cache;

    public RefundService(
        IRefundRecordRepository refundRepository,
        IAppointmentRepository appointmentRepository,
        IReminderService reminderService,
        ICacheService cache)
    {
        _refundRepository = refundRepository;
        _appointmentRepository = appointmentRepository;
        _reminderService = reminderService;
        _cache = cache;
    }

    public async Task<RefundRecordDto?> GetByIdAsync(int id)
    {
        var record = await _refundRepository.GetByIdAsync(id);
        if (record == null) return null;
        return await MapToDto(record);
    }

    public async Task<RefundRecordDto?> GetByAppointmentIdAsync(int appointmentId)
    {
        var record = await _refundRepository.GetByAppointmentIdAsync(appointmentId);
        if (record == null) return null;
        return await MapToDto(record);
    }

    public async Task<List<RefundRecordDto>> GetByStatusAsync(RefundStatus status)
    {
        var records = await _refundRepository.GetByStatusAsync(status);
        var dtos = new List<RefundRecordDto>();
        foreach (var record in records)
        {
            dtos.Add(await MapToDto(record));
        }
        return dtos;
    }

    public async Task<List<RefundRecordDto>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var records = await _refundRepository.GetByDateRangeAsync(startDate, endDate);
        var dtos = new List<RefundRecordDto>();
        foreach (var record in records)
        {
            dtos.Add(await MapToDto(record));
        }
        return dtos;
    }

    public async Task<RefundRecordDto> CreateAsync(RefundCreateDto dto, string createdBy)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(dto.AppointmentId);
        if (appointment == null)
            throw new Exception("预约记录不存在，无法申请退款。请检查预约ID是否正确");

        if (appointment.Status != AppointmentStatus.Cancelled &&
            appointment.Status != AppointmentStatus.NoShow)
            throw new Exception("当前预约状态不能申请退款。只有已取消或爽约的预约才能申请退款");

        if (dto.Amount <= 0)
            throw new Exception("退款金额必须大于0，请检查金额设置");

        if (dto.Amount > appointment.Price)
            throw new Exception($"退款金额不能超过预约金额 {appointment.Price} 元，请调整退款金额");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new Exception("请填写退款原因，这对财务审核很重要");

        var existingRefund = await _refundRepository.GetByAppointmentIdAsync(dto.AppointmentId);
        if (existingRefund != null && existingRefund.Status != RefundStatus.Rejected)
            throw new Exception("该预约已有退款申请正在处理或已完成，不能重复申请");

        var refundRecord = new RefundRecord
        {
            AppointmentId = dto.AppointmentId,
            Amount = dto.Amount,
            Status = RefundStatus.Pending,
            Reason = dto.Reason,
            CreatedBy = createdBy
        };

        var created = await _refundRepository.AddAsync(refundRecord);

        await _reminderService.CreateReminderAsync(
            appointment.ClientId,
            appointment.Id,
            ReminderType.RefundStatusUpdate,
            "退款申请已提交",
            $"您的退款申请已提交，金额 {dto.Amount} 元。我们会尽快审核，请耐心等待。审核结果会及时通知您。",
            DateTime.Now);

        return await MapToDto(created);
    }

    public async Task ProcessAsync(int id, RefundProcessDto dto, string processedBy)
    {
        var record = await _refundRepository.GetByIdAsync(id);
        if (record == null)
            throw new Exception("退款记录不存在，无法处理。请检查退款记录ID是否正确");

        if (record.Status != RefundStatus.Pending)
            throw new Exception($"当前退款状态不是待处理，无法审批。当前状态：{GetStatusText(record.Status)}");

        if (dto.IsApproved)
        {
            record.Status = RefundStatus.Approved;
            record.ApprovedAt = DateTime.Now;
            record.ApprovedBy = processedBy;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(dto.Comment))
                throw new Exception("拒绝退款必须填写拒绝原因，请说明具体原因");

            record.Status = RefundStatus.Rejected;
            record.RejectedReason = dto.Comment;
            record.RejectedAt = DateTime.Now;
            record.RejectedBy = processedBy;
        }

        record.UpdatedBy = processedBy;
        await _refundRepository.UpdateAsync(record);

        var appointment = await _appointmentRepository.GetByIdAsync(record.AppointmentId);
        if (appointment != null)
        {
            var title = dto.IsApproved ? "退款申请已通过" : "退款申请被拒绝";
            var message = dto.IsApproved
                ? $"您的退款申请已通过审核，金额 {record.Amount} 元。退款将在1-3个工作日内到账。"
                : $"很抱歉，您的退款申请未通过。原因：{dto.Comment}。如有疑问请联系前台。";

            await _reminderService.CreateReminderAsync(
                appointment.ClientId,
                appointment.Id,
                ReminderType.RefundStatusUpdate,
                title,
                message,
                DateTime.Now);
        }
    }

    public async Task CompleteAsync(int id, string transactionId, string completedBy)
    {
        var record = await _refundRepository.GetByIdAsync(id);
        if (record == null)
            throw new Exception("退款记录不存在，无法完成。请检查退款记录ID是否正确");

        if (record.Status != RefundStatus.Approved)
            throw new Exception($"当前退款状态不是已通过，无法完成退款。当前状态：{GetStatusText(record.Status)}");

        if (string.IsNullOrWhiteSpace(transactionId))
            throw new Exception("请填写交易流水号，这是财务对账的重要凭证");

        record.Status = RefundStatus.Completed;
        record.CompletedAt = DateTime.Now;
        record.TransactionId = transactionId;
        record.UpdatedBy = completedBy;

        await _refundRepository.UpdateAsync(record);

        var appointment = await _appointmentRepository.GetByIdAsync(record.AppointmentId);
        if (appointment != null)
        {
            await _reminderService.CreateReminderAsync(
                appointment.ClientId,
                appointment.Id,
                ReminderType.RefundStatusUpdate,
                "退款已到账",
                $"您的退款 {record.Amount} 元已处理完成，交易流水号：{transactionId}。请注意查收。",
                DateTime.Now);
        }
    }

    private async Task<RefundRecordDto> MapToDto(RefundRecord record)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(record.AppointmentId);
        var clientName = string.Empty;
        if (appointment?.Client != null)
            clientName = appointment.Client.FullName;

        return new RefundRecordDto
        {
            Id = record.Id,
            AppointmentId = record.AppointmentId,
            AppointmentNo = appointment?.AppointmentNo ?? "",
            ClientName = clientName,
            Amount = record.Amount,
            Status = record.Status,
            Reason = record.Reason,
            ApprovedAt = record.ApprovedAt,
            ApprovedBy = record.ApprovedBy,
            RejectedReason = record.RejectedReason,
            RejectedAt = record.RejectedAt,
            RejectedBy = record.RejectedBy,
            CompletedAt = record.CompletedAt,
            TransactionId = record.TransactionId,
            CreatedAt = record.CreatedAt
        };
    }

    private static string GetStatusText(RefundStatus status) => status switch
    {
        RefundStatus.Pending => "待处理",
        RefundStatus.Approved => "已通过",
        RefundStatus.Rejected => "已拒绝",
        RefundStatus.Completed => "已完成",
        _ => "未知状态"
    };
}

public class WaitlistService : IWaitlistService
{
    private readonly IWaitlistItemRepository _waitlistRepository;
    private readonly IServiceItemRepository _serviceItemRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICounselorRepository _counselorRepository;
    private readonly IReminderService _reminderService;
    private readonly ICacheService _cache;

    public WaitlistService(
        IWaitlistItemRepository waitlistRepository,
        IServiceItemRepository serviceItemRepository,
        IUserRepository userRepository,
        ICounselorRepository counselorRepository,
        IReminderService reminderService,
        ICacheService cache)
    {
        _waitlistRepository = waitlistRepository;
        _serviceItemRepository = serviceItemRepository;
        _userRepository = userRepository;
        _counselorRepository = counselorRepository;
        _reminderService = reminderService;
        _cache = cache;
    }

    public async Task<WaitlistItemDto?> GetByIdAsync(int id)
    {
        var item = await _waitlistRepository.GetByIdAsync(id);
        if (item == null) return null;
        return await MapToDto(item);
    }

    public async Task<List<WaitlistItemDto>> GetActiveByServiceItemIdAsync(int serviceItemId)
    {
        var items = await _waitlistRepository.GetActiveByServiceItemIdAsync(serviceItemId);
        var dtos = new List<WaitlistItemDto>();
        foreach (var item in items)
        {
            dtos.Add(await MapToDto(item));
        }
        return dtos;
    }

    public async Task<List<WaitlistItemDto>> GetByClientIdAsync(int clientId)
    {
        var items = await _waitlistRepository.GetByClientIdAsync(clientId);
        var dtos = new List<WaitlistItemDto>();
        foreach (var item in items)
        {
            dtos.Add(await MapToDto(item));
        }
        return dtos;
    }

    public async Task<List<WaitlistItemDto>> GetActiveByDateAsync(DateTime date)
    {
        var items = await _waitlistRepository.GetActiveByDateAsync(date);
        var dtos = new List<WaitlistItemDto>();
        foreach (var item in items)
        {
            dtos.Add(await MapToDto(item));
        }
        return dtos;
    }

    public async Task<List<WaitlistItemDto>> GetAllActiveAsync()
    {
        var items = await _waitlistRepository.GetAllActiveAsync();
        var dtos = new List<WaitlistItemDto>();
        foreach (var item in items)
        {
            dtos.Add(await MapToDto(item));
        }
        return dtos;
    }

    public async Task<WaitlistItemDto> CreateAsync(WaitlistCreateDto dto, string createdBy)
    {
        var serviceItem = await _serviceItemRepository.GetByIdAsync(dto.ServiceItemId);
        if (serviceItem == null)
            throw new Exception("服务项目不存在，请检查服务项目ID是否正确");

        if (serviceItem.Status != ServiceStatus.Active)
            throw new Exception("该服务项目当前不可用，无法加入候补队列");

        var client = await _userRepository.GetByIdAsync(dto.ClientId);
        if (client == null)
            throw new Exception("来访者信息不存在，请先注册或检查客户ID");

        if (dto.PreferredDate.Date < DateTime.Today)
            throw new Exception("候补日期不能是过去的日期，请选择今天或之后的日期");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new Exception("请填写加入候补的原因，方便我们优先安排");

        var waitlistItem = new WaitlistItem
        {
            ClientId = dto.ClientId,
            ServiceItemId = dto.ServiceItemId,
            PreferredCounselorId = dto.PreferredCounselorId,
            PreferredDate = dto.PreferredDate.Date,
            Reason = dto.Reason,
            IsActive = true,
            Priority = dto.Priority,
            CreatedBy = createdBy
        };

        var created = await _waitlistRepository.AddAsync(waitlistItem);

        await _reminderService.CreateReminderAsync(
            dto.ClientId,
            null,
            ReminderType.WaitlistUpdate,
            "已加入候补队列",
            $"您已成功加入 {serviceItem.Name} 的候补队列，候补日期 {dto.PreferredDate:yyyy-MM-dd}。如有空位我们会第一时间通知您。",
            DateTime.Now);

        return await MapToDto(created);
    }

    public async Task MarkNotifiedAsync(int id, string notifiedBy)
    {
        var item = await _waitlistRepository.GetByIdAsync(id);
        if (item == null)
            throw new Exception("候补记录不存在，请检查记录ID是否正确");

        if (!item.IsActive)
            throw new Exception("该候补记录已失效，无法通知");

        if (item.Notified)
            throw new Exception("该候补用户已通知过，无需重复通知");

        item.Notified = true;
        item.NotifiedAt = DateTime.Now;
        item.UpdatedBy = notifiedBy;

        await _waitlistRepository.UpdateAsync(item);

        var serviceItem = await _serviceItemRepository.GetByIdAsync(item.ServiceItemId);
        await _reminderService.CreateReminderAsync(
            item.ClientId,
            null,
            ReminderType.WaitlistUpdate,
            "候补有位置啦",
            $"您好，您候补的 {serviceItem?.Name ?? "咨询服务"} 在 {item.PreferredDate:yyyy-MM-dd} 有位置了！请尽快确认是否预约，位置保留24小时。",
            DateTime.Now);
    }

    public async Task DeactivateAsync(int id, string updatedBy)
    {
        var item = await _waitlistRepository.GetByIdAsync(id);
        if (item == null)
            throw new Exception("候补记录不存在，请检查记录ID是否正确");

        if (!item.IsActive)
            throw new Exception("该候补记录已失效，无需重复操作");

        item.IsActive = false;
        item.UpdatedBy = updatedBy;

        await _waitlistRepository.UpdateAsync(item);
    }

    private async Task<WaitlistItemDto> MapToDto(WaitlistItem item)
    {
        var client = item.Client ?? await _userRepository.GetByIdAsync(item.ClientId);
        var serviceItem = item.ServiceItem ?? await _serviceItemRepository.GetByIdAsync(item.ServiceItemId);
        var counselor = item.PreferredCounselor;
        string? counselorName = null;
        if (counselor != null)
        {
            var cUser = await _userRepository.GetByIdAsync(counselor.UserId);
            counselorName = cUser?.FullName;
        }
        else if (item.PreferredCounselorId.HasValue)
        {
            var c = await _counselorRepository.GetByIdAsync(item.PreferredCounselorId.Value);
            if (c != null)
            {
                var cUser = await _userRepository.GetByIdAsync(c.UserId);
                counselorName = cUser?.FullName;
            }
        }

        return new WaitlistItemDto
        {
            Id = item.Id,
            ClientId = item.ClientId,
            ClientName = client?.FullName ?? "未知",
            ClientPhone = client?.Phone ?? "",
            ServiceItemId = item.ServiceItemId,
            ServiceItemName = serviceItem?.Name ?? "未知",
            PreferredCounselorId = item.PreferredCounselorId,
            PreferredCounselorName = counselorName,
            PreferredDate = item.PreferredDate,
            Reason = item.Reason,
            IsActive = item.IsActive,
            Priority = item.Priority,
            Notified = item.Notified,
            NotifiedAt = item.NotifiedAt,
            CreatedAt = item.CreatedAt
        };
    }
}
