using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class SessionMessage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SessionId { get; set; }

    public Session? Session { get; set; }

    [Required]
    public MessageSenderType SenderType { get; set; }

    public int? SenderId { get; set; }

    [MaxLength(200)]
    public string? SenderName { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTime SentAt { get; set; }

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}

public enum MessageSenderType
{
    Customer = 0,
    Agent = 1,
    System = 2,
    Bot = 3
}
