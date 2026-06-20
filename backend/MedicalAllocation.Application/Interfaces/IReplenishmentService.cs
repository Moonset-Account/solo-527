using MedicalAllocation.Application.DTOs;

namespace MedicalAllocation.Application.Interfaces;

public interface IReplenishmentService
{
    Task<ReplenishmentSuggestionDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ReplenishmentSuggestionDTO>> GetAllAsync(ReplenishmentQueryDTO? query = null, CancellationToken cancellationToken = default);
    Task<ReplenishmentSuggestionDTO> CreateAsync(CreateReplenishmentDTO dto, CancellationToken cancellationToken = default);
    Task MarkAsProcessedAsync(int id, int processedByUserId, CancellationToken cancellationToken = default);
    Task BatchMarkAsProcessedAsync(IEnumerable<int> ids, int processedByUserId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task GenerateReplenishmentSuggestionsAsync(CancellationToken cancellationToken = default);
    Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default);
}
