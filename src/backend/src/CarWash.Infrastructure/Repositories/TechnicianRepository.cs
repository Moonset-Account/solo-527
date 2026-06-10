using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class TechnicianRepository : GenericRepository<Technician>, ITechnicianRepository
{
    public TechnicianRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Technician>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Where(t => t.Status == status)
            .ToListAsync();
    }

    public async Task<Technician?> GetWithCurrentWorkAsync(Guid id)
    {
        return await _dbSet
            .Include(t => t.CurrentWorkstation)
            .Include(t => t.Appointments.Where(a => a.Status == "in_service"))
            .FirstOrDefaultAsync(t => t.Id == id);
    }
}
