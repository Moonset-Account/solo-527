using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface IPaymentRepository : IGenericRepository<Payment>
{
    Task<Payment?> GetByAppointmentIdAsync(Guid appointmentId);
}
