using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface ITechnicianRepository : IGenericRepository<Technician>
{
    Task<IEnumerable<Technician>> GetByStatusAsync(string status);
    Task<Technician?> GetWithCurrentWorkAsync(Guid id);
}
