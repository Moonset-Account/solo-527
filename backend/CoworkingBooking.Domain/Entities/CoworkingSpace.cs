using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Domain.Entities;

public class CoworkingSpace : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public SpaceType Type { get; set; }
    public SpaceStatus Status { get; set; }
    public string Address { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public int Capacity { get; set; }
    public string? Description { get; set; }
    public string? Facilities { get; set; }
    public string? Images { get; set; }
    public Guid? LandlordId { get; set; }
    public string? LandlordName { get; set; }
    public string? LandlordPhone { get; set; }

    public ICollection<SpacePrice> Prices { get; set; } = new List<SpacePrice>();
    public ICollection<ViewingAppointment> Appointments { get; set; } = new List<ViewingAppointment>();
    public ICollection<LeaseContract> Contracts { get; set; } = new List<LeaseContract>();
}
