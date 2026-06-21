namespace ProcessScheduling.Application.DTOs;

public class ScanCodeRequestDto
{
    public string QrCode { get; set; } = string.Empty;
    public Guid OperatorId { get; set; }
    public Guid EquipmentId { get; set; }
}
