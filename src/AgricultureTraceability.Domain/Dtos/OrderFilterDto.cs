using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Dtos;

public class OrderFilterDto
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public string? OrderNumber { get; set; }
    public OrderStatus? Status { get; set; }
    public Guid? BatchId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
