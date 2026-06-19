using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Order;

namespace CoworkingBooking.Application.Interfaces;

public interface IOrderService
{
    Task<ApiResponse<PagedResult<OrderDto>>> GetListAsync(OrderQuery query);
    Task<ApiResponse<OrderDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<OrderDto>> CreateAsync(CreateOrderRequest request, Guid? operatorId);
    Task<ApiResponse> PayAsync(Guid id, PayOrderRequest request, Guid? operatorId);
    Task<ApiResponse> CancelAsync(Guid id, string reason, Guid? operatorId);
    Task<ApiResponse> UpdateFulfillmentAsync(Guid orderId, Guid fulfillmentId, UpdateFulfillmentRequest request, Guid? operatorId);
    Task<ApiResponse<byte[]>> ExportOrdersAsync(OrderQuery query);
}
