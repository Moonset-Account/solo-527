using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface ICashierOrderRepository : IGenericRepository<CashierOrder>
{
    Task<CashierOrder?> GetByAppointmentIdAsync(Guid appointmentId);
    Task<IEnumerable<CashierOrder>> GetByCustomerIdAsync(Guid customerId);
    Task<CashierOrder?> GetWithItemsAsync(Guid id);
}
