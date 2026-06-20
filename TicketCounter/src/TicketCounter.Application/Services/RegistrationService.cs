
using AutoMapper;
using TicketCounter.Application.DTOs;
using TicketCounter.Application.Interfaces;
using TicketCounter.Domain.Enums;
using E = TicketCounter.Domain.Entities;
using System.Linq.Expressions;

namespace TicketCounter.Application.Services;

public interface IRegistrationService
{
    Task<PagedResult<RegistrationDto>> QueryAsync(RegistrationQueryDto query);
    Task<RegistrationDto?> GetByIdAsync(Guid id);
    Task<RegistrationDto> SubmitAsync(CreateRegistrationDto dto, string? operatorName = null);
    Task ReviewAsync(Guid id, ReviewRegistrationDto dto, string operatorName);
    Task CancelAsync(Guid id, string operatorName, string comment);
    Task<IEnumerable<RegistrationAuditDto>> GetAuditTrailAsync(Guid registrationId);
    (int score, string missing) CalculateDataQuality(E.Registration reg);
}

public class RegistrationService : IRegistrationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOperationLogService _logService;
    private readonly ITodoService _todoService;
    private readonly ITicketStockService _stockService;

    public RegistrationService(IUnitOfWork unitOfWork, IMapper mapper, IOperationLogService logService,
        ITodoService todoService, ITicketStockService stockService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logService = logService;
        _todoService = todoService;
        _stockService = stockService;
    }

    public (int score, string missing) CalculateDataQuality(E.Registration reg)
    {
        int score = 100;
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(reg.Name)) { score -= 20; missing.Add("姓名"); }
        if (string.IsNullOrWhiteSpace(reg.Phone)) { score -= 20; missing.Add("手机号"); }
        if (string.IsNullOrWhiteSpace(reg.Company)) { score -= 10; missing.Add("公司"); }
        if (string.IsNullOrWhiteSpace(reg.Position)) { score -= 10; missing.Add("职位"); }
        if (string.IsNullOrWhiteSpace(reg.Email)) { score -= 10; missing.Add("邮箱"); }
        if (!reg.SessionId.HasValue) { score -= 10; missing.Add("场次"); }
        if (!reg.TicketType.HasValue) { score -= 10; missing.Add("票种"); }
        if (string.IsNullOrWhiteSpace(reg.IdCard)) { score -= 10; missing.Add("身份证"); }
        if (score < 0) score = 0;
        return (score, string.Join(",", missing));
    }

    private string GenerateRegistrationNo()
    {
        return $"TK{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    public async Task<PagedResult<RegistrationDto>> QueryAsync(RegistrationQueryDto query)
    {
        Expression<Func<E.Registration, bool>> predicate = r => true;
        if (query.Status.HasValue)
            predicate = predicate.AndAlso(r => r.Status == query.Status.Value);
        if (query.SessionId.HasValue)
            predicate = predicate.AndAlso(r => r.SessionId == query.SessionId.Value);
        if (query.TicketType.HasValue)
            predicate = predicate.AndAlso(r => r.TicketType == query.TicketType.Value);
        if (query.GroupNumber.HasValue)
            predicate = predicate.AndAlso(r => r.GroupNumber == query.GroupNumber.Value);
        if (query.Source.HasValue)
            predicate = predicate.AndAlso(r => r.Source == query.Source.Value);
        if (query.HasMissingData.HasValue)
            predicate = predicate.AndAlso(r => r.HasMissingData == query.HasMissingData.Value);
        if (query.StartDate.HasValue)
            predicate = predicate.AndAlso(r => r.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            predicate = predicate.AndAlso(r => r.CreatedAt <= query.EndDate.Value);
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var kw = query.Keyword.Trim();
            predicate = predicate.AndAlso(r =>
                r.Name.Contains(kw) || r.Phone!.Contains(kw) || r.Company!.Contains(kw) ||
                r.RegistrationNo.Contains(kw) || r.Email!.Contains(kw));
        }

        var totalCount = await _unitOfWork.Registrations.CountAsync(predicate);
        var items = await _unitOfWork.Registrations.GetPagedAsync(query.PageNumber, query.PageSize, predicate, r => r.CreatedAt, false);

        var dtos = new List<RegistrationDto>();
        foreach (var r in items)
        {
            var dto = _mapper.Map<RegistrationDto>(r);
            if (r.SessionId.HasValue)
            {
                var s = await _unitOfWork.Sessions.GetByIdAsync(r.SessionId.Value);
                dto.SessionName = s?.Name;
            }
            dtos.Add(dto);
        }
        return new PagedResult<RegistrationDto>
        {
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            Items = dtos
        };
    }

    public async Task<RegistrationDto?> GetByIdAsync(Guid id)
    {
        var reg = await _unitOfWork.Registrations.GetByIdAsync(id);
        if (reg == null) return null;
        var dto = _mapper.Map<RegistrationDto>(reg);
        if (reg.SessionId.HasValue)
        {
            var s = await _unitOfWork.Sessions.GetByIdAsync(reg.SessionId.Value);
            dto.SessionName = s?.Name;
        }
        return dto;
    }

    public async Task<RegistrationDto> SubmitAsync(CreateRegistrationDto dto, string? operatorName = null)
    {
        var reg = _mapper.Map<E.Registration>(dto);
        reg.Id = Guid.NewGuid();
        reg.RegistrationNo = GenerateRegistrationNo();
        reg.Status = RegistrationStatus.Pending;
        reg.Source = dto.Source ?? RegistrationSource.Online;
        reg.CreatedAt = DateTime.Now;
        reg.CreatedBy = operatorName;
        var (score, missing) = CalculateDataQuality(reg);
        reg.DataQualityScore = score;
        reg.MissingFields = missing;

        await _unitOfWork.Registrations.AddAsync(reg);
        await _unitOfWork.SaveChangesAsync();

        if (reg.HasMissingData)
        {
            await _todoService.CreateTodoFromRegistrationAsync(reg, operatorName ?? "system");
        }

        await _stockService.RefreshInventoryOccupancyAsync(reg.SessionId);

        await _logService.LogAsync(AuditAction.Create, "Registration", reg.Id.ToString(), $"{reg.Name}-{reg.RegistrationNo}", operatorName ?? "online", null, null);

        return _mapper.Map<RegistrationDto>(reg);
    }

    public async Task ReviewAsync(Guid id, ReviewRegistrationDto dto, string operatorName)
    {
        var reg = await _unitOfWork.Registrations.GetByIdAsync(id);
        if (reg == null) throw new KeyNotFoundException($"报名不存在: {id}");

        var originalStatus = reg.Status;
        var original = Newtonsoft.Json.JsonConvert.SerializeObject(reg);

        if (dto.SessionId.HasValue) reg.SessionId = dto.SessionId.Value;
        if (dto.TicketType.HasValue) reg.TicketType = dto.TicketType.Value;
        if (dto.GroupNumber.HasValue) reg.GroupNumber = dto.GroupNumber.Value;
        reg.Status = dto.Status;
        reg.Reviewer = operatorName;
        reg.ReviewedAt = DateTime.Now;
        reg.ReviewComment = dto.Comment;
        reg.UpdatedAt = DateTime.Now;
        reg.UpdatedBy = operatorName;

        var (score, missing) = CalculateDataQuality(reg);
        reg.DataQualityScore = score;
        reg.MissingFields = missing;

        if (dto.SeatId.HasValue)
        {
            var seat = await _unitOfWork.Seats.GetByIdAsync(dto.SeatId.Value);
            if (seat != null && seat.Status == SeatStatus.Available && dto.Status == RegistrationStatus.Approved)
            {
                seat.Status = SeatStatus.Sold;
                seat.RegistrationId = reg.Id;
                seat.UpdatedAt = DateTime.Now;
                await _unitOfWork.Seats.UpdateAsync(seat);
            }
        }

        await _unitOfWork.Registrations.UpdateAsync(reg);
        await _unitOfWork.SaveChangesAsync();

        await _unitOfWork.RegistrationAudits.AddAsync(new E.RegistrationAudit
        {
            Id = Guid.NewGuid(),
            RegistrationId = reg.Id,
            FromStatus = originalStatus,
            ToStatus = dto.Status,
            Comment = dto.Comment,
            Operator = operatorName,
            OperatedAt = DateTime.Now,
            OriginalValues = original,
            NewValues = Newtonsoft.Json.JsonConvert.SerializeObject(reg)
        });
        await _unitOfWork.SaveChangesAsync();

        if (reg.Status == RegistrationStatus.Approved)
        {
            var openTodos = (await _unitOfWork.TodoItems.FindAsync(t =>
                t.RelatedId == reg.Id && t.RelatedType == "Registration" && t.Status != TodoStatus.Completed)).ToList();
            foreach (var t in openTodos)
            {
                if (!reg.HasMissingData)
                {
                    t.Status = TodoStatus.Completed;
                    t.Resolver = operatorName;
                    t.ResolvedAt = DateTime.Now;
                    t.Resolution = "审核通过时资料已补齐";
                    await _unitOfWork.TodoItems.UpdateAsync(t);
                }
            }
            await _unitOfWork.SaveChangesAsync();
        }

        await _stockService.RefreshInventoryOccupancyAsync(reg.SessionId);

        await _logService.LogAsync(dto.Status == RegistrationStatus.Approved ? AuditAction.Approve : AuditAction.Reject,
            "Registration", id.ToString(), $"{reg.Name}-{reg.RegistrationNo}", operatorName, originalStatus.ToString(), dto.Status.ToString(), "Status");
    }

    public async Task CancelAsync(Guid id, string operatorName, string comment)
    {
        var reg = await _unitOfWork.Registrations.GetByIdAsync(id);
        if (reg == null) throw new KeyNotFoundException($"报名不存在: {id}");

        var original = Newtonsoft.Json.JsonConvert.SerializeObject(reg);
        var originalStatus = reg.Status;

        var seats = (await _unitOfWork.Seats.FindAsync(s => s.RegistrationId == id)).ToList();
        foreach (var seat in seats)
        {
            seat.Status = SeatStatus.Available;
            seat.RegistrationId = null;
            seat.UpdatedAt = DateTime.Now;
            await _unitOfWork.Seats.UpdateAsync(seat);
        }

        reg.Status = RegistrationStatus.Cancelled;
        reg.Reviewer = operatorName;
        reg.ReviewedAt = DateTime.Now;
        reg.ReviewComment = comment;
        reg.UpdatedAt = DateTime.Now;
        reg.UpdatedBy = operatorName;

        await _unitOfWork.Registrations.UpdateAsync(reg);
        await _unitOfWork.SaveChangesAsync();

        await _unitOfWork.RegistrationAudits.AddAsync(new E.RegistrationAudit
        {
            Id = Guid.NewGuid(),
            RegistrationId = reg.Id,
            FromStatus = originalStatus,
            ToStatus = RegistrationStatus.Cancelled,
            Comment = comment,
            Operator = operatorName,
            OperatedAt = DateTime.Now,
            OriginalValues = original,
            NewValues = Newtonsoft.Json.JsonConvert.SerializeObject(reg)
        });
        await _unitOfWork.SaveChangesAsync();

        await _stockService.RefreshInventoryOccupancyAsync(reg.SessionId);
        await _logService.LogAsync(AuditAction.Cancel, "Registration", id.ToString(), $"{reg.Name}-{reg.RegistrationNo}", operatorName, original, null);
    }

    public async Task<IEnumerable<RegistrationAuditDto>> GetAuditTrailAsync(Guid registrationId)
    {
        var audits = await _unitOfWork.RegistrationAudits.FindAsync(a => a.RegistrationId == registrationId);
        return audits.OrderByDescending(a => a.OperatedAt).Select(a => _mapper.Map<RegistrationAuditDto>(a));
    }
}

public static class ExpressionExtensions
{
    public static Expression<Func<T, bool>> AndAlso<T>(this Expression<Func<T, bool>> first, Expression<Func<T, bool>> second)
    {
        var param = Expression.Parameter(typeof(T));
        var body = Expression.AndAlso(Expression.Invoke(first, param), Expression.Invoke(second, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}
