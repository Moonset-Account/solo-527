namespace ProcessScheduling.Domain.Interfaces;

public interface IShiftRepository : IRepository<Entities.Shift>
{
    Task<IEnumerable<Entities.Shift>> GetActiveShiftsAsync();
    Task<Entities.Shift?> GetWithMembersAsync(Guid id);
    Task<IEnumerable<Entities.ShiftPerformance>> GetPerformancesAsync(Guid shiftId, DateTime startDate, DateTime endDate);
}
