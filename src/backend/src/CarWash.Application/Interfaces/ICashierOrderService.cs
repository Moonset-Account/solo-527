using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface ICashierOrderService
{
    Task<CashierOrderDto> CreateAsync(CreateCashierOrderRequest request, CancellationToken cancellationToken = default);
    Task<CashierOrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<CashierOrderDto>> GetByAppointmentIdAsync(Guid appointmentId, CancellationToken cancellationToken = default);
    Task<List<CashierOrderDto>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<CashierOrderDto> UpdatePaymentStatusAsync(Guid id, UpdateCashierOrderStatusRequest request,
        CancellationToken cancellationToken = default);
}
