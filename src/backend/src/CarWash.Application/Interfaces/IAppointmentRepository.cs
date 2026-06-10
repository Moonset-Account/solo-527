using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface IAppointmentRepository : IGenericRepository<Appointment>
{
    Task<IEnumerable<Appointment>> GetByDateAsync(DateTime date);
    Task<IEnumerable<Appointment>> GetByCustomerIdAsync(Guid customerId);
    Task<IEnumerable<Appointment>> GetByStatusAsync(string status);
    Task<Appointment?> GetWithDetailsAsync(Guid id);
}
