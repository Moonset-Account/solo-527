using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface ITechnicianService
{
    Task<TechnicianDto> CreateAsync(CreateTechnicianRequest request, CancellationToken cancellationToken = default);
    Task<TechnicianDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<TechnicianDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TechnicianDto> UpdateAsync(Guid id, UpdateTechnicianRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<TechnicianDto>> GetAvailableTechniciansAsync(CancellationToken cancellationToken = default);
    Task<TechnicianDto> UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
}
