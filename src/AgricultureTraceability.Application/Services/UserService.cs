using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Infrastructure.Repositories;

namespace AgricultureTraceability.Application.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _unitOfWork.Users.GetAllAsync();
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _unitOfWork.Users.GetByIdAsync(id);
    }

    public async Task<User> CreateAsync(User user)
    {
        user.Id = Guid.NewGuid();
        user.CreatedAt = DateTime.Now;
        var result = await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    public async Task UpdateAsync(User user)
    {
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        if (user != null)
        {
            _unitOfWork.Users.Delete(user);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
