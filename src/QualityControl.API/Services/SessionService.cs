using Microsoft.EntityFrameworkCore;
using QualityControl.API.Data;
using QualityControl.API.DTOs;
using QualityControl.API.Models;

namespace QualityControl.API.Services;

public interface ISessionService
{
    Task<PagedResult<SessionDTO>> GetSessionsAsync(SessionQueryDTO query);
    Task<SessionDTO?> GetSessionByIdAsync(int id);
    Task<SessionDTO> CreateSessionAsync(CreateSessionDTO dto);
    Task<SessionDTO?> AddMessageAsync(AddMessageDTO dto);
    Task<SessionStatisticsDTO> GetStatisticsAsync(int? agentId = null, int? departmentId = null);
    Task<List<SessionDTO>> GetRandomSessionsForInspectionAsync(RandomInspectionDTO dto);
    Task<byte[]> ExportSessionsAsync(ExportSessionDTO dto);
}

public class SessionService : ISessionService
{
    private readonly AppDbContext _context;

    public SessionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<SessionDTO>> GetSessionsAsync(SessionQueryDTO query)
    {
        var queryable = _context.Sessions
            .Include(s => s.Customer)
            .Include(s => s.Agent)
            .Include(s => s.Inspector)
            .Include(s => s.Rating)
            .AsQueryable();

        if (query.AgentId.HasValue)
            queryable = queryable.Where(s => s.AgentId == query.AgentId.Value);

        if (query.CustomerId.HasValue)
            queryable = queryable.Where(s => s.CustomerId == query.CustomerId.Value);

        if (query.Status.HasValue)
            queryable = queryable.Where(s => (int)s.Status == query.Status.Value);

        if (!string.IsNullOrEmpty(query.Channel))
            queryable = queryable.Where(s => s.Channel == query.Channel);

        if (query.StartTime.HasValue)
            queryable = queryable.Where(s => s.CreatedAt >= query.StartTime.Value);

        if (query.EndTime.HasValue)
            queryable = queryable.Where(s => s.CreatedAt <= query.EndTime.Value);

        if (query.IsInspected.HasValue)
            queryable = queryable.Where(s => s.IsInspected == query.IsInspected.Value);

        if (query.MinResponseTime.HasValue)
            queryable = queryable.Where(s => s.ResponseTimeSeconds >= query.MinResponseTime.Value);

        if (query.MaxResponseTime.HasValue)
            queryable = queryable.Where(s => s.ResponseTimeSeconds <= query.MaxResponseTime.Value);

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(s => s.Title.Contains(query.Keyword) || s.ProblemDescription != null && s.ProblemDescription.Contains(query.Keyword));

        if (!string.IsNullOrEmpty(query.Tag))
            queryable = queryable.Where(s => s.Tags != null && s.Tags.Contains(query.Tag));

        var totalCount = await queryable.CountAsync();

        if (!string.IsNullOrEmpty(query.SortBy))
        {
            if (query.SortDesc)
                queryable = queryable.OrderByDescending(s => EF.Property<object>(s, query.SortBy));
            else
                queryable = queryable.OrderBy(s => EF.Property<object>(s, query.SortBy));
        }
        else
        {
            queryable = queryable.OrderByDescending(s => s.CreatedAt);
        }

        var sessions = await queryable
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var items = sessions.Select(MapToDTO).ToList();

        return new PagedResult<SessionDTO>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<SessionDTO?> GetSessionByIdAsync(int id)
    {
        var session = await _context.Sessions
            .Include(s => s.Customer)
            .Include(s => s.Agent)
            .Include(s => s.Inspector)
            .Include(s => s.Messages)
            .Include(s => s.Attachments)
            .Include(s => s.Rating)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return null;

        var dto = MapToDTO(session);
        dto.MessageCount = session.Messages.Count;
        dto.AttachmentCount = session.Attachments.Count;

        return dto;
    }

    public async Task<SessionDTO> CreateSessionAsync(CreateSessionDTO dto)
    {
        var session = new Session
        {
            SessionNumber = GenerateSessionNumber(),
            CustomerId = dto.CustomerId,
            AgentId = dto.AgentId,
            Title = dto.Title,
            ProblemDescription = dto.ProblemDescription,
            Status = SessionStatus.Pending,
            Channel = dto.Channel ?? "web",
            Tags = dto.Tags,
            CreatedAt = DateTime.Now,
            IsInspected = false
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        if (!string.IsNullOrEmpty(dto.InitialMessage))
        {
            var message = new SessionMessage
            {
                SessionId = session.Id,
                SenderType = MessageSenderType.Customer,
                SenderId = dto.CustomerId,
                Content = dto.InitialMessage,
                SentAt = DateTime.Now,
                IsRead = false
            };
            _context.SessionMessages.Add(message);
            await _context.SaveChangesAsync();
        }

        return MapToDTO(session);
    }

    public async Task<SessionDTO?> AddMessageAsync(AddMessageDTO dto)
    {
        var session = await _context.Sessions.FindAsync(dto.SessionId);
        if (session == null) return null;

        var message = new SessionMessage
        {
            SessionId = dto.SessionId,
            SenderType = (MessageSenderType)dto.SenderType,
            SenderId = dto.SenderId,
            SenderName = dto.SenderName,
            Content = dto.Content,
            SentAt = DateTime.Now,
            IsRead = false
        };

        _context.SessionMessages.Add(message);

        if (session.Status == SessionStatus.Pending && dto.SenderType == (int)MessageSenderType.Agent)
        {
            session.FirstResponseAt = DateTime.Now;
            session.ResponseTimeSeconds = (DateTime.Now - session.CreatedAt).TotalSeconds;
            session.Status = SessionStatus.InProgress;
        }

        await _context.SaveChangesAsync();

        return MapToDTO(session);
    }

    public async Task<SessionStatisticsDTO> GetStatisticsAsync(int? agentId = null, int? departmentId = null)
    {
        var queryable = _context.Sessions.AsQueryable();

        if (agentId.HasValue)
            queryable = queryable.Where(s => s.AgentId == agentId.Value);

        var today = DateTime.Today;

        var stats = new SessionStatisticsDTO
        {
            TotalSessions = await queryable.CountAsync(),
            PendingSessions = await queryable.Where(s => s.Status == SessionStatus.Pending).CountAsync(),
            InProgressSessions = await queryable.Where(s => s.Status == SessionStatus.InProgress).CountAsync(),
            ResolvedSessions = await queryable.Where(s => s.Status == SessionStatus.Resolved || s.Status == SessionStatus.Closed).CountAsync(),
            InspectedSessions = await queryable.Where(s => s.IsInspected).CountAsync(),
            UninspectedSessions = await queryable.Where(s => !s.IsInspected && s.Status == SessionStatus.Closed).CountAsync(),
            TodaySessions = await queryable.Where(s => s.CreatedAt >= today).CountAsync(),
            AverageResponseTime = await queryable.Where(s => s.ResponseTimeSeconds.HasValue).AverageAsync(s => s.ResponseTimeSeconds ?? 0),
            AverageResolutionTime = await queryable.Where(s => s.ResolutionTimeSeconds.HasValue).AverageAsync(s => s.ResolutionTimeSeconds ?? 0),
            AverageInspectionScore = await queryable.Where(s => s.InspectionScore.HasValue).AverageAsync(s => s.InspectionScore ?? 0),
            CustomerSatisfactionRate = await _context.ServiceRatings
                .Where(r => queryable.Select(s => s.Id).Contains(r.SessionId))
                .AverageAsync(r => r.OverallRating) / 5 * 100
        };

        return stats;
    }

    public async Task<List<SessionDTO>> GetRandomSessionsForInspectionAsync(RandomInspectionDTO dto)
    {
        var queryable = _context.Sessions
            .Include(s => s.Customer)
            .Include(s => s.Agent)
            .Where(s => s.Status == SessionStatus.Closed);

        if (dto.OnlyUninspected)
            queryable = queryable.Where(s => !s.IsInspected);

        if (dto.AgentId.HasValue)
            queryable = queryable.Where(s => s.AgentId == dto.AgentId.Value);

        if (dto.StartTime.HasValue)
            queryable = queryable.Where(s => s.CreatedAt >= dto.StartTime.Value);

        if (dto.EndTime.HasValue)
            queryable = queryable.Where(s => s.CreatedAt <= dto.EndTime.Value);

        var count = await queryable.CountAsync();
        if (count == 0) return new List<SessionDTO>();

        var random = new Random();
        var skipCount = random.Next(0, Math.Max(0, count - dto.Count));

        var sessions = await queryable
            .OrderBy(s => Guid.NewGuid())
            .Take(dto.Count)
            .ToListAsync();

        return sessions.Select(MapToDTO).ToList();
    }

    public async Task<byte[]> ExportSessionsAsync(ExportSessionDTO dto)
    {
        var queryable = _context.Sessions
            .Include(s => s.Customer)
            .Include(s => s.Agent)
            .AsQueryable();

        if (dto.AgentId.HasValue)
            queryable = queryable.Where(s => s.AgentId == dto.AgentId.Value);

        if (dto.Status.HasValue)
            queryable = queryable.Where(s => (int)s.Status == dto.Status.Value);

        if (dto.StartTime.HasValue)
            queryable = queryable.Where(s => s.CreatedAt >= dto.StartTime.Value);

        if (dto.EndTime.HasValue)
            queryable = queryable.Where(s => s.CreatedAt <= dto.EndTime.Value);

        if (dto.MinResponseTime.HasValue)
            queryable = queryable.Where(s => s.ResponseTimeSeconds >= dto.MinResponseTime.Value);

        if (dto.MaxResponseTime.HasValue)
            queryable = queryable.Where(s => s.ResponseTimeSeconds <= dto.MaxResponseTime.Value);

        var sessions = await queryable
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream);
        using var csv = new CsvHelper.CsvWriter(writer, System.Globalization.CultureInfo.InvariantCulture);

        csv.WriteField("会话编号");
        csv.WriteField("客户名称");
        csv.WriteField("客服人员");
        csv.WriteField("标题");
        csv.WriteField("状态");
        csv.WriteField("渠道");
        csv.WriteField("创建时间");
        csv.WriteField("首次响应时间");
        csv.WriteField("响应时长(秒)");
        csv.WriteField("解决时间");
        csv.WriteField("解决时长(秒)");
        csv.WriteField("是否质检");
        csv.WriteField("质检分数");
        csv.NextRecord();

        foreach (var s in sessions)
        {
            csv.WriteField(s.SessionNumber);
            csv.WriteField(s.Customer?.Name ?? "");
            csv.WriteField(s.Agent?.FullName ?? "");
            csv.WriteField(s.Title);
            csv.WriteField(GetStatusText(s.Status));
            csv.WriteField(s.Channel ?? "");
            csv.WriteField(s.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"));
            csv.WriteField(s.FirstResponseAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "");
            csv.WriteField(s.ResponseTimeSeconds?.ToString("F2") ?? "");
            csv.WriteField(s.ResolvedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "");
            csv.WriteField(s.ResolutionTimeSeconds?.ToString("F2") ?? "");
            csv.WriteField(s.IsInspected ? "是" : "否");
            csv.WriteField(s.InspectionScore?.ToString("F2") ?? "");
            csv.NextRecord();
        }

        writer.Flush();
        return memoryStream.ToArray();
    }

    private static string GenerateSessionNumber()
    {
        return $"SE{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    private static string GetStatusText(SessionStatus status)
    {
        return status switch
        {
            SessionStatus.Pending => "待处理",
            SessionStatus.InProgress => "处理中",
            SessionStatus.WaitingCustomer => "待客户回复",
            SessionStatus.Resolved => "已解决",
            SessionStatus.Closed => "已关闭",
            _ => "未知"
        };
    }

    private static SessionDTO MapToDTO(Session session)
    {
        return new SessionDTO
        {
            Id = session.Id,
            SessionNumber = session.SessionNumber,
            CustomerId = session.CustomerId,
            CustomerName = session.Customer?.Name,
            AgentId = session.AgentId,
            AgentName = session.Agent?.FullName,
            Title = session.Title,
            Status = (int)session.Status,
            StatusText = GetStatusText(session.Status),
            ProblemDescription = session.ProblemDescription,
            RelatedTicketId = session.RelatedTicketId,
            CreatedAt = session.CreatedAt,
            FirstResponseAt = session.FirstResponseAt,
            ResolvedAt = session.ResolvedAt,
            ClosedAt = session.ClosedAt,
            ResponseTimeSeconds = session.ResponseTimeSeconds,
            ResponseTimeDisplay = session.ResponseTimeSeconds.HasValue ? FormatTimeSpan(TimeSpan.FromSeconds(session.ResponseTimeSeconds.Value)) : null,
            ResolutionTimeSeconds = session.ResolutionTimeSeconds,
            Channel = session.Channel,
            Tags = session.Tags,
            IsInspected = session.IsInspected,
            InspectedAt = session.InspectedAt,
            InspectorId = session.InspectorId,
            InspectorName = session.Inspector?.FullName,
            InspectionScore = session.InspectionScore,
            HasRating = session.Rating != null,
            RatingScore = session.Rating?.OverallRating
        };
    }

    private static string FormatTimeSpan(TimeSpan ts)
    {
        if (ts.TotalMinutes < 1)
            return $"{ts.Seconds}秒";
        if (ts.TotalHours < 1)
            return $"{ts.Minutes}分{ts.Seconds}秒";
        if (ts.TotalDays < 1)
            return $"{(int)ts.TotalHours}小时{ts.Minutes}分";
        return $"{(int)ts.TotalDays}天{(int)ts.Hours}小时";
    }
}
