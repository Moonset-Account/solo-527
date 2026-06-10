using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface IWorkstationRepository : IGenericRepository<Workstation>
{
    Task<IEnumerable<Workstation>> GetByTypeAsync(string type);
    Task<IEnumerable<Workstation>> GetByStatusAsync(string status);
    Task<Workstation?> GetWithCurrentAppointmentAsync(Guid id);
}
