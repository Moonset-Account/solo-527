
using TicketCounter.Domain.Enums;

namespace TicketCounter.Domain.Entities;

public class Session
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Venue { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public SessionStatus Status { get; set; }
    public int? GroupNumber { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    public ICollection<TicketStock> TicketStocks { get; set; } = new List<TicketStock>();
    public ICollection<Registration> Registrations { get; set; } = new List<Registration>();
}

public class Seat
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string SeatCode { get; set; } = string.Empty;
    public string? Row { get; set; }
    public int? Number { get; set; }
    public string? Area { get; set; }
    public SeatStatus Status { get; set; }
    public TicketType TicketType { get; set; }
    public Guid? RegistrationId { get; set; }
    public string? LockedBy { get; set; }
    public DateTime? LockedUntil { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public Session? Session { get; set; }
    public Registration? Registration { get; set; }
}

public class TicketStock
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public TicketType TicketType { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public int SoldQuantity { get; set; }
    public decimal? Price { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public Session? Session { get; set; }
}
