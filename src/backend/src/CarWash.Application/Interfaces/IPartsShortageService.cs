using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface IPartsShortageService
{
    Task<PartsShortageDto> CreateAsync(CreatePartsShortageRequest request, CancellationToken cancellationToken = default);
    Task<PartsShortageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<PartsShortageDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<PartsShortageDto>> GetActiveShortagesAsync(CancellationToken cancellationToken = default);
    Task<PartsShortageDto> UpdateStatusAsync(Guid id, UpdatePartsShortageStatusRequest request,
        CancellationToken cancellationToken = default);
    Task<bool> ResolveAsync(Guid id, Guid operatorId, string operatorName, CancellationToken cancellationToken = default);
}
