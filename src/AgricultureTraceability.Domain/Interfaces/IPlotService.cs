using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IPlotService
{
    Task<IEnumerable<Plot>> GetAllPlotsAsync();
    Task<Plot?> GetPlotByIdAsync(Guid id);
    Task<Plot> CreatePlotAsync(Plot plot);
    Task<Plot?> UpdatePlotAsync(Guid id, Plot plot);
    Task<bool> DeletePlotAsync(Guid id);
}
