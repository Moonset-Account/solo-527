
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TicketCounter.Application.Interfaces;
using TicketCounter.Infrastructure.Data;

namespace TicketCounter.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = _context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public async Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities)
    {
        await _dbSet.AddRangeAsync(entities);
        return entities;
    }

    public Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null ? await _dbSet.CountAsync() : await _dbSet.CountAsync(predicate);
    }

    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }

    public async Task<IEnumerable<T>> GetPagedAsync(int pageNumber, int pageSize,
        Expression<Func<T, bool>>? predicate = null,
        Expression<Func<T, object>>? orderBy = null, bool ascending = true)
    {
        var query = _dbSet.AsQueryable();
        if (predicate != null) query = query.Where(predicate);
        if (orderBy != null)
            query = ascending ? query.OrderBy(orderBy) : query.OrderByDescending(orderBy);
        return await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
    }
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Sessions = new Repository<Domain.Entities.Session>(_context);
        Seats = new Repository<Domain.Entities.Seat>(_context);
        TicketStocks = new Repository<Domain.Entities.TicketStock>(_context);
        Registrations = new Repository<Domain.Entities.Registration>(_context);
        RegistrationAudits = new Repository<Domain.Entities.RegistrationAudit>(_context);
        OperationLogs = new Repository<Domain.Entities.OperationLog>(_context);
        TodoItems = new Repository<Domain.Entities.TodoItem>(_context);
        ApiRetryRecords = new Repository<Domain.Entities.ApiRetryRecord>(_context);
        InventoryOccupancies = new Repository<Domain.Entities.InventoryOccupancy>(_context);
    }

    public IRepository<Domain.Entities.Session> Sessions { get; }
    public IRepository<Domain.Entities.Seat> Seats { get; }
    public IRepository<Domain.Entities.TicketStock> TicketStocks { get; }
    public IRepository<Domain.Entities.Registration> Registrations { get; }
    public IRepository<Domain.Entities.RegistrationAudit> RegistrationAudits { get; }
    public IRepository<Domain.Entities.OperationLog> OperationLogs { get; }
    public IRepository<Domain.Entities.TodoItem> TodoItems { get; }
    public IRepository<Domain.Entities.ApiRetryRecord> ApiRetryRecords { get; }
    public IRepository<Domain.Entities.InventoryOccupancy> InventoryOccupancies { get; }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
