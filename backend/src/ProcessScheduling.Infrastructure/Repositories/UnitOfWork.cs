using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Data;

namespace ProcessScheduling.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(
        AppDbContext context,
        IWorkOrderRepository workOrders,
        IEquipmentRepository equipments,
        IShiftRepository shifts,
        IUserRepository users,
        IProductionRecordRepository productionRecords,
        IDowntimeRecordRepository downtimeRecords,
        IAnomalyReportRepository anomalyReports,
        IWorkReportRepository workReports,
        IMoldRepository molds,
        IQCResultRepository qCResults,
        IAdjustmentRecordRepository adjustmentRecords,
        IOperationLogRepository operationLogs,
        IProcessStepInstanceRepository processStepInstances)
    {
        _context = context;
        WorkOrders = workOrders;
        Equipments = equipments;
        Shifts = shifts;
        Users = users;
        ProductionRecords = productionRecords;
        DowntimeRecords = downtimeRecords;
        AnomalyReports = anomalyReports;
        WorkReports = workReports;
        Molds = molds;
        QCResults = qCResults;
        AdjustmentRecords = adjustmentRecords;
        OperationLogs = operationLogs;
        ProcessStepInstances = processStepInstances;
    }

    public IWorkOrderRepository WorkOrders { get; }
    public IEquipmentRepository Equipments { get; }
    public IShiftRepository Shifts { get; }
    public IUserRepository Users { get; }
    public IProductionRecordRepository ProductionRecords { get; }
    public IDowntimeRecordRepository DowntimeRecords { get; }
    public IAnomalyReportRepository AnomalyReports { get; }
    public IWorkReportRepository WorkReports { get; }
    public IMoldRepository Molds { get; }
    public IQCResultRepository QCResults { get; }
    public IAdjustmentRecordRepository AdjustmentRecords { get; }
    public IOperationLogRepository OperationLogs { get; }
    public IProcessStepInstanceRepository ProcessStepInstances { get; }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
