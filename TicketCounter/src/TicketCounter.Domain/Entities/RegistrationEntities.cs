
using TicketCounter.Domain.Enums;

namespace TicketCounter.Domain.Entities;

public class Registration
{
    public Guid Id { get; set; }
    public string RegistrationNo { get; set; } = string.Empty;
    public Guid? SessionId { get; set; }
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
    public bool HasMissingData => !string.IsNullOrWhiteSpace(MissingFields);

    public string? Reviewer { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComment { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public Session? Session { get; set; }
    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    public ICollection<RegistrationAudit> Audits { get; set; } = new List<RegistrationAudit>();
}

public class RegistrationAudit
{
    public Guid Id { get; set; }
    public Guid RegistrationId { get; set; }
    public RegistrationStatus FromStatus { get; set; }
    public RegistrationStatus ToStatus { get; set; }
    public string? Comment { get; set; }
    public string Operator { get; set; } = string.Empty;
    public DateTime OperatedAt { get; set; }
    public string? ChangedFields { get; set; }
    public string? OriginalValues { get; set; }
    public string? NewValues { get; set; }

    public Registration? Registration { get; set; }
}
