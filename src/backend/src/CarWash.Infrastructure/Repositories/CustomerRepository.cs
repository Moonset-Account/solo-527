using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class CustomerRepository : GenericRepository<Customer>, ICustomerRepository
{
    public CustomerRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Customer?> GetByPhoneAsync(string phone)
    {
        return await _dbSet.FirstOrDefaultAsync(c => c.Phone == phone);
    }

    public async Task<Customer?> GetWithVehiclesAsync(Guid customerId)
    {
        return await _dbSet
            .Include(c => c.Vehicles)
            .FirstOrDefaultAsync(c => c.Id == customerId);
    }
}
