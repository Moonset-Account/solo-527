using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Infrastructure.Repositories;

namespace AgricultureTraceability.Application.Services;

public class PlotService : IPlotService
{
    private readonly IUnitOfWork _unitOfWork;

    public PlotService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<Plot>> GetAllAsync()
    {
        return await _unitOfWork.Plots.GetAllAsync();
    }

    public async Task<Plot?> GetByIdAsync(Guid id)
    {
        return await _unitOfWork.Plots.GetByIdAsync(id);
    }

    public async Task<Plot> CreateAsync(Plot plot)
    {
        plot.Id = Guid.NewGuid();
        plot.CreatedAt = DateTime.Now;
        var result = await _unitOfWork.Plots.AddAsync(plot);
        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    public async Task UpdateAsync(Plot plot)
    {
        _unitOfWork.Plots.Update(plot);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var plot = await _unitOfWork.Plots.GetByIdAsync(id);
        if (plot != null)
        {
            _unitOfWork.Plots.Delete(plot);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
