using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Application.Interfaces;

public interface IHarvestBatchService
{
    Task<IEnumerable<HarvestBatch>> GetAllBatchesAsync(string? batchNumber = null, Guid? plotId = null, Guid? varietyId = null, BatchStatus? status = null);
    Task<(IEnumerable<HarvestBatch> Items, int TotalCount)> GetPagedBatchesAsync(int pageIndex, int pageSize, string? batchNumber = null, Guid? plotId = null, Guid? varietyId = null, BatchStatus? status = null);
    Task<HarvestBatch> CreateBatchAsync(HarvestBatch batch);
    Task<byte[]> GenerateQrCodeAsync(Guid batchId);
    Task<HarvestBatch?> GetByIdAsync(Guid id);
}
