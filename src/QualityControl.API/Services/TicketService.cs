using Microsoft.EntityFrameworkCore;
using QualityControl.API.Data;
using QualityControl.API.DTOs;
using QualityControl.API.Models;

namespace QualityControl.API.Services;

public interface ITicketService
{
    Task<PagedResult<TicketDTO>> GetTicketsAsync(TicketQueryDTO query);
    Task<TicketDTO?> GetTicketByIdAsync(int id);
    Task<TicketDTO> CreateTicketAsync(CreateTicketDTO dto);
    Task<TicketDTO?> UpdateTicketStatusAsync(UpdateTicketStatusDTO dto);
    Task<TicketCommentDTO> AddCommentAsync(AddTicketCommentDTO dto);
    Task<List<TicketCommentDTO>> GetTicketCommentsAsync(int ticketId);
    Task<int> GetPendingTicketCountAsync(int? departmentId = null);
}

public class TicketService : ITicketService
{
    private readonly AppDbContext _context;

    public TicketService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TicketDTO>> GetTicketsAsync(TicketQueryDTO query)
    {
        var queryable = _context.Tickets
            .Include(t => t.AssigneeDepartment)
            .Include(t => t.Assignee)
            .Include(t => t.Creator)
            .Include(t => t.Customer)
            .Include(t => t.RelatedSession)
            .AsQueryable();

        if (query.Type.HasValue)
            queryable = queryable.Where(t => (int)t.Type == query.Type.Value);

        if (query.Priority.HasValue)
            queryable = queryable.Where(t => (int)t.Priority == query.Priority.Value);

        if (query.Status.HasValue)
            queryable = queryable.Where(t => (int)t.Status == query.Status.Value);

        if (query.AssigneeDepartmentId.HasValue)
            queryable = queryable.Where(t => t.AssigneeDepartmentId == query.AssigneeDepartmentId.Value);

        if (query.AssigneeId.HasValue)
            queryable = queryable.Where(t => t.AssigneeId == query.AssigneeId.Value);

        if (query.CreatorId.HasValue)
            queryable = queryable.Where(t => t.CreatorId == query.CreatorId.Value);

        if (query.CustomerId.HasValue)
            queryable = queryable.Where(t => t.CustomerId == query.CustomerId.Value);

        if (query.RelatedSessionId.HasValue)
            queryable = queryable.Where(t => t.RelatedSessionId == query.RelatedSessionId.Value);

        if (query.StartTime.HasValue)
            queryable = queryable.Where(t => t.CreatedAt >= query.StartTime.Value);

        if (query.EndTime.HasValue)
            queryable = queryable.Where(t => t.CreatedAt <= query.EndTime.Value);

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(t => t.Title.Contains(query.Keyword) || t.Description.Contains(query.Keyword));

        var totalCount = await queryable.CountAsync();

        queryable = queryable
            .OrderByDescending(t => t.Priority)
            .ThenByDescending(t => t.CreatedAt);

        var tickets = await queryable
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var items = tickets.Select(MapToDTO).ToList();

        return new PagedResult<TicketDTO>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<TicketDTO?> GetTicketByIdAsync(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.AssigneeDepartment)
            .Include(t => t.Assignee)
            .Include(t => t.Creator)
            .Include(t => t.Customer)
            .Include(t => t.RelatedSession)
            .Include(t => t.RelatedInspection)
            .Include(t => t.Comments)
            .Include(t => t.Attachments)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return null;

        var dto = MapToDTO(ticket);
        dto.CommentCount = ticket.Comments.Count;
        dto.AttachmentCount = ticket.Attachments.Count;

        return dto;
    }

    public async Task<TicketDTO> CreateTicketAsync(CreateTicketDTO dto)
    {
        var ticket = new Ticket
        {
            TicketNumber = GenerateTicketNumber(),
            Type = (TicketType)dto.Type,
            Title = dto.Title,
            Description = dto.Description,
            Priority = (TicketPriority)dto.Priority,
            Status = TicketStatus.Open,
            AssigneeDepartmentId = dto.AssigneeDepartmentId,
            AssigneeId = dto.AssigneeId,
            CreatorId = dto.CreatorId,
            CustomerId = dto.CustomerId,
            RelatedSessionId = dto.RelatedSessionId,
            RelatedInspectionId = dto.RelatedInspectionId,
            Tags = dto.Tags,
            DueDate = dto.DueDate,
            CreatedAt = DateTime.Now
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        if (dto.RelatedSessionId.HasValue)
        {
            var session = await _context.Sessions.FindAsync(dto.RelatedSessionId.Value);
            if (session != null)
            {
                session.RelatedTicketId = ticket.Id;
                await _context.SaveChangesAsync();
            }
        }

        return MapToDTO(ticket);
    }

    public async Task<TicketDTO?> UpdateTicketStatusAsync(UpdateTicketStatusDTO dto)
    {
        var ticket = await _context.Tickets.FindAsync(dto.Id);
        if (ticket == null) return null;

        var oldStatus = ticket.Status;
        ticket.Status = (TicketStatus)dto.Status;

        if (dto.Status == (int)TicketStatus.Resolved && oldStatus != TicketStatus.Resolved)
        {
            ticket.ResolvedAt = DateTime.Now;
        }

        if (dto.Status == (int)TicketStatus.Closed && oldStatus != TicketStatus.Closed)
        {
            ticket.ClosedAt = DateTime.Now;
            ticket.Resolution = dto.Remark;
        }

        await _context.SaveChangesAsync();

        if (!string.IsNullOrEmpty(dto.Remark))
        {
            var comment = new TicketComment
            {
                TicketId = dto.Id,
                CommenterId = dto.OperatorId,
                Content = dto.Remark,
                IsInternal = true,
                CreatedAt = DateTime.Now
            };
            _context.TicketComments.Add(comment);
            await _context.SaveChangesAsync();
        }

        return MapToDTO(ticket);
    }

    public async Task<TicketCommentDTO> AddCommentAsync(AddTicketCommentDTO dto)
    {
        var comment = new TicketComment
        {
            TicketId = dto.TicketId,
            CommenterId = dto.CommenterId,
            CommenterName = dto.CommenterName,
            CommenterRole = dto.CommenterRole,
            Content = dto.Content,
            IsInternal = dto.IsInternal,
            CreatedAt = DateTime.Now
        };

        _context.TicketComments.Add(comment);
        await _context.SaveChangesAsync();

        var ticket = await _context.Tickets.FindAsync(dto.TicketId);
        if (ticket != null && ticket.Status == TicketStatus.Open)
        {
            ticket.Status = TicketStatus.InProgress;
            await _context.SaveChangesAsync();
        }

        return new TicketCommentDTO
        {
            Id = comment.Id,
            TicketId = comment.TicketId,
            CommenterId = comment.CommenterId,
            CommenterName = comment.CommenterName,
            CommenterRole = comment.CommenterRole,
            Content = comment.Content,
            IsInternal = comment.IsInternal,
            CreatedAt = comment.CreatedAt
        };
    }

    public async Task<List<TicketCommentDTO>> GetTicketCommentsAsync(int ticketId)
    {
        var comments = await _context.TicketComments
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(c => new TicketCommentDTO
        {
            Id = c.Id,
            TicketId = c.TicketId,
            CommenterId = c.CommenterId,
            CommenterName = c.CommenterName,
            CommenterRole = c.CommenterRole,
            Content = c.Content,
            IsInternal = c.IsInternal,
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public async Task<int> GetPendingTicketCountAsync(int? departmentId = null)
    {
        var queryable = _context.Tickets
            .Where(t => t.Status == TicketStatus.Open || t.Status == TicketStatus.InProgress);

        if (departmentId.HasValue)
            queryable = queryable.Where(t => t.AssigneeDepartmentId == departmentId.Value);

        return await queryable.CountAsync();
    }

    private static string GenerateTicketNumber()
    {
        return $"TK{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    private static string GetTypeText(TicketType type)
    {
        return type switch
        {
            TicketType.QualityIssue => "质量问题",
            TicketType.ServiceComplaint => "服务投诉",
            TicketType.KnowledgeRequest => "知识需求",
            TicketType.SystemBug => "系统缺陷",
            TicketType.FeatureRequest => "功能需求",
            TicketType.Other => "其他",
            _ => "未知"
        };
    }

    private static string GetPriorityText(TicketPriority priority)
    {
        return priority switch
        {
            TicketPriority.Low => "低",
            TicketPriority.Medium => "中",
            TicketPriority.High => "高",
            TicketPriority.Urgent => "紧急",
            _ => "未知"
        };
    }

    private static string GetStatusText(TicketStatus status)
    {
        return status switch
        {
            TicketStatus.Open => "待处理",
            TicketStatus.InProgress => "处理中",
            TicketStatus.Pending => "待确认",
            TicketStatus.Resolved => "已解决",
            TicketStatus.Closed => "已关闭",
            TicketStatus.Reopened => "已重开",
            _ => "未知"
        };
    }

    private static TicketDTO MapToDTO(Ticket ticket)
    {
        return new TicketDTO
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            Type = (int)ticket.Type,
            TypeText = GetTypeText(ticket.Type),
            Title = ticket.Title,
            Description = ticket.Description,
            Priority = (int)ticket.Priority,
            PriorityText = GetPriorityText(ticket.Priority),
            Status = (int)ticket.Status,
            StatusText = GetStatusText(ticket.Status),
            AssigneeDepartmentId = ticket.AssigneeDepartmentId,
            AssigneeDepartmentName = ticket.AssigneeDepartment?.Name,
            AssigneeId = ticket.AssigneeId,
            AssigneeName = ticket.Assignee?.FullName,
            CreatorId = ticket.CreatorId,
            CreatorName = ticket.Creator?.FullName,
            CustomerId = ticket.CustomerId,
            CustomerName = ticket.Customer?.Name,
            RelatedSessionId = ticket.RelatedSessionId,
            RelatedSessionNumber = ticket.RelatedSession?.SessionNumber,
            RelatedInspectionId = ticket.RelatedInspectionId,
            RelatedInspectionNumber = ticket.RelatedInspection?.InspectionNumber,
            Tags = ticket.Tags,
            CreatedAt = ticket.CreatedAt,
            DueDate = ticket.DueDate,
            ResolvedAt = ticket.ResolvedAt,
            ClosedAt = ticket.ClosedAt,
            Resolution = ticket.Resolution
        };
    }
}
