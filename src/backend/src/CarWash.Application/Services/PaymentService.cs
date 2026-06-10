using CarWash.Application.DTOs;
using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;

namespace CarWash.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IRepository<Payment> _paymentRepository;
    private readonly IRepository<Appointment> _appointmentRepository;
    private readonly IAuditLogService _auditLogService;

    public PaymentService(
        IRepository<Payment> paymentRepository,
        IRepository<Appointment> appointmentRepository,
        IAuditLogService auditLogService)
    {
        _paymentRepository = paymentRepository;
        _appointmentRepository = appointmentRepository;
        _auditLogService = auditLogService;
    }

    public async Task<PaymentDto> CreateAsync(CreatePaymentRequest request, CancellationToken cancellationToken = default)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(request.AppointmentId, cancellationToken);
        if (appointment == null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            AppointmentId = request.AppointmentId,
            Amount = request.Amount,
            Method = request.Method,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        var created = await _paymentRepository.AddAsync(payment, cancellationToken);

        return MapToDto(created);
    }

    public async Task<PaymentDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
        if (payment == null) return null;

        return MapToDto(payment);
    }

    public async Task<PaymentDto?> GetByAppointmentIdAsync(Guid appointmentId, CancellationToken cancellationToken = default)
    {
        var payment = await _paymentRepository.FirstOrDefaultAsync(
            p => p.AppointmentId == appointmentId,
            cancellationToken);

        return payment == null ? null : MapToDto(payment);
    }

    public async Task<PaymentDto> UpdateStatusAsync(Guid id, UpdatePaymentStatusRequest request, CancellationToken cancellationToken = default)
    {
        var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
        if (payment == null)
            throw new KeyNotFoundException($"Payment with id {id} not found");

        var oldStatus = payment.Status;
        payment.Status = request.Status;

        if (request.Status == "paid" && !payment.PaidAt.HasValue)
        {
            payment.PaidAt = DateTime.UtcNow;
        }

        await _paymentRepository.UpdateAsync(payment, cancellationToken);

        if (oldStatus != request.Status)
        {
            await _auditLogService.LogAsync(
                "payment",
                id,
                "status_changed",
                oldStatus,
                request.Status,
                Guid.Empty,
                "System",
                null,
                cancellationToken);
        }

        return MapToDto(payment);
    }

    public async Task<List<PaymentDto>> GetListByAppointmentIdAsync(Guid appointmentId, CancellationToken cancellationToken = default)
    {
        var payments = await _paymentRepository.GetAsync(
            p => p.AppointmentId == appointmentId,
            cancellationToken);

        return payments.OrderByDescending(p => p.CreatedAt)
                       .Select(MapToDto)
                       .ToList();
    }

    private static PaymentDto MapToDto(Payment payment)
    {
        return new PaymentDto
        {
            Id = payment.Id,
            AppointmentId = payment.AppointmentId,
            Amount = payment.Amount,
            Method = payment.Method,
            Status = payment.Status,
            PaidAt = payment.PaidAt,
            CreatedAt = payment.CreatedAt
        };
    }
}
