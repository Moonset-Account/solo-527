using ProcessScheduling.Application.DTOs;

namespace ProcessScheduling.Application.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<AdjustmentRecordDto>> GetAdjustmentHistoryAsync(string entityType, Guid entityId);
    Task<IEnumerable<MoldRecordDto>> GetMoldHistoryAsync(Guid moldId);
    Task<IEnumerable<QCResultDto>> GetQCHistoryAsync(Guid workOrderId);
    Task<IEnumerable<OperationLogDto>> GetOperationLogsAsync(DateTime startDate, DateTime endDate, string? module = null);
}
