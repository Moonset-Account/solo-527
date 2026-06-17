using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IApplicationMaterialService
{
    Task<IEnumerable<ApplicationMaterial>> GetMaterialsByBatchAsync(Guid batchId);
    Task<IEnumerable<ApplicationMaterial>> GetAllMaterialsAsync(MaterialStatus? status = null, string? materialType = null);
    Task<ApplicationMaterial> CreateMaterialAsync(ApplicationMaterial material);
    Task<ApplicationMaterial?> UpdateMaterialAsync(Guid id, ApplicationMaterial material);
    Task<bool> DeleteMaterialAsync(Guid id);
    Task<MaterialStatsDto> GetMaterialStatsAsync();
}
