using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Application.DTOs;

public class CreateEquipmentDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
}
