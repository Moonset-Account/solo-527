using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AgricultureTraceability.Application.Services;

public class ThresholdService : IThresholdService
{
    private readonly IUnitOfWork _unitOfWork;

    public ThresholdService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<Threshold>> GetAllAsync()
    {
        return await _unitOfWork.Thresholds.GetAllAsync();
    }

    public async Task<Threshold?> GetByIdAsync(Guid id)
    {
        return await _unitOfWork.Thresholds.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Threshold>> GetByPlotIdAsync(Guid? plotId)
    {
        var all = await _unitOfWork.Thresholds.GetAllAsync();
        return all.Where(t => t.PlotId == plotId).ToList();
    }

    public async Task<Threshold> CreateAsync(Threshold threshold)
    {
        threshold.Id = Guid.NewGuid();
        threshold.CreatedAt = DateTime.Now;
        var result = await _unitOfWork.Thresholds.AddAsync(threshold);
        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    public async Task UpdateAsync(Threshold threshold)
    {
        _unitOfWork.Thresholds.Update(threshold);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var threshold = await _unitOfWork.Thresholds.GetByIdAsync(id);
        if (threshold != null)
        {
            _unitOfWork.Thresholds.Delete(threshold);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
