using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Infrastructure.Data;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AgricultureTraceability.Application.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _context;

    public OrderService(IUnitOfWork unitOfWork, AppDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    public async Task<IEnumerable<Order>> GetAllAsync()
    {
        return await _context.Orders
            .Include(o => o.HarvestBatch)
            .ThenInclude(h => h!.Plot)
            .Include(o => o.HarvestBatch)
            .ThenInclude(h => h!.Variety)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<Order?> GetByIdAsync(Guid id)
    {
        return await _context.Orders
            .Include(o => o.HarvestBatch)
            .ThenInclude(h => h!.Plot)
            .Include(o => o.HarvestBatch)
            .ThenInclude(h => h!.Variety)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<(int TotalOrders, Dictionary<OrderStatus, int> StatusCounts, decimal TotalAmount, decimal FulfillmentRate)> GetFulfillmentStatsAsync()
    {
        var all = await _unitOfWork.Orders.GetAllAsync();
        var list = all.ToList();

        var totalOrders = list.Count;
        var totalAmount = list.Sum(o => o.TotalAmount);

        var statusCounts = new Dictionary<OrderStatus, int>
        {
            [OrderStatus.Created] = list.Count(o => o.Status == OrderStatus.Created),
            [OrderStatus.Fulfilling] = list.Count(o => o.Status == OrderStatus.Fulfilling),
            [OrderStatus.Fulfilled] = list.Count(o => o.Status == OrderStatus.Fulfilled),
            [OrderStatus.Overdue] = list.Count(o => o.Status == OrderStatus.Overdue)
        };

        var fulfilledCount = statusCounts[OrderStatus.Fulfilled];
        var fulfillmentRate = totalOrders > 0 ? (decimal)fulfilledCount / totalOrders * 100 : 0;

        return (totalOrders, statusCounts, totalAmount, fulfillmentRate);
    }

    public async Task<(IEnumerable<Order> Items, int TotalCount)> GetPagedOrdersAsync(
        int pageIndex,
        int pageSize,
        string? orderNumber = null,
        string? customerName = null,
        OrderStatus? status = null)
    {
        IQueryable<Order> query = _context.Orders
            .Include(o => o.HarvestBatch)
            .ThenInclude(h => h!.Plot)
            .Include(o => o.HarvestBatch)
            .ThenInclude(h => h!.Variety);

        if (!string.IsNullOrEmpty(orderNumber))
        {
            query = query.Where(o => o.OrderNumber!.Contains(orderNumber));
        }

        if (!string.IsNullOrEmpty(customerName))
        {
            query = query.Where(o => o.CustomerName!.Contains(customerName));
        }

        if (status.HasValue)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Order> CreateAsync(Order order)
    {
        order.Id = Guid.NewGuid();
        order.CreatedAt = DateTime.Now;
        order.TotalAmount = order.Quantity * order.UnitPrice;
        if (string.IsNullOrEmpty(order.OrderNumber))
        {
            order.OrderNumber = GenerateOrderNumber();
        }
        var result = await _unitOfWork.Orders.AddAsync(order);
        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    public async Task UpdateAsync(Order order)
    {
        order.TotalAmount = order.Quantity * order.UnitPrice;
        _unitOfWork.Orders.Update(order);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id);
        if (order != null)
        {
            _unitOfWork.Orders.Delete(order);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    private static string GenerateOrderNumber()
    {
        return $"SO{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }
}
