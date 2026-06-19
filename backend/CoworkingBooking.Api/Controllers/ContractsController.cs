using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Contract;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoworkingBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;
    private readonly CurrentUserService _currentUser;

    public ContractsController(IContractService contractService, CurrentUserService currentUser)
    {
        _contractService = contractService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ContractDto>>>> GetList([FromQuery] ContractQuery query)
    {
        var result = await _contractService.GetListAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ContractDto>>> GetById(Guid id)
    {
        var result = await _contractService.GetByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance) + "," + nameof(UserRole.ConsultantManager))]
    public async Task<ActionResult<ApiResponse<ContractDto>>> Create([FromBody] CreateContractRequest request)
    {
        var result = await _contractService.CreateAsync(request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}/sign")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance))]
    public async Task<ActionResult<ApiResponse>> Sign(Guid id, [FromBody] SignContractRequest request)
    {
        var result = await _contractService.SignAsync(id, request, _currentUser.UserId!.Value);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}/terminate")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance) + "," + nameof(UserRole.LandlordManager))]
    public async Task<ActionResult<ApiResponse>> Terminate(Guid id, [FromQuery] string reason)
    {
        var result = await _contractService.TerminateAsync(id, reason, _currentUser.UserId!.Value);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("bills")]
    public async Task<ActionResult<ApiResponse<PagedResult<BillDto>>>> GetBills([FromQuery] BillQuery query)
    {
        var result = await _contractService.GetBillsAsync(query);
        return Ok(result);
    }

    [HttpGet("bills/{id}")]
    public async Task<ActionResult<ApiResponse<BillDto>>> GetBillById(Guid id)
    {
        var result = await _contractService.GetBillByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost("bills")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance))]
    public async Task<ActionResult<ApiResponse<BillDto>>> CreateBill([FromBody] CreateBillRequest request)
    {
        var result = await _contractService.CreateBillAsync(request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("bills/{billId}/pay")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance))]
    public async Task<ActionResult<ApiResponse>> PayBill(Guid billId, [FromBody] PayBillRequest request)
    {
        var result = await _contractService.PayBillAsync(billId, request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("export")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance))]
    public async Task<IActionResult> ExportContracts([FromQuery] ContractQuery query)
    {
        var result = await _contractService.ExportContractsAsync(query);
        if (!result.Success)
            return BadRequest(result);

        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"contracts_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("bills/export")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance))]
    public async Task<IActionResult> ExportBills([FromQuery] BillQuery query)
    {
        var result = await _contractService.ExportBillsAsync(query);
        if (!result.Success)
            return BadRequest(result);

        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"bills_{DateTime.Now:yyyyMMdd}.xlsx");
    }
}
