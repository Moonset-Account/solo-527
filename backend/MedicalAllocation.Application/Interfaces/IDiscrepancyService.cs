using MedicalAllocation.Application.DTOs;

namespace MedicalAllocation.Application.Interfaces;

public interface IDiscrepancyService
{
    Task<DiscrepancyRecordDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<DiscrepancyRecordDTO>> GetAllAsync(DiscrepancyQueryDTO? query = null, CancellationToken cancellationToken = default);
    Task<DiscrepancyRecordDTO> CreateFromAllocationAsync(int allocationId, DiscrepancyRecordDTO dto, int createdByUserId, CancellationToken cancellationToken = default);
    Task<DiscrepancyRecordDTO?> ResolveAsync(DiscrepancyResolveDTO dto, CancellationToken cancellationToken = default);
    Task<DiscrepancyRecordDTO?> AssignResponsibleAsync(int discrepancyId, int responsibleUserId, int assignedByUserId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<int> GetOpenCountAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<DiscrepancyRecordDTO>> GetOpenDiscrepanciesAsync(int? responsibleUserId = null, CancellationToken cancellationToken = default);
}
