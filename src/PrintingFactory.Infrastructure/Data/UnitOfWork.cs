
using PrintingFactory.Domain.Interfaces;

namespace PrintingFactory.Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly PrintingFactoryDbContext _context;

    public UnitOfWork(PrintingFactoryDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
