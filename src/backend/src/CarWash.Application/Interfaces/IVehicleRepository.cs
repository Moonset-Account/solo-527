using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface IVehicleRepository : IGenericRepository<Vehicle>
{
    Task<Vehicle?> GetByPlateNumberAsync(string plateNumber);
    Task<IEnumerable<Vehicle>> GetByCustomerIdAsync(Guid customerId);
    Task<Vehicle?> GetWithServiceRecordsAsync(Guid id);
}
