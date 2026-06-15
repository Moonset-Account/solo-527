
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Orders.Queries;

public class GetOrderListQuery : IRequest<List<OrderDto>>
{
    public int? StoreId { get; set; }
    public OrderStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? SearchKeyword { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetOrderListQueryHandler : IRequestHandler<GetOrderListQuery, List<OrderDto>>
{
    private readonly PrintingFactoryDbContext _context;

    public GetOrderListQueryHandler(PrintingFactoryDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderDto>> Handle(GetOrderListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders
            .Include(o => o.Store)
            .AsQueryable();

        if (request.StoreId.HasValue)
            query = query.Where(o => o.StoreId == request.StoreId.Value);

        if (request.Status.HasValue)
            query = query.Where(o => o.Status == request.Status.Value);

        if (request.StartDate.HasValue)
            query = query.Where(o => o.OrderDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(o => o.OrderDate <= request.EndDate.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchKeyword))
            query = query.Where(o =>
                o.OrderNo.Contains(request.SearchKeyword) ||
                o.CustomerName.Contains(request.SearchKeyword) ||
                o.ProductName.Contains(request.SearchKeyword));

        var skip = (request.PageIndex - 1) * request.PageSize;
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip(skip)
            .Take(request.PageSize)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNo = o.OrderNo,
                StoreId = o.StoreId,
                StoreName = o.Store != null ? o.Store.Name : string.Empty,
                CustomerName = o.CustomerName,
                CustomerPhone = o.CustomerPhone,
                ProductName = o.ProductName,
                Specifications = o.Specifications,
                Quantity = o.Quantity,
                Unit = o.Unit,
                UnitPrice = o.UnitPrice,
                TotalAmount = o.TotalAmount,
                MaterialRequirements = o.MaterialRequirements,
                SpecialRequirements = o.SpecialRequirements,
                OrderDate = o.OrderDate,
                DeliveryDate = o.DeliveryDate,
                Status = o.Status,
                Remarks = o.Remarks,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return orders;
    }
}
