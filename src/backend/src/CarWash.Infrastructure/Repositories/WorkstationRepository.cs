using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class WorkstationRepository : GenericRepository<Workstation>, IWorkstationRepository
{
    public WorkstationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Workstation>> GetByTypeAsync(string type)
    {
        return await _dbSet
            .Where(w => w.Type == type)
            .ToListAsync();
    }

    public async Task<IEnumerable<Workstation>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Where(w => w.Status == status)
            .ToListAsync();
    }

    public async Task<Workstation?> GetWithCurrentAppointmentAsync(Guid id)
    {
        return await _dbSet
            .Include(w => w.CurrentAppointment)
            .Include(w => w.CurrentTechnician)
            .FirstOrDefaultAsync(w => w.Id == id);
    }
}
