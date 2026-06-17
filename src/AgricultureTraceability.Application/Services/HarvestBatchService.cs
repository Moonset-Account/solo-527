using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Infrastructure.Data;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AgricultureTraceability.Application.Services;

public class HarvestBatchService : IHarvestBatchService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _context;
    private readonly IQrCodeService _qrCodeService;

    public HarvestBatchService(
        IUnitOfWork unitOfWork,
        AppDbContext context,
        IQrCodeService qrCodeService)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _qrCodeService = qrCodeService;
    }

    public async Task<IEnumerable<HarvestBatch>> GetAllBatchesAsync(
        string? batchNumber = null,
        Guid? plotId = null,
        Guid? varietyId = null,
        BatchStatus? status = null)
    {
        IQueryable<HarvestBatch> query = _context.HarvestBatches
            .Include(h => h.Plot)
            .Include(h => h.Variety);

        if (!string.IsNullOrEmpty(batchNumber))
        {
            query = query.Where(h => h.BatchNumber!.Contains(batchNumber));
        }

        if (plotId.HasValue)
        {
            query = query.Where(h => h.PlotId == plotId.Value);
        }

        if (varietyId.HasValue)
        {
            query = query.Where(h => h.VarietyId == varietyId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(h => h.Status == status.Value);
        }

        return await query.OrderByDescending(h => h.CreatedAt).ToListAsync();
    }

    public async Task<(IEnumerable<HarvestBatch> Items, int TotalCount)> GetPagedBatchesAsync(
        int pageIndex,
        int pageSize,
        string? batchNumber = null,
        Guid? plotId = null,
        Guid? varietyId = null,
        BatchStatus? status = null)
    {
        IQueryable<HarvestBatch> query = _context.HarvestBatches
            .Include(h => h.Plot)
            .Include(h => h.Variety);

        if (!string.IsNullOrEmpty(batchNumber))
        {
            query = query.Where(h => h.BatchNumber!.Contains(batchNumber));
        }

        if (plotId.HasValue)
        {
            query = query.Where(h => h.PlotId == plotId.Value);
        }

        if (varietyId.HasValue)
        {
            query = query.Where(h => h.VarietyId == varietyId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(h => h.Status == status.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(h => h.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<HarvestBatch> CreateBatchAsync(HarvestBatch batch)
    {
        batch.Id = Guid.NewGuid();
        batch.BatchNumber = await GenerateBatchNumberAsync();
        batch.CreatedAt = DateTime.Now;
        batch.Status = BatchStatus.Pending;

        batch.QrCode = await _qrCodeService.GenerateQrContentAsync(batch);

        var result = await _unitOfWork.HarvestBatches.AddAsync(batch);
        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    public async Task<byte[]> GenerateQrCodeAsync(Guid batchId)
    {
        var batch = await _unitOfWork.HarvestBatches.GetByIdAsync(batchId);
        if (batch == null)
        {
            throw new KeyNotFoundException($"批次 {batchId} 不存在");
        }

        if (string.IsNullOrEmpty(batch.QrCode))
        {
            batch.QrCode = await _qrCodeService.GenerateQrContentAsync(batch);
            _unitOfWork.HarvestBatches.Update(batch);
            await _unitOfWork.SaveChangesAsync();
        }

        return await _qrCodeService.GenerateQrImageAsync(batch.QrCode);
    }

    public async Task<HarvestBatch?> GetByIdAsync(Guid id)
    {
        return await _context.HarvestBatches
            .Include(h => h.Plot)
            .Include(h => h.Variety)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    private async Task<string> GenerateBatchNumberAsync()
    {
        var datePart = DateTime.Now.ToString("yyyyMMdd");
        var prefix = $"HB{datePart}";

        var todayBatches = await _context.HarvestBatches
            .Where(h => h.BatchNumber!.StartsWith(prefix))
            .Select(h => h.BatchNumber)
            .ToListAsync();

        var maxSeq = 0;
        foreach (var bn in todayBatches)
        {
            var seqPart = bn!.Substring(prefix.Length);
            if (int.TryParse(seqPart, out var seq) && seq > maxSeq)
            {
                maxSeq = seq;
            }
        }

        return $"{prefix}{(maxSeq + 1).ToString("D3")}";
    }
}
