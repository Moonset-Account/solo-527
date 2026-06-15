
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Delivery.Queries;

public class GetDeliveryRemindersQuery : IRequest<List<DeliveryReminderDto>>
{
    public int DaysAhead { get; set; } = 7;
}

public class GetDeliveryRemindersQueryHandler : IRequestHandler<GetDeliveryRemindersQuery, List<DeliveryReminderDto>>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;

    public GetDeliveryRemindersQueryHandler(PrintingFactoryDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<List<DeliveryReminderDto>> Handle(GetDeliveryRemindersQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = "delivery:reminders";
        var cached = await _cacheService.GetAsync<List<DeliveryReminderDto>>(cacheKey, cancellationToken);
        if (cached != null) return cached;

        var now = DateTime.UtcNow;
        var cutoffDate = now.AddDays(request.DaysAhead);

        var orders = await _context.Orders
            .Include(o => o.Store)
            .Where(o => 
                o.Status != OrderStatus.Delivered && 
                o.Status != OrderStatus.Cancelled &&
                o.DeliveryDate <= cutoffDate)
            .OrderBy(o => o.DeliveryDate)
            .ToListAsync(cancellationToken);

        var result = orders.Select(order =>
        {
            var daysRemaining = (int)(order.DeliveryDate - now).TotalDays;
            var isOverdue = daysRemaining < 0;
            var reminderLevel = GetReminderLevel(daysRemaining, order.Status);

            return new DeliveryReminderDto
            {
                OrderId = order.Id,
                OrderNo = order.OrderNo,
                StoreName = order.Store != null ? order.Store.Name : string.Empty,
                ProductName = order.ProductName,
                Quantity = order.Quantity,
                DeliveryDate = order.DeliveryDate,
                Status = order.Status,
                DaysRemaining = daysRemaining,
                IsOverdue = isOverdue,
                ReminderLevel = reminderLevel
            };
        }).ToList();

        await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromHours(1), cancellationToken);

        return result;
    }

    private static string GetReminderLevel(int daysRemaining, OrderStatus status)
    {
        if (daysRemaining < 0) return "critical";
        if (daysRemaining <= 1) return "high";
        if (daysRemaining <= 3) return "medium";
        if (daysRemaining <= 7) return "low";
        return "normal";
    }
}
