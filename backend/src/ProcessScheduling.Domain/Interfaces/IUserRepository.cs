namespace ProcessScheduling.Domain.Interfaces;

public interface IUserRepository : IRepository<Entities.User>
{
    Task<Entities.User?> GetByUsernameAsync(string username);
}
