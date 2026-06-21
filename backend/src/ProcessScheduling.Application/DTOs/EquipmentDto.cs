namespace ProcessScheduling.Application.DTOs;

public class EquipmentDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string? CurrentWorkOrderCode { get; set; }
    public Guid? CurrentMoldId { get; set; }
    public string? MoldCode { get; set; }
    public Guid? CurrentShiftId { get; set; }
    public string? ShiftName { get; set; }
    public string Location { get; set; } = string.Empty;
}
