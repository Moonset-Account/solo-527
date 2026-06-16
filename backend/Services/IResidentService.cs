
using GridEventManagement.Web.DTOs;

namespace GridEventManagement.Web.Services;

public interface IResidentService
{
    Task<PagedResultDto<ResidentDto>> GetPagedResidentsAsync(ResidentQueryDto query);
    Task<ResidentDto?> GetResidentByIdAsync(int id);
    Task<ResidentDto> CreateResidentAsync(CreateResidentDto request);
    Task<ResidentDto?> UpdateResidentAsync(int id, UpdateResidentDto request);
    Task<bool> DeleteResidentAsync(int id);
    Task<byte[]> ExportResidentsToCsvAsync(ResidentQueryDto query);
}
