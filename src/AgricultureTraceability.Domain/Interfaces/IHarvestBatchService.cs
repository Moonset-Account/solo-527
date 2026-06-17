using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IHarvestBatchService
{
    Task<IEnumerable<HarvestBatch>> GetAllBatchesAsync(string? batchNumber = null, Guid? plotId = null, Guid? varietyId = null, BatchStatus? status = null);
    Task<HarvestBatch?> GetBatchByIdAsync(Guid id);
    Task<HarvestBatch?> GetBatchByNumberAsync(string batchNumber);
    Task<HarvestBatch> CreateBatchAsync(HarvestBatch batch);
    Task<HarvestBatch?> UpdateBatchAsync(Guid id, HarvestBatch batch);
    Task<bool> DeleteBatchAsync(Guid id);
    Task<byte[]> GenerateQrCodeAsync(Guid batchId);
    Task<PagedResult<HarvestBatch>> GetPagedBatchesAsync(int page, int pageSize, BatchFilterDto filter);
}
