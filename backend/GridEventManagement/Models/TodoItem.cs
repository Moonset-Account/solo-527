using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.Models;

public class TodoItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public TodoType Type { get; set; }
    public int RelatedId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    public User User { get; set; } = null!;
}
