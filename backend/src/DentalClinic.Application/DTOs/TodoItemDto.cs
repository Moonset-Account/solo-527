
namespace DentalClinic.Application.DTOs;

public class TodoItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Type { get; set; }
    public string? TypeText { get; set; }
    public int Priority { get; set; }
    public string? PriorityText { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public int? PatientId { get; set; }
    public string? PatientName { get; set; }
    public string? PatientPhone { get; set; }
    public int? AppointmentId { get; set; }
    public int? FollowUpId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public DateTime? DueDate { get; set; }
    public string? DueDateText { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public AppointmentDto? Appointment { get; set; }
    public List&lt;FeeItemDto&gt;? FeeItems { get; set; }
    public ChiefComplaintDto? ChiefComplaint { get; set; }
    public PrescriptionDto? Prescription { get; set; }
    public FollowUpDto? FollowUp { get; set; }
}

public class TodoItemCreateDto
{
    public string Title { get; set; } = string.Empty;
    public int Type { get; set; }
    public int Priority { get; set; }
    public int? PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int? FollowUpId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Description { get; set; }
}

public class TodoItemUpdateDto
{
    public int Status { get; set; }
    public string? Description { get; set; }
}

public class TodoQueryDto : PagedQueryDto
{
    public int? AssignedToUserId { get; set; }
    public int? Status { get; set; }
    public int? Type { get; set; }
    public int? Priority { get; set; }
}
