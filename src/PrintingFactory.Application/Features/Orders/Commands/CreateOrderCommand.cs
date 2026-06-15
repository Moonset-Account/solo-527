
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Orders.Commands;

public class CreateOrderCommand : IRequest<OrderDto>
{
    public CreateOrderDto Order { get; set; } = new();
}

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;

    public CreateOrderCommandHandler(PrintingFactoryDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var orderNo = await GenerateOrderNo(cancellationToken);
        var store = await _context.Stores.FindAsync(new object[] { request.Order.StoreId }, cancellationToken);

        var order = new Order
        {
            OrderNo = orderNo,
            StoreId = request.Order.StoreId,
            CustomerName = request.Order.CustomerName,
            CustomerPhone = request.Order.CustomerPhone,
            ProductName = request.Order.ProductName,
            Specifications = request.Order.Specifications,
            Quantity = request.Order.Quantity,
            Unit = request.Order.Unit,
            UnitPrice = request.Order.UnitPrice,
            TotalAmount = request.Order.Quantity * request.Order.UnitPrice,
            MaterialRequirements = request.Order.MaterialRequirements,
            SpecialRequirements = request.Order.SpecialRequirements,
            OrderDate = request.Order.OrderDate,
            DeliveryDate = request.Order.DeliveryDate,
            Status = OrderStatus.Pending,
            Remarks = request.Order.Remarks
        };

        var productionNodes = await _context.ProductionNodes
            .Where(n => n.IsActive)
            .OrderBy(n => n.SortOrder)
            .ToListAsync(cancellationToken);

        foreach (var node in productionNodes)
        {
            order.ProductionProgresses.Add(new ProductionProgress
            {
                ProductionNodeId = node.Id,
                Status = ProductionStatus.NotStarted
            });
        }

        order.DeliveryTrackings.Add(new DeliveryTracking
        {
            Status = DeliveryStatus.Pending,
            ScheduledDeliveryDate = request.Order.DeliveryDate
        });

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        await _cacheService.RemoveAsync("orders:list");
        await _cacheService.RemoveAsync("stores:summary");

        return new OrderDto
        {
            Id = order.Id,
            OrderNo = order.OrderNo,
            StoreId = order.StoreId,
            StoreName = store != null ? store.Name : string.Empty,
            CustomerName = order.CustomerName,
            CustomerPhone = order.CustomerPhone,
            ProductName = order.ProductName,
            Specifications = order.Specifications,
            Quantity = order.Quantity,
            Unit = order.Unit,
            UnitPrice = order.UnitPrice,
            TotalAmount = order.TotalAmount,
            MaterialRequirements = order.MaterialRequirements,
            SpecialRequirements = order.SpecialRequirements,
            OrderDate = order.OrderDate,
            DeliveryDate = order.DeliveryDate,
            Status = order.Status,
            Remarks = order.Remarks,
            CreatedAt = order.CreatedAt
        };
    }

    private async Task<string> GenerateOrderNo(CancellationToken cancellationToken)
    {
        var dateStr = DateTime.Now.ToString("yyyyMMdd");
        var prefix = $"ORD{dateStr}";
        
        var lastOrder = await _context.Orders
            .Where(o => o.OrderNo.StartsWith(prefix))
            .OrderByDescending(o => o.OrderNo)
            .FirstOrDefaultAsync(cancellationToken);

        int sequence = 1;
        if (lastOrder != null)
        {
            var lastSeqStr = lastOrder.OrderNo.Substring(prefix.Length);
            if (int.TryParse(lastSeqStr, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{prefix}{sequence:0000}";
    }
}
