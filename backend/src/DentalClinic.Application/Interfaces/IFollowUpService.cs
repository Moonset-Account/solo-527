
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IFollowUpService
{
    Task&lt;PagedResultDto&lt;FollowUpDto&gt;&gt; GetListAsync(FollowUpQueryDto query);
    Task&lt;FollowUpDto?&gt; GetByIdAsync(int id);
    Task&lt;FollowUpDto&gt; CreateAsync(FollowUpCreateDto dto);
    Task&lt;FollowUpDto?&gt; UpdateAsync(int id, FollowUpUpdateDto dto);
    Task&lt;bool&gt; DeleteAsync(int id);
    Task&lt;FollowUpDto?&gt; CompleteAsync(int id, string result, string? remark = null);
    Task&lt;int&gt; GetOverdueCountAsync(int? responsiblePersonId = null);
}
