
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Summary.Queries;

public class GetStoreSummaryQuery : IRequest<List<StoreSummaryDto>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class GetStoreSummaryQueryHandler : IRequestHandler<GetStoreSummaryQuery, List<StoreSummaryDto>>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;

    public GetStoreSummaryQueryHandler(PrintingFactoryDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<List<StoreSummaryDto>> Handle(GetStoreSummaryQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = "stores:summary";
        if (!request.StartDate.HasValue && !request.EndDate.HasValue)
        {
            var cached = await _cacheService.GetAsync<List<StoreSummaryDto>>(cacheKey, cancellationToken);
            if (cached != null) return cached;
        }

        var now = DateTime.UtcNow;
        var query = _context.Stores
            .Where(s => s.IsActive)
            .Include(s => s.Orders)
            .AsQueryable();

        if (request.StartDate.HasValue)
            query = query.Where(s => s.Orders.Any(o => o.OrderDate >= request.StartDate.Value));

        if (request.EndDate.HasValue)
            query = query.Where(s => s.Orders.Any(o => o.OrderDate <= request.EndDate.Value));

        var stores = await query.ToListAsync(cancellationToken);

        var result = stores.Select(store =>
        {
            var orders = store.Orders.AsQueryable();
            if (request.StartDate.HasValue)
                orders = orders.Where(o => o.OrderDate >= request.StartDate.Value);
            if (request.EndDate.HasValue)
                orders = orders.Where(o => o.OrderDate <= request.EndDate.Value);

            var orderList = orders.ToList();

            return new StoreSummaryDto
            {
                StoreId = store.Id,
                StoreName = store.Name,
                TotalOrders = orderList.Count,
                PendingOrders = orderList.Count(o => o.Status == OrderStatus.Pending),
                InProductionOrders = orderList.Count(o => o.Status == OrderStatus.InProduction),
                CompletedOrders = orderList.Count(o => o.Status == OrderStatus.Completed),
                DeliveredOrders = orderList.Count(o => o.Status == OrderStatus.Delivered),
                QualityFailedOrders = orderList.Count(o => o.Status == OrderStatus.QualityFailed),
                TotalAmount = orderList.Sum(o => o.TotalAmount),
                OverdueOrders = orderList.Count(o => o.DeliveryDate < now && o.Status != OrderStatus.Delivered && o.Status != OrderStatus.Cancelled)
            };
        }).ToList();

        if (!request.StartDate.HasValue && !request.EndDate.HasValue)
        {
            await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30), cancellationToken);
        }

        return result;
    }
}
