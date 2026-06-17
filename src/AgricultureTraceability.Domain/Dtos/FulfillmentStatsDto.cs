namespace AgricultureTraceability.Domain.Dtos;

public class FulfillmentStatsDto
{
    public int TotalOrders { get; set; }
    public int FulfilledCount { get; set; }
    public int FulfillingCount { get; set; }
    public int CreatedCount { get; set; }
    public int OverdueCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal FulfillmentRate { get; set; }
}
