using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Infrastructure.Data;

namespace AgricultureTraceability.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private bool _disposed;

    public IGenericRepository<User> Users { get; }
    public IGenericRepository<Plot> Plots { get; }
    public IGenericRepository<Variety> Varieties { get; }
    public IGenericRepository<HarvestBatch> HarvestBatches { get; }
    public IGenericRepository<EnvironmentData> EnvironmentData { get; }
    public IGenericRepository<Threshold> Thresholds { get; }
    public IGenericRepository<Alert> Alerts { get; }
    public IGenericRepository<ApplicationMaterial> ApplicationMaterials { get; }
    public IGenericRepository<Order> Orders { get; }
    public IGenericRepository<BatchOperation> BatchOperations { get; }
    public IGenericRepository<BatchOperationItem> BatchOperationItems { get; }

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Users = new GenericRepository<User>(_context);
        Plots = new GenericRepository<Plot>(_context);
        Varieties = new GenericRepository<Variety>(_context);
        HarvestBatches = new GenericRepository<HarvestBatch>(_context);
        EnvironmentData = new GenericRepository<EnvironmentData>(_context);
        Thresholds = new GenericRepository<Threshold>(_context);
        Alerts = new GenericRepository<Alert>(_context);
        ApplicationMaterials = new GenericRepository<ApplicationMaterial>(_context);
        Orders = new GenericRepository<Order>(_context);
        BatchOperations = new GenericRepository<BatchOperation>(_context);
        BatchOperationItems = new GenericRepository<BatchOperationItem>(_context);
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _context.Dispose();
        }
        _disposed = true;
    }
}
