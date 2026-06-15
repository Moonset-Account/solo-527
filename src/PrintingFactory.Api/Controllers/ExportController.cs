
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PrintingFactory.Application.Features.Export.Queries;
using PrintingFactory.Domain.Entities;

namespace PrintingFactory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExportController : ControllerBase
{
    private readonly IMediator _mediator;

    public ExportController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("orders")]
    public async Task<IActionResult> ExportOrders(
        [FromQuery] int? storeId = null,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string format = "xlsx")
    {
        var query = new ExportOrdersQuery
        {
            StoreId = storeId,
            Status = status,
            StartDate = startDate,
            EndDate = endDate,
            ExportFormat = format
        };
        var data = await _mediator.Send(query);

        var contentType = format.ToLower() switch
        {
            "csv" => "text/csv",
            "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            _ => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        };

        var fileExtension = format.ToLower() switch
        {
            "csv" => "csv",
            "xlsx" => "xlsx",
            _ => "xlsx"
        };

        var fileName = $"订单导出_{DateTime.Now:yyyyMMddHHmmss}.{fileExtension}";

        return File(data, contentType, fileName);
    }
}
