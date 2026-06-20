using MedicalAllocation.Domain.Entities;

namespace MedicalAllocation.Domain.Interfaces;

public interface IUnitOfWork
{
    IRepository<User> Users { get; }
    IRepository<Warehouse> Warehouses { get; }
    IRepository<Medicine> Medicines { get; }
    IRepository<Supplier> Suppliers { get; }
    IRepository<MedicineBatch> MedicineBatches { get; }
    IRepository<Inventory> Inventories { get; }
    IRepository<ReplenishmentSuggestion> ReplenishmentSuggestions { get; }
    IRepository<AllocationRequest> AllocationRequests { get; }
    IRepository<SupplierReply> SupplierReplies { get; }
    IRepository<DiscrepancyRecord> DiscrepancyRecords { get; }
    IRepository<ExceptionRecord> ExceptionRecords { get; }
    IRepository<StockoutRiskTrend> StockoutRiskTrends { get; }
    IRepository<StockAlert> StockAlerts { get; }

    Task<int> SaveChangesAsync();
}
