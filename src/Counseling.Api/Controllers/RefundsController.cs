using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RefundsController : ControllerBase
{
    private readonly IRefundService _refundService;

    public RefundsController(IRefundService refundService)
    {
        _refundService = refundService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<RefundRecordDto>>>> GetByStatus([FromQuery] RefundStatus? status)
    {
        List<RefundRecordDto> result;
        if (status.HasValue)
        {
            result = await _refundService.GetByStatusAsync(status.Value);
        }
        else
        {
            result = await _refundService.GetByDateRangeAsync(DateTime.Today.AddMonths(-1), DateTime.Today);
        }
        return Ok(new ApiResponse<List<RefundRecordDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<RefundRecordDto>>> GetById(int id)
    {
        var result = await _refundService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<RefundRecordDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的退款记录",
                Code = 404
            });
        }
        return Ok(new ApiResponse<RefundRecordDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("appointment/{appointmentId}")]
    public async Task<ActionResult<ApiResponse<RefundRecordDto>>> GetByAppointment(int appointmentId)
    {
        var result = await _refundService.GetByAppointmentIdAsync(appointmentId);
        if (result == null)
        {
            return NotFound(new ApiResponse<RefundRecordDto>
            {
                Success = false,
                Message = "该预约暂无退款记录",
                Code = 404
            });
        }
        return Ok(new ApiResponse<RefundRecordDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<RefundRecordDto>>> Create([FromBody] RefundCreateDto dto)
    {
        if (dto.AppointmentId <= 0)
            return BadRequest(new ApiResponse<RefundRecordDto>
            {
                Success = false,
                Message = "请选择要退款的预约",
                Code = 400
            });

        if (dto.Amount <= 0)
            return BadRequest(new ApiResponse<RefundRecordDto>
            {
                Success = false,
                Message = "退款金额必须大于0",
                Code = 400
            });

        if (string.IsNullOrWhiteSpace(dto.Reason))
            return BadRequest(new ApiResponse<RefundRecordDto>
            {
                Success = false,
                Message = "请填写退款原因，这对财务审核很重要",
                Code = 400
            });

        var result = await _refundService.CreateAsync(dto, "system");
        return Ok(new ApiResponse<RefundRecordDto>
        {
            Success = true,
            Message = "退款申请已提交，正在等待审核，我们会尽快处理",
            Code = 200,
            Data = result
        });
    }

    [HttpPost("{id}/process")]
    public async Task<ActionResult<ApiResponse>> Process(int id, [FromBody] RefundProcessDto dto)
    {
        if (!dto.IsApproved && string.IsNullOrWhiteSpace(dto.Comment))
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "拒绝退款必须填写拒绝原因，请说明具体理由",
                Code = 400
            });
        }

        await _refundService.ProcessAsync(id, dto, "system");
        var msg = dto.IsApproved ? "退款已通过审核，将在1-3个工作日内到账" : "退款已拒绝，系统会通知来访者";
        return Ok(new ApiResponse
        {
            Success = true,
            Message = msg,
            Code = 200
        });
    }

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<ApiResponse>> Complete(int id, [FromBody] string transactionId)
    {
        if (string.IsNullOrWhiteSpace(transactionId))
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "请填写交易流水号，这是财务对账的重要凭证",
                Code = 400
            });
        }

        await _refundService.CompleteAsync(id, transactionId, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "退款已完成，款项已退还",
            Code = 200
        });
    }

    [HttpGet("date-range")]
    public async Task<ActionResult<ApiResponse<List<RefundRecordDto>>>> GetByDateRange(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _refundService.GetByDateRangeAsync(startDate, endDate);
        return Ok(new ApiResponse<List<RefundRecordDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }
}
