
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Application.Features.Delivery.Queries;
using PrintingFactory.Application.Features.Summary.Queries;

namespace PrintingFactory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SummaryController : ControllerBase
{
    private readonly IMediator _mediator;

    public SummaryController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("stores")]
    public async Task<ActionResult<List<StoreSummaryDto>>> GetStoreSummary(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = new GetStoreSummaryQuery
        {
            StartDate = startDate,
            EndDate = endDate
        };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("delivery-reminders")]
    public async Task<ActionResult<List<DeliveryReminderDto>>> GetDeliveryReminders(
        [FromQuery] int daysAhead = 7)
    {
        var query = new GetDeliveryRemindersQuery { DaysAhead = daysAhead };
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
