using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class AppointmentRepository : GenericRepository<Appointment>, IAppointmentRepository
{
    public AppointmentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Appointment>> GetByDateAsync(DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);

        return await _dbSet
            .Where(a => a.AppointmentTime >= startOfDay && a.AppointmentTime < endOfDay)
            .OrderBy(a => a.AppointmentTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetByCustomerIdAsync(Guid customerId)
    {
        return await _dbSet
            .Where(a => a.CustomerId == customerId)
            .OrderByDescending(a => a.AppointmentTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Where(a => a.Status == status)
            .OrderBy(a => a.AppointmentTime)
            .ToListAsync();
    }

    public async Task<Appointment?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(a => a.Customer)
            .Include(a => a.ServicePackage)
            .Include(a => a.Technician)
            .Include(a => a.Workstation)
            .Include(a => a.Payment)
            .FirstOrDefaultAsync(a => a.Id == id);
    }
}
