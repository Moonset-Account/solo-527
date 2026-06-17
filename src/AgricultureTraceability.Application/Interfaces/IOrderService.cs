using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Application.Interfaces;

public interface IOrderService
{
    Task<IEnumerable<Order>> GetAllAsync();
    Task<Order?> GetByIdAsync(Guid id);
    Task<(int TotalOrders, Dictionary<OrderStatus, int> StatusCounts, decimal TotalAmount, decimal FulfillmentRate)> GetFulfillmentStatsAsync();
    Task<(IEnumerable<Order> Items, int TotalCount)> GetPagedOrdersAsync(int pageIndex, int pageSize, string? orderNumber = null, string? customerName = null, OrderStatus? status = null);
    Task<Order> CreateAsync(Order order);
    Task UpdateAsync(Order order);
    Task DeleteAsync(Guid id);
}
