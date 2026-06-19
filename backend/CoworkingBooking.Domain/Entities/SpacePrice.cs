namespace CoworkingBooking.Domain.Entities;

public class SpacePrice : EntityBase
{
    public Guid SpaceId { get; set; }
    public string PriceType { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal? MinimumCharge { get; set; }
    public decimal? DepositAmount { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime? ExpireDate { get; set; }
    public bool IsActive { get; set; } = true;

    public CoworkingSpace Space { get; set; } = null!;
}
