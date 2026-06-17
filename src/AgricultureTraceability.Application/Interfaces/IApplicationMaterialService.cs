using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Application.Interfaces;

public interface IApplicationMaterialService
{
    Task<IEnumerable<ApplicationMaterial>> GetAllAsync();
    Task<ApplicationMaterial?> GetByIdAsync(Guid id);
    Task<Dictionary<string, int>> GetMaterialStatsAsync();
    Task<ApplicationMaterial> CreateAsync(ApplicationMaterial material);
    Task UpdateAsync(ApplicationMaterial material);
    Task DeleteAsync(Guid id);
}
