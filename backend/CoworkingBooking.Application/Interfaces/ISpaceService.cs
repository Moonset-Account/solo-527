using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Space;

namespace CoworkingBooking.Application.Interfaces;

public interface ISpaceService
{
    Task<ApiResponse<PagedResult<SpaceDto>>> GetListAsync(SpaceQuery query);
    Task<ApiResponse<SpaceDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<SpaceDto>> CreateAsync(CreateSpaceRequest request, Guid? operatorId);
    Task<ApiResponse> UpdateAsync(Guid id, UpdateSpaceRequest request, Guid? operatorId);
    Task<ApiResponse> DeleteAsync(Guid id, Guid? operatorId);
    Task<ApiResponse> AddPriceAsync(Guid spaceId, CreateSpacePriceRequest request, Guid? operatorId);
    Task<ApiResponse> UpdatePriceStatusAsync(Guid priceId, bool isActive, Guid? operatorId);
}
