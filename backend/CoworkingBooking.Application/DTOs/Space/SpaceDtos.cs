using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Application.DTOs.Space;

public class SpaceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public SpaceType Type { get; set; }
    public SpaceStatus Status { get; set; }
    public string Address { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public int Capacity { get; set; }
    public string? Description { get; set; }
    public string? Facilities { get; set; }
    public string? Images { get; set; }
    public string? LandlordName { get; set; }
    public string? LandlordPhone { get; set; }
    public List<SpacePriceDto> Prices { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class SpacePriceDto
{
    public Guid Id { get; set; }
    public string PriceType { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal? MinimumCharge { get; set; }
    public decimal? DepositAmount { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime? ExpireDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateSpaceRequest
{
    public string Name { get; set; } = string.Empty;
    public SpaceType Type { get; set; }
    public string Address { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public int Capacity { get; set; }
    public string? Description { get; set; }
    public string? Facilities { get; set; }
    public string? Images { get; set; }
    public string? LandlordName { get; set; }
    public string? LandlordPhone { get; set; }
    public List<CreateSpacePriceRequest> Prices { get; set; } = new();
}

public class CreateSpacePriceRequest
{
    public string PriceType { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal? MinimumCharge { get; set; }
    public decimal? DepositAmount { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime? ExpireDate { get; set; }
}

public class UpdateSpaceRequest
{
    public string Name { get; set; } = string.Empty;
    public SpaceType Type { get; set; }
    public SpaceStatus Status { get; set; }
    public string Address { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public int Capacity { get; set; }
    public string? Description { get; set; }
    public string? Facilities { get; set; }
    public string? Images { get; set; }
    public string? LandlordName { get; set; }
    public string? LandlordPhone { get; set; }
}

public class SpaceQuery : Common.PagedQuery
{
    public SpaceType? Type { get; set; }
    public SpaceStatus? Status { get; set; }
    public decimal? MinArea { get; set; }
    public decimal? MaxArea { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
}
