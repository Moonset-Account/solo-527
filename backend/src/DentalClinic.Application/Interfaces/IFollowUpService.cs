
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IFollowUpService
{
    Task<PagedResultDto<FollowUpDto>> GetListAsync(FollowUpQueryDto query);
    Task<FollowUpDto?> GetByIdAsync(int id);
    Task<FollowUpDto> CreateAsync(FollowUpCreateDto dto);
    Task<FollowUpDto?> UpdateAsync(int id, FollowUpUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<FollowUpDto?> CompleteAsync(int id, string result, string? remark = null);
    Task<int> GetOverdueCountAsync(int? responsiblePersonId = null);
}
