
using AutoMapper;
using TicketCounter.Application.DTOs;
using TicketCounter.Application.Interfaces;
using TicketCounter.Domain.Enums;
using E = TicketCounter.Domain.Entities;
using System.Linq.Expressions;

namespace TicketCounter.Application.Services;

public interface IApiRetryService
{
    Task<PagedResult<ApiRetryRecordDto>> QueryAsync(ApiRetryQueryDto query);
    Task<ApiRetryRecordDto?> GetByIdAsync(Guid id);
    Task RecordFailureAsync(string apiName, string httpMethod, string requestUrl, string? requestBody, int statusCode, string? errorMessage, string? responseBody, string? stackTrace, string? correlationId);
    Task RetryAsync(Guid id);
    Task<IEnumerable<ApiRetryRecordDto>> GetPendingRetriesAsync();
    Task<byte[]> ExportAsync(ApiRetryQueryDto query);
}

public class ApiRetryService : IApiRetryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOperationLogService _logService;
    private const int DefaultMaxRetryCount = 5;

    public ApiRetryService(IUnitOfWork unitOfWork, IMapper mapper, IOperationLogService logService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logService = logService;
    }

    public async Task<PagedResult<ApiRetryRecordDto>> QueryAsync(ApiRetryQueryDto query)
    {
        Expression<Func<E.ApiRetryRecord, bool>> pred = a => true;
        if (query.RetryStatus.HasValue) pred = pred.AndAlso(a => a.RetryStatus == query.RetryStatus.Value);
        if (!string.IsNullOrWhiteSpace(query.ApiName)) pred = pred.AndAlso(a => a.ApiName == query.ApiName);
        if (query.StartDate.HasValue) pred = pred.AndAlso(a => a.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue) pred = pred.AndAlso(a => a.CreatedAt <= query.EndDate.Value);

        var total = await _unitOfWork.ApiRetryRecords.CountAsync(pred);
        var items = await _unitOfWork.ApiRetryRecords.GetPagedAsync(query.PageNumber, query.PageSize, pred, a => a.CreatedAt, false);
        return new PagedResult<ApiRetryRecordDto>
        {
            TotalCount = total,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            Items = items.Select(a => _mapper.Map<ApiRetryRecordDto>(a))
        };
    }

    public async Task<ApiRetryRecordDto?> GetByIdAsync(Guid id)
    {
        var record = await _unitOfWork.ApiRetryRecords.GetByIdAsync(id);
        return record == null ? null : _mapper.Map<ApiRetryRecordDto>(record);
    }

    public async Task RecordFailureAsync(string apiName, string httpMethod, string requestUrl, string? requestBody, int statusCode, string? errorMessage, string? responseBody, string? stackTrace, string? correlationId)
    {
        var record = new E.ApiRetryRecord
        {
            Id = Guid.NewGuid(),
            ApiName = apiName,
            HttpMethod = httpMethod,
            RequestUrl = requestUrl,
            RequestBody = requestBody,
            StatusCode = statusCode,
            ErrorMessage = errorMessage,
            ResponseBody = responseBody,
            StackTrace = stackTrace,
            RetryStatus = ApiRetryStatus.Failed,
            RetryCount = 0,
            MaxRetryCount = DefaultMaxRetryCount,
            NextRetryAt = DateTime.Now.AddMinutes(5),
            CorrelationId = correlationId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.Now
        };
        await _unitOfWork.ApiRetryRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RetryAsync(Guid id)
    {
        var record = await _unitOfWork.ApiRetryRecords.GetByIdAsync(id);
        if (record == null) throw new KeyNotFoundException($"接口重试记录不存在: {id}");
        var original = Newtonsoft.Json.JsonConvert.SerializeObject(record);

        record.RetryCount++;
        record.LastRetriedAt = DateTime.Now;
        record.RetryStatus = ApiRetryStatus.Retrying;

        bool success = false;
        string? errorMsg = null;
        try
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
            HttpResponseMessage response;
            if (record.HttpMethod.ToUpper() == "GET")
            {
                response = await httpClient.GetAsync(record.RequestUrl);
            }
            else
            {
                var content = !string.IsNullOrEmpty(record.RequestBody)
                    ? new StringContent(record.RequestBody, System.Text.Encoding.UTF8, "application/json")
                    : null!;
                response = record.HttpMethod.ToUpper() switch
                {
                    "POST" => await httpClient.PostAsync(record.RequestUrl, content),
                    "PUT" => await httpClient.PutAsync(record.RequestUrl, content),
                    "DELETE" => await httpClient.DeleteAsync(record.RequestUrl),
                    _ => await httpClient.SendAsync(new HttpRequestMessage(new HttpMethod(record.HttpMethod), record.RequestUrl))
                };
            }
            record.StatusCode = (int)response.StatusCode;
            record.ResponseBody = await response.Content.ReadAsStringAsync();
            success = response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            errorMsg = ex.Message;
            record.ErrorMessage = ex.Message;
            record.StackTrace = ex.StackTrace;
        }

        if (success)
        {
            record.RetryStatus = ApiRetryStatus.Success;
            record.SucceededAt = DateTime.Now;
            record.NextRetryAt = null;
        }
        else
        {
            if (record.RetryCount >= record.MaxRetryCount)
            {
                record.RetryStatus = ApiRetryStatus.MaxRetriesExceeded;
                record.NextRetryAt = null;
            }
            else
            {
                record.RetryStatus = ApiRetryStatus.Failed;
                var delayMinutes = Math.Pow(2, record.RetryCount);
                record.NextRetryAt = DateTime.Now.AddMinutes(delayMinutes);
            }
        }
        await _unitOfWork.ApiRetryRecords.UpdateAsync(record);
        await _unitOfWork.SaveChangesAsync();

        await _logService.LogAsync(AuditAction.Retry, "ApiRetryRecord", id.ToString(), record.ApiName, "system", original, Newtonsoft.Json.JsonConvert.SerializeObject(record), null, success, errorMsg);
    }

    public async Task<IEnumerable<ApiRetryRecordDto>> GetPendingRetriesAsync()
    {
        var now = DateTime.Now;
        var items = await _unitOfWork.ApiRetryRecords.FindAsync(a =>
            (a.RetryStatus == ApiRetryStatus.Failed || a.RetryStatus == ApiRetryStatus.Retrying) &&
            a.NextRetryAt <= now && a.RetryCount < a.MaxRetryCount);
        return items.Select(a => _mapper.Map<ApiRetryRecordDto>(a));
    }

    public async Task<byte[]> ExportAsync(ApiRetryQueryDto query)
    {
        var result = await QueryAsync(new ApiRetryQueryDto
        {
            PageNumber = 1,
            PageSize = 10000,
            RetryStatus = query.RetryStatus,
            ApiName = query.ApiName,
            StartDate = query.StartDate,
            EndDate = query.EndDate
        });
        using var ms = new MemoryStream();
        using var sw = new StreamWriter(ms, System.Text.Encoding.UTF8);
        await sw.WriteLineAsync("ID,接口名称,方法,URL,状态码,重试状态,重试次数/最大次数,创建时间,最后重试时间,下一次重试,成功时间,关联ID,错误消息");
        foreach (var r in result.Items)
        {
            var line = string.Join(",",
                EscapeCsv(r.Id.ToString()),
                EscapeCsv(r.ApiName),
                EscapeCsv(r.HttpMethod),
                EscapeCsv(r.RequestUrl),
                r.StatusCode,
                EscapeCsv(r.RetryStatus.ToString()),
                $"{r.RetryCount}/{r.MaxRetryCount}",
                EscapeCsv(r.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")),
                EscapeCsv(r.LastRetriedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""),
                EscapeCsv(r.NextRetryAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""),
                EscapeCsv(r.SucceededAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""),
                EscapeCsv(r.CorrelationId ?? ""),
                EscapeCsv(r.ErrorMessage ?? "")
            );
            await sw.WriteLineAsync(line);
        }
        await sw.FlushAsync();
        return ms.ToArray();
    }

    private static string EscapeCsv(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var needsQuote = s.Contains(',') || s.Contains('"') || s.Contains('\n') || s.Contains('\r');
        if (!needsQuote) return s;
        return "\"" + s.Replace("\"", "\"\"") + "\"";
    }
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync();
    Task<IEnumerable<InventoryOccupancyDto>> GetInventoryOccupancyAsync(Guid? sessionId = null);
}

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITicketStockService _stockService;
    private readonly IMapper _mapper;

    public DashboardService(IUnitOfWork unitOfWork, ITicketStockService stockService, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _stockService = stockService;
        _mapper = mapper;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var totalReg = await _unitOfWork.Registrations.CountAsync();
        var pending = await _unitOfWork.Registrations.CountAsync(r => r.Status == RegistrationStatus.Pending || r.Status == RegistrationStatus.Reviewing);
        var approved = await _unitOfWork.Registrations.CountAsync(r => r.Status == RegistrationStatus.Approved || r.Status == RegistrationStatus.Completed);
        var missing = await _unitOfWork.Registrations.CountAsync(r => r.HasMissingData);
        var todo = await _unitOfWork.TodoItems.CountAsync(t => t.Status == TodoStatus.Pending);
        var sessions = await _unitOfWork.Sessions.CountAsync();
        var totalSeats = await _unitOfWork.Seats.CountAsync();
        var soldSeats = await _unitOfWork.Seats.CountAsync(s => s.Status == SeatStatus.Sold);
        var failedApi = await _unitOfWork.ApiRetryRecords.CountAsync(a => a.RetryStatus == ApiRetryStatus.Failed || a.RetryStatus == ApiRetryStatus.MaxRetriesExceeded);

        await _stockService.RefreshInventoryOccupancyAsync();
        var occupancies = await GetInventoryOccupancyAsync();

        var recentRegs = await _unitOfWork.Registrations.GetPagedAsync(1, 10, null, r => r.CreatedAt, false);
        var regDtos = new List<RegistrationDto>();
        foreach (var r in recentRegs)
        {
            var dto = _mapper.Map<RegistrationDto>(r);
            if (r.SessionId.HasValue)
            {
                var s = await _unitOfWork.Sessions.GetByIdAsync(r.SessionId.Value);
                dto.SessionName = s?.Name;
            }
            regDtos.Add(dto);
        }

        var recentTodos = await _unitOfWork.TodoItems.GetPagedAsync(1, 10, t => t.Status != TodoStatus.Completed, t => t.CreatedAt, false);

        return new DashboardStatsDto
        {
            TotalRegistrations = totalReg,
            PendingReviewCount = pending,
            ApprovedCount = approved,
            MissingDataCount = missing,
            TodoCount = todo,
            SessionsCount = sessions,
            TotalSeats = totalSeats,
            SoldSeats = soldSeats,
            FailedApiCount = failedApi,
            SeatOccupancyRate = totalSeats > 0 ? Math.Round((decimal)soldSeats / totalSeats * 100, 2) : 0,
            InventoryBySession = occupancies,
            RecentRegistrations = regDtos,
            RecentTodos = recentTodos.Select(t => _mapper.Map<TodoItemDto>(t))
        };
    }

    public async Task<IEnumerable<InventoryOccupancyDto>> GetInventoryOccupancyAsync(Guid? sessionId = null)
    {
        var list = sessionId.HasValue
            ? await _unitOfWork.InventoryOccupancies.FindAsync(i => i.SessionId == sessionId.Value)
            : await _unitOfWork.InventoryOccupancies.GetAllAsync();
        var dtos = new List<InventoryOccupancyDto>();
        foreach (var i in list)
        {
            var dto = _mapper.Map<InventoryOccupancyDto>(i);
            var session = await _unitOfWork.Sessions.GetByIdAsync(i.SessionId);
            dto.SessionName = session?.Name ?? "";
            dto.TicketTypeName = i.TicketType.ToString();
            dtos.Add(dto);
        }
        return dtos.OrderBy(d => d.SessionName).ThenBy(d => d.TicketType);
    }
}
