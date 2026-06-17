using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Application.Interfaces;

public interface IPlotService
{
    Task<IEnumerable<Plot>> GetAllAsync();
    Task<Plot?> GetByIdAsync(Guid id);
    Task<Plot> CreateAsync(Plot plot);
    Task UpdateAsync(Plot plot);
    Task DeleteAsync(Guid id);
}
