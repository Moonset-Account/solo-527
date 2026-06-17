using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IOrderService
{
    Task<IEnumerable<Order>> GetAllOrdersAsync(string? orderNumber = null, OrderStatus? status = null, Guid? batchId = null);
    Task<Order?> GetOrderByIdAsync(Guid id);
    Task<Order> CreateOrderAsync(Order order);
    Task<Order?> UpdateOrderAsync(Guid id, Order order);
    Task<bool> DeleteOrderAsync(Guid id);
    Task<FulfillmentStatsDto> GetFulfillmentStatsAsync();
    Task<PagedResult<Order>> GetPagedOrdersAsync(int page, int pageSize, OrderFilterDto filter);
}
