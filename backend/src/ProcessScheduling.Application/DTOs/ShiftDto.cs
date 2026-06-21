namespace ProcessScheduling.Application.DTOs;

public class ShiftDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Leader { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
