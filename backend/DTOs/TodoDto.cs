
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.DTOs;

public class TodoDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public TodoType Type { get; set; }
    public int RelatedId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class CreateTodoDto
{
    public int UserId { get; set; }
    public TodoType Type { get; set; }
    public int RelatedId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
}

public class UpdateTodoDto
{
    public string Title { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
}

public class TodoQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public TodoType? Type { get; set; }
    public int? UserId { get; set; }
    public bool? IsCompleted { get; set; }
}
