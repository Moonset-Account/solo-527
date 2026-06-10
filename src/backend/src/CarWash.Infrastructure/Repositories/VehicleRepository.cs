using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class VehicleRepository : GenericRepository<Vehicle>, IVehicleRepository
{
    public VehicleRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Vehicle?> GetByPlateNumberAsync(string plateNumber)
    {
        return await _dbSet.FirstOrDefaultAsync(v => v.PlateNumber == plateNumber);
    }

    public async Task<IEnumerable<Vehicle>> GetByCustomerIdAsync(Guid customerId)
    {
        return await _dbSet
            .Where(v => v.CustomerId == customerId)
            .ToListAsync();
    }

    public async Task<Vehicle?> GetWithServiceRecordsAsync(Guid id)
    {
        return await _dbSet
            .Include(v => v.ServiceRecords)
            .FirstOrDefaultAsync(v => v.Id == id);
    }
}
