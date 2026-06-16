
namespace GridEventManagement.Web.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public string? EventTitle { get; set; }
    public int ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
    public string Result { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? SourceBillNo { get; set; }
}

public class CreateReviewDto
{
    public int EventId { get; set; }
    public string Result { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public string? SourceBillNo { get; set; }
}

public class UpdateReviewDto
{
    public string Result { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public string? SourceBillNo { get; set; }
}
