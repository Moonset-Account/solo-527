using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Infrastructure.Repositories;

namespace AgricultureTraceability.Application.Services;

public class ApplicationMaterialService : IApplicationMaterialService
{
    private readonly IUnitOfWork _unitOfWork;

    public ApplicationMaterialService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ApplicationMaterial>> GetAllAsync()
    {
        return await _unitOfWork.ApplicationMaterials.GetAllAsync();
    }

    public async Task<ApplicationMaterial?> GetByIdAsync(Guid id)
    {
        return await _unitOfWork.ApplicationMaterials.GetByIdAsync(id);
    }

    public async Task<Dictionary<string, int>> GetMaterialStatsAsync()
    {
        var all = await _unitOfWork.ApplicationMaterials.GetAllAsync();
        var list = all.ToList();

        return new Dictionary<string, int>
        {
            [nameof(MaterialStatus.Missing)] = list.Count(m => m.Status == MaterialStatus.Missing),
            [nameof(MaterialStatus.Submitted)] = list.Count(m => m.Status == MaterialStatus.Submitted),
            [nameof(MaterialStatus.Approved)] = list.Count(m => m.Status == MaterialStatus.Approved),
            [nameof(MaterialStatus.Rejected)] = list.Count(m => m.Status == MaterialStatus.Rejected),
            ["Total"] = list.Count
        };
    }

    public async Task<ApplicationMaterial> CreateAsync(ApplicationMaterial material)
    {
        material.Id = Guid.NewGuid();
        material.CreatedAt = DateTime.Now;
        material.ApplicationDate = DateTime.Now;
        var result = await _unitOfWork.ApplicationMaterials.AddAsync(material);
        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    public async Task UpdateAsync(ApplicationMaterial material)
    {
        material.ApplicationDate = DateTime.Now;
        _unitOfWork.ApplicationMaterials.Update(material);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var material = await _unitOfWork.ApplicationMaterials.GetByIdAsync(id);
        if (material != null)
        {
            _unitOfWork.ApplicationMaterials.Delete(material);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
