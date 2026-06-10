using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface ICustomerRepository : IGenericRepository<Customer>
{
    Task<Customer?> GetByPhoneAsync(string phone);
    Task<Customer?> GetWithVehiclesAsync(Guid customerId);
}
