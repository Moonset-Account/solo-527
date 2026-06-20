
using System.Linq.Expressions;

namespace TicketCounter.Application.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
    Task<IEnumerable<T>> GetPagedAsync(int pageNumber, int pageSize, Expression<Func<T, bool>>? predicate = null, Expression<Func<T, object>>? orderBy = null, bool ascending = true);
}

public interface IUnitOfWork : IDisposable
{
    IRepository<Domain.Entities.Session> Sessions { get; }
    IRepository<Domain.Entities.Seat> Seats { get; }
    IRepository<Domain.Entities.TicketStock> TicketStocks { get; }
    IRepository<Domain.Entities.Registration> Registrations { get; }
    IRepository<Domain.Entities.RegistrationAudit> RegistrationAudits { get; }
    IRepository<Domain.Entities.OperationLog> OperationLogs { get; }
    IRepository<Domain.Entities.TodoItem> TodoItems { get; }
    IRepository<Domain.Entities.ApiRetryRecord> ApiRetryRecords { get; }
    IRepository<Domain.Entities.InventoryOccupancy> InventoryOccupancies { get; }
    Task<int> SaveChangesAsync();
}
