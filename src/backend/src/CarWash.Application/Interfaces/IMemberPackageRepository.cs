using CarWash.Domain.Entities;

namespace CarWash.Application.Interfaces;

public interface IMemberPackageRepository : IGenericRepository<MemberPackage>
{
    Task<MemberPackage?> GetByCustomerIdAsync(Guid customerId);
}
