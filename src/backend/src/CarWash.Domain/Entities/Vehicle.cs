namespace CarWash.Domain.Entities;

public class Vehicle : BaseEntity
{
    public string PlateNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Vin { get; set; }
    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string? Notes { get; set; }
    public string? Tags { get; set; }
    public ICollection<VehicleServiceRecord> ServiceRecords { get; set; } = new List<VehicleServiceRecord>();
}
