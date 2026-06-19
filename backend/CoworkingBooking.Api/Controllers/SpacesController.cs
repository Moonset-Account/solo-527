using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Space;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoworkingBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpacesController : ControllerBase
{
    private readonly ISpaceService _spaceService;
    private readonly CurrentUserService _currentUser;

    public SpacesController(ISpaceService spaceService, CurrentUserService currentUser)
    {
        _spaceService = spaceService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PagedResult<SpaceDto>>>> GetList([FromQuery] SpaceQuery query)
    {
        var result = await _spaceService.GetListAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SpaceDto>>> GetById(Guid id)
    {
        var result = await _spaceService.GetByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.ConsultantManager) + "," + nameof(UserRole.LandlordManager))]
    public async Task<ActionResult<ApiResponse<SpaceDto>>> Create([FromBody] CreateSpaceRequest request)
    {
        var result = await _spaceService.CreateAsync(request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.ConsultantManager) + "," + nameof(UserRole.LandlordManager))]
    public async Task<ActionResult<ApiResponse>> Update(Guid id, [FromBody] UpdateSpaceRequest request)
    {
        var result = await _spaceService.UpdateAsync(id, request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.LandlordManager))]
    public async Task<ActionResult<ApiResponse>> Delete(Guid id)
    {
        var result = await _spaceService.DeleteAsync(id, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{spaceId}/prices")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance) + "," + nameof(UserRole.LandlordManager))]
    public async Task<ActionResult<ApiResponse>> AddPrice(Guid spaceId, [FromBody] CreateSpacePriceRequest request)
    {
        var result = await _spaceService.AddPriceAsync(spaceId, request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("prices/{priceId}/status")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance) + "," + nameof(UserRole.LandlordManager))]
    public async Task<ActionResult<ApiResponse>> UpdatePriceStatus(Guid priceId, [FromQuery] bool isActive)
    {
        var result = await _spaceService.UpdatePriceStatusAsync(priceId, isActive, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}
