using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Interfaces;
using MedicalAllocation.Infrastructure.Data;

namespace MedicalAllocation.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly MedicalAllocationDbContext _context;

    public UnitOfWork(MedicalAllocationDbContext context)
    {
        _context = context;
        Users = new Repository<User>(_context);
        Warehouses = new Repository<Warehouse>(_context);
        Medicines = new Repository<Medicine>(_context);
        Suppliers = new Repository<Supplier>(_context);
        MedicineBatches = new Repository<MedicineBatch>(_context);
        Inventories = new Repository<Inventory>(_context);
        ReplenishmentSuggestions = new Repository<ReplenishmentSuggestion>(_context);
        AllocationRequests = new Repository<AllocationRequest>(_context);
        SupplierReplies = new Repository<SupplierReply>(_context);
        DiscrepancyRecords = new Repository<DiscrepancyRecord>(_context);
        ExceptionRecords = new Repository<ExceptionRecord>(_context);
        StockoutRiskTrends = new Repository<StockoutRiskTrend>(_context);
        StockAlerts = new Repository<StockAlert>(_context);
    }

    public IRepository<User> Users { get; }
    public IRepository<Warehouse> Warehouses { get; }
    public IRepository<Medicine> Medicines { get; }
    public IRepository<Supplier> Suppliers { get; }
    public IRepository<MedicineBatch> MedicineBatches { get; }
    public IRepository<Inventory> Inventories { get; }
    public IRepository<ReplenishmentSuggestion> ReplenishmentSuggestions { get; }
    public IRepository<AllocationRequest> AllocationRequests { get; }
    public IRepository<SupplierReply> SupplierReplies { get; }
    public IRepository<DiscrepancyRecord> DiscrepancyRecords { get; }
    public IRepository<ExceptionRecord> ExceptionRecords { get; }
    public IRepository<StockoutRiskTrend> StockoutRiskTrends { get; }
    public IRepository<StockAlert> StockAlerts { get; }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
