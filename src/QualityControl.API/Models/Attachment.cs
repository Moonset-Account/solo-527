using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class Attachment
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string FileType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ContentType { get; set; }

    public int? SessionId { get; set; }

    public Session? Session { get; set; }

    public int? SessionMessageId { get; set; }

    public SessionMessage? SessionMessage { get; set; }

    public int? TicketId { get; set; }

    public Ticket? Ticket { get; set; }

    public int? TicketCommentId { get; set; }

    public TicketComment? TicketComment { get; set; }

    public int? KnowledgeBaseId { get; set; }

    public KnowledgeBase? KnowledgeBase { get; set; }

    public int UploaderId { get; set; }

    [MaxLength(200)]
    public string? UploaderName { get; set; }

    public DateTime UploadedAt { get; set; }
}
