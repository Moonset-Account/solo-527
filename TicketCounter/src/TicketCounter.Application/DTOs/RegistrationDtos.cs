
using TicketCounter.Domain.Enums;

namespace TicketCounter.Application.DTOs;

public class RegistrationDto
{
    public Guid Id { get; set; }
    public string RegistrationNo { get; set; } = string.Empty;
    public Guid? SessionId { get; set; }
    public string? SessionName { get; set; }
    public TicketType? TicketType { get; set; }
    public string? SeatId { get; set; }
    public RegistrationStatus Status { get; set; }
    public RegistrationSource Source { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string? Position { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? IdCard { get; set; }
    public string? Wechat { get; set; }
    public string? Industry { get; set; }
    public string? City { get; set; }
    public int? GroupNumber { get; set; }
    public string? Remark { get; set; }

    public int DataQualityScore { get; set; }
    public string? MissingFields { get; set; }
    public bool HasMissingData { get; set; }

    public string? Reviewer { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComment { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateRegistrationDto
{
    public Guid? SessionId { get; set; }
    public TicketType? TicketType { get; set; }
    public RegistrationSource? Source { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string? Position { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? IdCard { get; set; }
    public string? Wechat { get; set; }
    public string? Industry { get; set; }
    public string? City { get; set; }
    public int? GroupNumber { get; set; }
    public string? Remark { get; set; }
}

public class ReviewRegistrationDto
{
    public RegistrationStatus Status { get; set; }
    public string Comment { get; set; } = string.Empty;
    public Guid? SessionId { get; set; }
    public TicketType? TicketType { get; set; }
    public int? GroupNumber { get; set; }
    public Guid? SeatId { get; set; }
}

public class RegistrationAuditDto
{
    public Guid Id { get; set; }
    public Guid RegistrationId { get; set; }
    public RegistrationStatus FromStatus { get; set; }
    public RegistrationStatus ToStatus { get; set; }
    public string? Comment { get; set; }
    public string Operator { get; set; } = string.Empty;
    public DateTime OperatedAt { get; set; }
    public string? ChangedFields { get; set; }
}

public class PagedResult<T>
{
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class RegistrationQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public RegistrationStatus? Status { get; set; }
    public Guid? SessionId { get; set; }
    public TicketType? TicketType { get; set; }
    public string? Keyword { get; set; }
    public bool? HasMissingData { get; set; }
    public int? GroupNumber { get; set; }
    public RegistrationSource? Source { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
