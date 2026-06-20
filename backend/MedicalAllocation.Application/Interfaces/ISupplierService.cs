using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Application.Interfaces;

public interface ISupplierService
{
    Task<SupplierDTO?> GetSupplierByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<SupplierDTO>> GetAllSuppliersAsync(string? keyword = null, bool? isActive = null, CancellationToken cancellationToken = default);
    Task<SupplierDTO> CreateSupplierAsync(SupplierDTO dto, CancellationToken cancellationToken = default);
    Task<SupplierDTO?> UpdateSupplierAsync(SupplierDTO dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteSupplierAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ToggleSupplierActiveAsync(int id, CancellationToken cancellationToken = default);

    Task<SupplierReplyDTO?> GetReplyByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<SupplierReplyDTO>> GetRepliesAsync(SupplierReplyQueryDTO? query = null, CancellationToken cancellationToken = default);
    Task<SupplierReplyDTO> CreateReplyAsync(SupplierReplyCreateDTO dto, CancellationToken cancellationToken = default);
    Task<SupplierReplyDTO?> UpdateReplyStatusAsync(int replyId, SupplierReplyStatus status, int? userId = null, CancellationToken cancellationToken = default);
    Task<SupplierReplyDTO?> ConfirmReplyAsync(int replyId, int confirmedByUserId, CancellationToken cancellationToken = default);
    Task<SupplierReplyDTO?> RecordDelayAsync(int replyId, string delayReason, int delayDays, int? userId = null, CancellationToken cancellationToken = default);
    Task<bool> DeleteReplyAsync(int id, CancellationToken cancellationToken = default);
    Task<int> GetPendingReplyCountAsync(CancellationToken cancellationToken = default);
}
