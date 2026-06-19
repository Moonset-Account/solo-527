using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Appointment;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Entities;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using OfficeOpenXml;

namespace CoworkingBooking.Infrastructure.Services;

public class AppointmentService : IAppointmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IOperationLogService _logService;
    private readonly CurrentUserService _currentUser;

    public AppointmentService(ApplicationDbContext context, IOperationLogService logService, CurrentUserService currentUser)
    {
        _context = context;
        _logService = logService;
        _currentUser = currentUser;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<ApiResponse<PagedResult<AppointmentDto>>> GetListAsync(AppointmentQuery query)
    {
        var queryable = _context.ViewingAppointments
            .Include(a => a.Space)
            .Include(a => a.Consultant)
            .Include(a => a.FollowUpRecords)
            .Include(a => a.NoShowRecord)
            .AsQueryable();

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(a => a.CustomerName.Contains(query.Keyword!) || a.CustomerPhone.Contains(query.Keyword!) || a.AppointmentNo.Contains(query.Keyword!));

        if (query.Status.HasValue)
            queryable = queryable.Where(a => a.Status == query.Status.Value);

        if (query.SpaceId.HasValue)
            queryable = queryable.Where(a => a.SpaceId == query.SpaceId.Value);

        if (query.ConsultantId.HasValue)
            queryable = queryable.Where(a => a.ConsultantId == query.ConsultantId.Value);

        if (query.StartDate.HasValue)
            queryable = queryable.Where(a => a.ViewingDate >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(a => a.ViewingDate <= query.EndDate.Value);

        var totalCount = await queryable.CountAsync();

        queryable = queryable.OrderByDescending(a => a.CreatedAt);

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(a => MapToDto(a))
            .ToListAsync();

        return ApiResponse<PagedResult<AppointmentDto>>.Ok(new PagedResult<AppointmentDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<AppointmentDto>> GetByIdAsync(Guid id)
    {
        var appointment = await _context.ViewingAppointments
            .Include(a => a.Space)
            .Include(a => a.Consultant)
            .Include(a => a.FollowUpRecords.OrderByDescending(f => f.FollowUpTime))
            .Include(a => a.NoShowRecord)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment == null)
            return ApiResponse<AppointmentDto>.Fail("预约不存在", 404);

        return ApiResponse<AppointmentDto>.Ok(MapToDto(appointment));
    }

    public async Task<ApiResponse<AppointmentDto>> CreateAsync(CreateAppointmentRequest request, Guid? operatorId)
    {
        var space = await _context.CoworkingSpaces.FindAsync(request.SpaceId);
        if (space == null)
            return ApiResponse<AppointmentDto>.Fail("房源不存在", 404);

        if (space.Status != SpaceStatus.Available && space.Status != SpaceStatus.Reserved)
            return ApiResponse<AppointmentDto>.Fail("该房源当前不可预约");

        var conflict = await _context.ViewingAppointments.AnyAsync(a =>
            a.SpaceId == request.SpaceId &&
            a.ViewingDate.Date == request.ViewingDate.Date &&
            a.Status != AppointmentStatus.Cancelled &&
            a.Status != AppointmentStatus.NoShow &&
            ((a.StartTime < request.EndTime && a.EndTime > request.StartTime)));

        if (conflict)
            return ApiResponse<AppointmentDto>.Fail("该时段已有预约，请选择其他时间");

        var appointmentNo = $"VA{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(100, 999)}";

        var appointment = new ViewingAppointment
        {
            Id = Guid.NewGuid(),
            AppointmentNo = appointmentNo,
            SpaceId = request.SpaceId,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            CustomerEmail = request.CustomerEmail,
            CustomerCompany = request.CustomerCompany,
            ViewingDate = request.ViewingDate,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = AppointmentStatus.Pending,
            Remarks = request.Remarks,
            SourceChannel = request.SourceChannel,
            PersonCount = request.PersonCount,
            Requirements = request.Requirements,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = operatorId
        };

        _context.ViewingAppointments.Add(appointment);
        await _context.SaveChangesAsync();
        await _logService.LogAsync("看房预约", "创建预约", "Appointment", appointment.Id, appointmentNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse<AppointmentDto>.Ok(MapToDto(await LoadFullAppointment(appointment.Id)), "预约创建成功");
    }

    public async Task<ApiResponse> AssignConsultantAsync(Guid id, AssignConsultantRequest request, Guid? operatorId)
    {
        var appointment = await _context.ViewingAppointments.FindAsync(id);
        if (appointment == null)
            return ApiResponse.Fail("预约不存在", 404);

        var consultant = await _context.Users.FindAsync(request.ConsultantId);
        if (consultant == null)
            return ApiResponse.Fail("顾问不存在", 404);

        if (consultant.Role != UserRole.Consultant && consultant.Role != UserRole.ConsultantManager)
            return ApiResponse.Fail("该用户不是顾问角色");

        var before = new { appointment.ConsultantId, appointment.ConsultantName };
        appointment.ConsultantId = request.ConsultantId;
        appointment.ConsultantName = consultant.RealName;
        appointment.Status = AppointmentStatus.Confirmed;
        appointment.UpdatedAt = DateTime.UtcNow;
        appointment.UpdatedBy = operatorId;

        await _context.SaveChangesAsync();
        await _logService.LogAsync("看房预约", "分配顾问", "Appointment", appointment.Id, appointment.AppointmentNo, JsonSerializer.Serialize(before), JsonSerializer.Serialize(request));

        return ApiResponse.Ok("顾问分配成功");
    }

    public async Task<ApiResponse> UpdateStatusAsync(Guid id, UpdateAppointmentStatusRequest request, Guid? operatorId)
    {
        var appointment = await _context.ViewingAppointments.FindAsync(id);
        if (appointment == null)
            return ApiResponse.Fail("预约不存在", 404);

        var beforeStatus = appointment.Status;
        appointment.Status = request.Status;
        if (!string.IsNullOrEmpty(request.Remarks))
            appointment.Remarks = request.Remarks;
        appointment.UpdatedAt = DateTime.UtcNow;
        appointment.UpdatedBy = operatorId;

        if (request.Status == AppointmentStatus.NoShow && appointment.NoShowRecord == null)
        {
            var noShow = new NoShowRecord
            {
                Id = Guid.NewGuid(),
                AppointmentId = id,
                AppointmentNo = appointment.AppointmentNo,
                CustomerName = appointment.CustomerName,
                CustomerPhone = appointment.CustomerPhone,
                NoShowDate = DateTime.UtcNow,
                Reason = request.Remarks,
                HandleResult = NoShowHandleResult.Pending,
                IsHandled = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.NoShowRecords.Add(noShow);
        }

        await _context.SaveChangesAsync();
        await _logService.LogAsync("看房预约", "更新状态", "Appointment", id, appointment.AppointmentNo, beforeStatus.ToString(), request.Status.ToString());

        return ApiResponse.Ok("状态更新成功");
    }

    public async Task<ApiResponse> AddFollowUpAsync(Guid id, AddFollowUpRequest request, Guid operatorId)
    {
        var appointment = await _context.ViewingAppointments.FindAsync(id);
        if (appointment == null)
            return ApiResponse.Fail("预约不存在", 404);

        var user = await _context.Users.FindAsync(operatorId);
        var consultantName = user?.RealName ?? "Unknown";

        var followUp = new FollowUpRecord
        {
            Id = Guid.NewGuid(),
            AppointmentId = id,
            ConsultantId = operatorId,
            ConsultantName = consultantName,
            FollowUpType = request.FollowUpType,
            Content = request.Content,
            FollowUpTime = DateTime.UtcNow,
            NextFollowUpTime = request.NextFollowUpTime,
            NextStep = request.NextStep,
            CustomerSatisfaction = request.CustomerSatisfaction,
            CreatedAt = DateTime.UtcNow
        };

        _context.FollowUpRecords.Add(followUp);
        appointment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _logService.LogAsync("看房预约", "添加跟进", "Appointment", id, appointment.AppointmentNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse.Ok("跟进记录添加成功");
    }

    public async Task<ApiResponse> MarkAsNoShowAsync(Guid id, string? reason, Guid? operatorId)
    {
        var appointment = await _context.ViewingAppointments.FindAsync(id);
        if (appointment == null)
            return ApiResponse.Fail("预约不存在", 404);

        appointment.Status = AppointmentStatus.NoShow;
        appointment.UpdatedAt = DateTime.UtcNow;
        appointment.UpdatedBy = operatorId;

        var noShow = new NoShowRecord
        {
            Id = Guid.NewGuid(),
            AppointmentId = id,
            AppointmentNo = appointment.AppointmentNo,
            CustomerName = appointment.CustomerName,
            CustomerPhone = appointment.CustomerPhone,
            NoShowDate = DateTime.UtcNow,
            Reason = reason,
            HandleResult = NoShowHandleResult.Pending,
            IsHandled = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.NoShowRecords.Add(noShow);
        await _context.SaveChangesAsync();
        await _logService.LogAsync("爽约管理", "标记爽约", "NoShow", noShow.Id, appointment.AppointmentNo, afterData: reason);

        return ApiResponse.Ok("已标记为爽约");
    }

    public async Task<ApiResponse<PagedResult<NoShowRecordDto>>> GetNoShowListAsync(NoShowQuery query)
    {
        var queryable = _context.NoShowRecords.AsQueryable();

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(n => n.CustomerName.Contains(query.Keyword!) || n.CustomerPhone.Contains(query.Keyword!) || n.AppointmentNo.Contains(query.Keyword!));

        if (query.IsHandled.HasValue)
            queryable = queryable.Where(n => n.IsHandled == query.IsHandled.Value);

        if (query.HandleResult.HasValue)
            queryable = queryable.Where(n => n.HandleResult == query.HandleResult.Value);

        if (query.StartDate.HasValue)
            queryable = queryable.Where(n => n.NoShowDate >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(n => n.NoShowDate <= query.EndDate.Value);

        var totalCount = await queryable.CountAsync();
        queryable = queryable.OrderByDescending(n => n.CreatedAt);

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(n => new NoShowRecordDto
            {
                Id = n.Id,
                AppointmentId = n.AppointmentId,
                AppointmentNo = n.AppointmentNo,
                CustomerName = n.CustomerName,
                CustomerPhone = n.CustomerPhone,
                NoShowDate = n.NoShowDate,
                Reason = n.Reason,
                HandleResult = n.HandleResult,
                HandleDetail = n.HandleDetail,
                HandlerId = n.HandlerId,
                HandlerName = n.HandlerName,
                HandledAt = n.HandledAt,
                IsHandled = n.IsHandled,
                PenaltyDetail = n.PenaltyDetail,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return ApiResponse<PagedResult<NoShowRecordDto>>.Ok(new PagedResult<NoShowRecordDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<NoShowRecordDto>> GetNoShowByIdAsync(Guid id)
    {
        var record = await _context.NoShowRecords.FirstOrDefaultAsync(n => n.Id == id);
        if (record == null)
            return ApiResponse<NoShowRecordDto>.Fail("爽约记录不存在", 404);

        return ApiResponse<NoShowRecordDto>.Ok(new NoShowRecordDto
        {
            Id = record.Id,
            AppointmentId = record.AppointmentId,
            AppointmentNo = record.AppointmentNo,
            CustomerName = record.CustomerName,
            CustomerPhone = record.CustomerPhone,
            NoShowDate = record.NoShowDate,
            Reason = record.Reason,
            HandleResult = record.HandleResult,
            HandleDetail = record.HandleDetail,
            HandlerId = record.HandlerId,
            HandlerName = record.HandlerName,
            HandledAt = record.HandledAt,
            IsHandled = record.IsHandled,
            PenaltyDetail = record.PenaltyDetail,
            CreatedAt = record.CreatedAt
        });
    }

    public async Task<ApiResponse> HandleNoShowAsync(Guid noShowId, HandleNoShowRequest request, Guid handlerId)
    {
        var record = await _context.NoShowRecords.FindAsync(noShowId);
        if (record == null)
            return ApiResponse.Fail("爽约记录不存在", 404);

        if (record.IsHandled)
            return ApiResponse.Fail("该爽约记录已处理");

        var user = await _context.Users.FindAsync(handlerId);
        if (user == null || (user.Role != UserRole.LandlordManager && user.Role != UserRole.SuperAdmin))
            return ApiResponse.Fail("只有房东托管经理或管理员可以处理爽约", 403);

        record.Reason = request.Reason;
        record.HandleResult = request.HandleResult;
        record.HandleDetail = request.HandleDetail;
        record.PenaltyDetail = request.PenaltyDetail;
        record.IsHandled = true;
        record.HandlerId = handlerId;
        record.HandlerName = user.RealName;
        record.HandledAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _logService.LogAsync("爽约管理", "处理爽约", "NoShow", noShowId, record.AppointmentNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse.Ok("爽约处理完成");
    }

    public async Task<ApiResponse<byte[]>> ExportAppointmentsAsync(AppointmentQuery query)
    {
        query.PageSize = 10000;
        var result = await GetListAsync(query);

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("看房预约");

        worksheet.Cells[1, 1].Value = "预约编号";
        worksheet.Cells[1, 2].Value = "客户姓名";
        worksheet.Cells[1, 3].Value = "联系电话";
        worksheet.Cells[1, 4].Value = "房源";
        worksheet.Cells[1, 5].Value = "看房日期";
        worksheet.Cells[1, 6].Value = "时间段";
        worksheet.Cells[1, 7].Value = "状态";
        worksheet.Cells[1, 8].Value = "跟进顾问";
        worksheet.Cells[1, 9].Value = "创建时间";

        var statusMap = new Dictionary<AppointmentStatus, string>
        {
            { AppointmentStatus.Pending, "待确认" },
            { AppointmentStatus.Confirmed, "已确认" },
            { AppointmentStatus.Completed, "已完成" },
            { AppointmentStatus.Cancelled, "已取消" },
            { AppointmentStatus.NoShow, "爽约" }
        };

        for (int i = 0; i < result.Data!.Items.Count; i++)
        {
            var item = result.Data.Items[i];
            worksheet.Cells[i + 2, 1].Value = item.AppointmentNo;
            worksheet.Cells[i + 2, 2].Value = item.CustomerName;
            worksheet.Cells[i + 2, 3].Value = item.CustomerPhone;
            worksheet.Cells[i + 2, 4].Value = item.SpaceName;
            worksheet.Cells[i + 2, 5].Value = item.ViewingDate.ToString("yyyy-MM-dd");
            worksheet.Cells[i + 2, 6].Value = $"{item.StartTime:hh\\:mm}-{item.EndTime:hh\\:mm}";
            worksheet.Cells[i + 2, 7].Value = statusMap.GetValueOrDefault(item.Status, item.Status.ToString());
            worksheet.Cells[i + 2, 8].Value = item.ConsultantName ?? "";
            worksheet.Cells[i + 2, 9].Value = item.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
        var bytes = await package.GetAsByteArrayAsync();
        return ApiResponse<byte[]>.Ok(bytes);
    }

    private async Task<ViewingAppointment> LoadFullAppointment(Guid id)
    {
        return await _context.ViewingAppointments
            .Include(a => a.Space)
            .Include(a => a.Consultant)
            .Include(a => a.FollowUpRecords)
            .Include(a => a.NoShowRecord)
            .FirstAsync(a => a.Id == id);
    }

    private static AppointmentDto MapToDto(ViewingAppointment a)
    {
        return new AppointmentDto
        {
            Id = a.Id,
            AppointmentNo = a.AppointmentNo,
            SpaceId = a.SpaceId,
            SpaceName = a.Space?.Name ?? "",
            CustomerName = a.CustomerName,
            CustomerPhone = a.CustomerPhone,
            CustomerEmail = a.CustomerEmail,
            CustomerCompany = a.CustomerCompany,
            ViewingDate = a.ViewingDate,
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            Status = a.Status,
            ConsultantId = a.ConsultantId,
            ConsultantName = a.ConsultantName,
            Remarks = a.Remarks,
            SourceChannel = a.SourceChannel,
            PersonCount = a.PersonCount,
            Requirements = a.Requirements,
            HasNoShow = a.NoShowRecord != null,
            CreatedAt = a.CreatedAt,
            FollowUps = a.FollowUpRecords.Select(f => new FollowUpDto
            {
                Id = f.Id,
                ConsultantId = f.ConsultantId,
                ConsultantName = f.ConsultantName,
                FollowUpType = f.FollowUpType,
                Content = f.Content,
                FollowUpTime = f.FollowUpTime,
                NextFollowUpTime = f.NextFollowUpTime,
                NextStep = f.NextStep,
                CustomerSatisfaction = f.CustomerSatisfaction
            }).ToList()
        };
    }
}
