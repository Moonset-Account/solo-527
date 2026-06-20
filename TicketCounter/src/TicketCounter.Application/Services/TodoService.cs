
using AutoMapper;
using TicketCounter.Application.DTOs;
using TicketCounter.Application.Interfaces;
using TicketCounter.Domain.Enums;
using E = TicketCounter.Domain.Entities;
using System.Linq.Expressions;

namespace TicketCounter.Application.Services;

public interface ITodoService
{
    Task<PagedResult<TodoItemDto>> QueryAsync(int pageNumber, int pageSize, TodoStatus? status, TodoPriority? priority, string? keyword);
    Task<TodoItemDto?> GetByIdAsync(Guid id);
    Task<TodoItemDto> CreateAsync(CreateTodoItemDto dto, string operatorName);
    Task ResolveAsync(Guid id, ResolveTodoItemDto dto, string operatorName);
    Task CreateTodoFromRegistrationAsync(E.Registration reg, string operatorName);
    Task<int> GetPendingCountAsync();
}

public class TodoService : ITodoService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOperationLogService _logService;
    private readonly ITicketStockService _stockService;

    public TodoService(IUnitOfWork unitOfWork, IMapper mapper, IOperationLogService logService, ITicketStockService stockService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logService = logService;
        _stockService = stockService;
    }

    public async Task<PagedResult<TodoItemDto>> QueryAsync(int pageNumber, int pageSize, TodoStatus? status, TodoPriority? priority, string? keyword)
    {
        Expression<Func<E.TodoItem, bool>> pred = t => true;
        if (status.HasValue) pred = pred.AndAlso(t => t.Status == status.Value);
        if (priority.HasValue) pred = pred.AndAlso(t => t.Priority == priority.Value);
        if (!string.IsNullOrWhiteSpace(keyword))
            pred = pred.AndAlso(t => t.Title.Contains(keyword) || t.Description!.Contains(keyword));
        var total = await _unitOfWork.TodoItems.CountAsync(pred);
        var items = await _unitOfWork.TodoItems.GetPagedAsync(pageNumber, pageSize, pred, t => t.CreatedAt, false);
        return new PagedResult<TodoItemDto>
        {
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize,
            Items = items.Select(t => _mapper.Map<TodoItemDto>(t))
        };
    }

    public async Task<TodoItemDto?> GetByIdAsync(Guid id)
    {
        var item = await _unitOfWork.TodoItems.GetByIdAsync(id);
        return item == null ? null : _mapper.Map<TodoItemDto>(item);
    }

    public async Task<TodoItemDto> CreateAsync(CreateTodoItemDto dto, string operatorName)
    {
        var item = _mapper.Map<E.TodoItem>(dto);
        item.Id = Guid.NewGuid();
        item.Status = TodoStatus.Pending;
        item.CreatedAt = DateTime.Now;
        item.CreatedBy = operatorName;
        await _unitOfWork.TodoItems.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Create, "TodoItem", item.Id.ToString(), item.Title, operatorName, null, null);
        return _mapper.Map<TodoItemDto>(item);
    }

    public async Task ResolveAsync(Guid id, ResolveTodoItemDto dto, string operatorName)
    {
        var item = await _unitOfWork.TodoItems.GetByIdAsync(id);
        if (item == null) throw new KeyNotFoundException($"待办不存在: {id}");
        var original = Newtonsoft.Json.JsonConvert.SerializeObject(item);
        item.Status = dto.Status;
        item.Resolver = operatorName;
        item.ResolvedAt = DateTime.Now;
        item.Resolution = dto.Resolution;
        item.UpdatedAt = DateTime.Now;
        await _unitOfWork.TodoItems.UpdateAsync(item);
        await _unitOfWork.SaveChangesAsync();

        if (item.AffectsInventory && item.RelatedId.HasValue)
        {
            var reg = await _unitOfWork.Registrations.GetByIdAsync(item.RelatedId.Value);
            if (reg != null)
            {
                if (dto.Status == TodoStatus.Completed && !reg.HasMissingData)
                {
                    await _stockService.RefreshInventoryOccupancyAsync(reg.SessionId);
                }
            }
        }
        await _logService.LogAsync(AuditAction.Update, "TodoItem", id.ToString(), item.Title, operatorName, original, Newtonsoft.Json.JsonConvert.SerializeObject(item));
    }

    public async Task CreateTodoFromRegistrationAsync(E.Registration reg, string operatorName)
    {
        var (score, missing) = new RegistrationService(null!, null!, _logService, this, _stockService).CalculateDataQuality(reg);
        var existing = (await _unitOfWork.TodoItems.FindAsync(t =>
            t.RelatedId == reg.Id && t.RelatedType == "Registration" && t.Status != TodoStatus.Completed)).FirstOrDefault();
        if (existing == null)
        {
            var todo = new E.TodoItem
            {
                Id = Guid.NewGuid(),
                Title = $"报名资料待完善 - {reg.Name}",
                Description = $"报名号: {reg.RegistrationNo}\n缺失字段: {missing}",
                Priority = reg.DataQualityScore < 60 ? TodoPriority.High : TodoPriority.Medium,
                Status = TodoStatus.Pending,
                RelatedType = "Registration",
                RelatedId = reg.Id,
                MissingFields = missing,
                AffectsInventory = true,
                AssignedTo = null,
                DueDate = DateTime.Now.AddDays(3),
                CreatedAt = DateTime.Now,
                CreatedBy = operatorName
            };
            await _unitOfWork.TodoItems.AddAsync(todo);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task<int> GetPendingCountAsync()
    {
        return await _unitOfWork.TodoItems.CountAsync(t => t.Status == TodoStatus.Pending);
    }
}

public interface IOperationLogService
{
    Task LogAsync(AuditAction action, string entityType, string entityId, string entityName, string operatorName, string? originalValues, string? newValues, string? changedFields = null, bool isSuccess = true, string? errorMessage = null);
    Task<PagedResult<OperationLogDto>> QueryAsync(OperationLogQueryDto query);
    Task<IEnumerable<OperationLogDto>> GetByEntityAsync(string entityType, string entityId);
}

public class OperationLogService : IOperationLogService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public OperationLogService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task LogAsync(AuditAction action, string entityType, string entityId, string entityName, string operatorName, string? originalValues, string? newValues, string? changedFields = null, bool isSuccess = true, string? errorMessage = null)
    {
        var log = new E.OperationLog
        {
            Id = Guid.NewGuid(),
            Action = action,
            ActionName = action.ToString(),
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            Operator = operatorName ?? "system",
            OperatorRole = null,
            OperatedAt = DateTime.Now,
            IpAddress = null,
            UserAgent = null,
            OriginalValues = originalValues,
            NewValues = newValues,
            ChangedFields = changedFields,
            IsSuccess = isSuccess,
            ErrorMessage = errorMessage
        };
        await _unitOfWork.OperationLogs.AddAsync(log);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PagedResult<OperationLogDto>> QueryAsync(OperationLogQueryDto query)
    {
        Expression<Func<E.OperationLog, bool>> pred = o => true;
        if (query.Action.HasValue) pred = pred.AndAlso(o => o.Action == query.Action.Value);
        if (!string.IsNullOrWhiteSpace(query.EntityType)) pred = pred.AndAlso(o => o.EntityType == query.EntityType);
        if (!string.IsNullOrWhiteSpace(query.EntityId)) pred = pred.AndAlso(o => o.EntityId == query.EntityId);
        if (!string.IsNullOrWhiteSpace(query.Operator)) pred = pred.AndAlso(o => o.Operator == query.Operator);
        if (query.StartDate.HasValue) pred = pred.AndAlso(o => o.OperatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue) pred = pred.AndAlso(o => o.OperatedAt <= query.EndDate.Value);
        if (query.IsSuccess.HasValue) pred = pred.AndAlso(o => o.IsSuccess == query.IsSuccess.Value);

        var total = await _unitOfWork.OperationLogs.CountAsync(pred);
        var items = await _unitOfWork.OperationLogs.GetPagedAsync(query.PageNumber, query.PageSize, pred, o => o.OperatedAt, false);
        return new PagedResult<OperationLogDto>
        {
            TotalCount = total,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            Items = items.Select(o => _mapper.Map<OperationLogDto>(o))
        };
    }

    public async Task<IEnumerable<OperationLogDto>> GetByEntityAsync(string entityType, string entityId)
    {
        var items = await _unitOfWork.OperationLogs.FindAsync(o => o.EntityType == entityType && o.EntityId == entityId);
        return items.OrderByDescending(o => o.OperatedAt).Select(o => _mapper.Map<OperationLogDto>(o));
    }
}
