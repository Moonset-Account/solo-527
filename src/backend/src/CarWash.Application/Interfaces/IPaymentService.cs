using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface IPaymentService
{
    Task<PaymentDto> CreateAsync(CreatePaymentRequest request, CancellationToken cancellationToken = default);
    Task<PaymentDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PaymentDto?> GetByAppointmentIdAsync(Guid appointmentId, CancellationToken cancellationToken = default);
    Task<PaymentDto> UpdateStatusAsync(Guid id, UpdatePaymentStatusRequest request, CancellationToken cancellationToken = default);
    Task<List<PaymentDto>> GetListByAppointmentIdAsync(Guid appointmentId, CancellationToken cancellationToken = default);
}
