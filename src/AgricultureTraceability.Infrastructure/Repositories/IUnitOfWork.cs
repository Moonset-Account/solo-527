using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Infrastructure.Repositories;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<User> Users { get; }
    IGenericRepository<Plot> Plots { get; }
    IGenericRepository<Variety> Varieties { get; }
    IGenericRepository<HarvestBatch> HarvestBatches { get; }
    IGenericRepository<EnvironmentData> EnvironmentData { get; }
    IGenericRepository<Threshold> Thresholds { get; }
    IGenericRepository<Alert> Alerts { get; }
    IGenericRepository<ApplicationMaterial> ApplicationMaterials { get; }
    IGenericRepository<Order> Orders { get; }
    IGenericRepository<BatchOperation> BatchOperations { get; }
    IGenericRepository<BatchOperationItem> BatchOperationItems { get; }

    Task<int> SaveChangesAsync();
}
