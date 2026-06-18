using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Principal,Teacher")]
public class BatchOperationsController : ControllerBase
{
    private readonly IBatchOperationService _batchService;

    public BatchOperationsController(IBatchOperationService batchService)
    {
        _batchService = batchService;
    }

    [HttpGet]
    public async Task<ActionResult<List<BatchOperationDto>>> GetOperations([FromQuery] int? operatorId = null)
    {
        var operations = await _batchService.GetBatchOperationsAsync(operatorId);
        return Ok(operations);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BatchOperationDto>> GetOperation(Guid id)
    {
        var operation = await _batchService.GetBatchOperationAsync(id);
        if (operation == null) return NotFound();
        return Ok(operation);
    }
}
