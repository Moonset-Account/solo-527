using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface IWorkstationService
{
    Task<WorkstationDto> CreateAsync(CreateWorkstationRequest request, CancellationToken cancellationToken = default);
    Task<WorkstationDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<WorkstationDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<WorkstationDto> UpdateAsync(Guid id, UpdateWorkstationRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<WorkstationDto>> GetAvailableWorkstationsAsync(CancellationToken cancellationToken = default);
    Task<WorkstationDto> UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
}
