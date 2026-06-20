
using TicketCounter.Domain.Enums;

namespace TicketCounter.Application.DTOs;

public class SessionDto
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
    public int SeatCount { get; set; }
    public int SoldSeatCount { get; set; }
}

public class CreateSessionDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Venue { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int? GroupNumber { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateSessionDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Venue { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public SessionStatus Status { get; set; }
    public int? GroupNumber { get; set; }
    public int SortOrder { get; set; }
}

public class SeatDto
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
    public string? RegistrationName { get; set; }
    public int SortOrder { get; set; }
}

public class CreateSeatDto
{
    public Guid SessionId { get; set; }
    public string SeatCode { get; set; } = string.Empty;
    public string? Row { get; set; }
    public int? Number { get; set; }
    public string? Area { get; set; }
    public TicketType TicketType { get; set; }
    public int SortOrder { get; set; }
}

public class BatchCreateSeatsDto
{
    public Guid SessionId { get; set; }
    public string? Area { get; set; }
    public int StartRow { get; set; }
    public int EndRow { get; set; }
    public int SeatsPerRow { get; set; }
    public TicketType TicketType { get; set; }
    public string? RowPrefix { get; set; }
}

public class UpdateSeatDto
{
    public string? Row { get; set; }
    public int? Number { get; set; }
    public string? Area { get; set; }
    public SeatStatus Status { get; set; }
    public TicketType TicketType { get; set; }
    public int SortOrder { get; set; }
}

public class TicketStockDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public TicketType TicketType { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public int SoldQuantity { get; set; }
    public int AvailableQuantity => TotalQuantity - ReservedQuantity - SoldQuantity;
    public decimal? Price { get; set; }
    public string? Description { get; set; }
}

public class CreateTicketStockDto
{
    public Guid SessionId { get; set; }
    public TicketType TicketType { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public decimal? Price { get; set; }
    public string? Description { get; set; }
}

public class UpdateTicketStockDto
{
    public string TicketTypeName { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public decimal? Price { get; set; }
    public string? Description { get; set; }
}
