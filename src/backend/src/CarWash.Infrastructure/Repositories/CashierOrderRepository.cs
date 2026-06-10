using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class CashierOrderRepository : GenericRepository<CashierOrder>, ICashierOrderRepository
{
    public CashierOrderRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<CashierOrder?> GetByAppointmentIdAsync(Guid appointmentId)
    {
        return await _dbSet.FirstOrDefaultAsync(co => co.AppointmentId == appointmentId);
    }

    public async Task<IEnumerable<CashierOrder>> GetByCustomerIdAsync(Guid customerId)
    {
        return await _dbSet
            .Where(co => co.CustomerId == customerId)
            .OrderByDescending(co => co.CreatedAt)
            .ToListAsync();
    }

    public async Task<CashierOrder?> GetWithItemsAsync(Guid id)
    {
        return await _dbSet
            .Include(co => co.Items)
            .FirstOrDefaultAsync(co => co.Id == id);
    }
}
