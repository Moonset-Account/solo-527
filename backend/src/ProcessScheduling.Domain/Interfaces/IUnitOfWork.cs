namespace ProcessScheduling.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IWorkOrderRepository WorkOrders { get; }
    IEquipmentRepository Equipments { get; }
    IShiftRepository Shifts { get; }
    IUserRepository Users { get; }
    IProductionRecordRepository ProductionRecords { get; }
    IDowntimeRecordRepository DowntimeRecords { get; }
    IAnomalyReportRepository AnomalyReports { get; }
    IWorkReportRepository WorkReports { get; }
    IMoldRepository Molds { get; }
    IQCResultRepository QCResults { get; }
    IAdjustmentRecordRepository AdjustmentRecords { get; }
    IOperationLogRepository OperationLogs { get; }
    IProcessStepInstanceRepository ProcessStepInstances { get; }
    Task<int> SaveChangesAsync();
}
