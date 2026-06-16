
namespace GridEventManagement.Web.Models;

public class RectificationReview
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int ReviewerId { get; set; }
    public string Result { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? SourceBillNo { get; set; }

    public GridEvent Event { get; set; } = null!;
    public User Reviewer { get; set; } = null!;
}
