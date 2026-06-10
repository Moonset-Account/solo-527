using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class MemberPackageRepository : GenericRepository<MemberPackage>, IMemberPackageRepository
{
    public MemberPackageRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<MemberPackage?> GetByCustomerIdAsync(Guid customerId)
    {
        return await _dbSet.FirstOrDefaultAsync(mp => mp.CustomerId == customerId);
    }
}
