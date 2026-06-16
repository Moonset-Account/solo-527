namespace GridEventManagement.Web.Models;

public class Grid
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Boundary { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Resident> Residents { get; set; } = new List<Resident>();
    public ICollection<GridEvent> Events { get; set; } = new List<GridEvent>();
    public ICollection<PatrolTask> PatrolTasks { get; set; } = new List<PatrolTask>();
}
