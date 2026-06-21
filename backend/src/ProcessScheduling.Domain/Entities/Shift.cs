namespace ProcessScheduling.Domain.Entities;

public class Shift : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Leader { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<User> Members { get; set; } = new List<User>();
    public ICollection<ShiftPerformance> Performances { get; set; } = new List<ShiftPerformance>();
}
