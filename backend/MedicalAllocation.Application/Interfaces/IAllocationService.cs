using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Application.Interfaces;

public interface IAllocationService
{
    Task<AllocationRequestDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<AllocationRequestDTO>> GetAllAsync(AllocationStatus? status = null, int? warehouseId = null, CancellationToken cancellationToken = default);
    Task<AllocationRequestDTO> CreateAsync(AllocationCreateDTO dto, CancellationToken cancellationToken = default);
    Task<AllocationRequestDTO?> ApproveAsync(AllocationApproveDTO dto, CancellationToken cancellationToken = default);
    Task<AllocationRequestDTO?> MarkInTransitAsync(int allocationId, int userId, CancellationToken cancellationToken = default);
    Task<AllocationRequestDTO?> ReceiveAsync(AllocationReceiveDTO dto, CancellationToken cancellationToken = default);
    Task<AllocationRequestDTO?> CancelAsync(int allocationId, int userId, string? reason = null, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<int> GetPendingApprovalCountAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<AllocationRequestDTO>> GetPendingApprovalAsync(CancellationToken cancellationToken = default);
}
