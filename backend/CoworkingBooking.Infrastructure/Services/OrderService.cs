using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Order;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Entities;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using OfficeOpenXml;

namespace CoworkingBooking.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IOperationLogService _logService;

    public OrderService(ApplicationDbContext context, IOperationLogService logService)
    {
        _context = context;
        _logService = logService;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<ApiResponse<PagedResult<OrderDto>>> GetListAsync(OrderQuery query)
    {
        var queryable = _context.Orders
            .Include(o => o.Contract)
            .Include(o => o.Fulfillments)
            .AsQueryable();

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(o => o.OrderNo.Contains(query.Keyword!) || o.CustomerName.Contains(query.Keyword!));

        if (query.Status.HasValue)
            queryable = queryable.Where(o => o.Status == query.Status.Value);

        if (query.ContractId.HasValue)
            queryable = queryable.Where(o => o.ContractId == query.ContractId.Value);

        if (!string.IsNullOrEmpty(query.CustomerName))
            queryable = queryable.Where(o => o.CustomerName.Contains(query.CustomerName!));

        if (query.StartDate.HasValue)
            queryable = queryable.Where(o => o.CreatedAt >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(o => o.CreatedAt <= query.EndDate.Value);

        var totalCount = await queryable.CountAsync();
        queryable = queryable.OrderByDescending(o => o.CreatedAt);

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(o => MapToDto(o))
            .ToListAsync();

        return ApiResponse<PagedResult<OrderDto>>.Ok(new PagedResult<OrderDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<OrderDto>> GetByIdAsync(Guid id)
    {
        var order = await _context.Orders
            .Include(o => o.Contract)
            .Include(o => o.Fulfillments.OrderByDescending(f => f.CreatedAt))
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return ApiResponse<OrderDto>.Fail("订单不存在", 404);

        return ApiResponse<OrderDto>.Ok(MapToDto(order));
    }

    public async Task<ApiResponse<OrderDto>> CreateAsync(CreateOrderRequest request, Guid? operatorId)
    {
        if (request.ContractId.HasValue)
        {
            var contract = await _context.LeaseContracts.FindAsync(request.ContractId.Value);
            if (contract == null)
                return ApiResponse<OrderDto>.Fail("关联合同不存在", 404);
        }

        var orderNo = $"ORD{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(100, 999)}";

        var order = new Domain.Entities.Order
        {
            Id = Guid.NewGuid(),
            OrderNo = orderNo,
            ContractId = request.ContractId,
            OrderType = request.OrderType,
            TotalAmount = request.TotalAmount,
            PaidAmount = 0,
            Status = OrderStatus.Pending,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            Remarks = request.Remarks,
            RelatedAppointmentId = request.RelatedAppointmentId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = operatorId
        };

        foreach (var f in request.Fulfillments)
        {
            order.Fulfillments.Add(new OrderFulfillment
            {
                Id = Guid.NewGuid(),
                FulfillmentNo = $"FLF{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(100, 999)}",
                Status = FulfillmentStatus.Pending,
                ItemName = f.ItemName,
                Quantity = f.Quantity,
                Amount = f.Amount,
                Remarks = f.Remarks,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        await _logService.LogAsync("订单管理", "创建订单", "Order", order.Id, orderNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse<OrderDto>.Ok(MapToDto(order), "订单创建成功");
    }

    public async Task<ApiResponse> PayAsync(Guid id, PayOrderRequest request, Guid? operatorId)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return ApiResponse.Fail("订单不存在", 404);

        if (order.Status == OrderStatus.Refunded || order.Status == OrderStatus.Cancelled)
            return ApiResponse.Fail("当前订单状态不可支付");

        var newPaid = order.PaidAmount + request.Amount;
        order.PaidAmount = newPaid;
        order.PaymentMethod = request.PaymentMethod;

        if (newPaid >= order.TotalAmount)
        {
            order.Status = OrderStatus.Fulfilling;
            order.PaidAt = DateTime.UtcNow;

            foreach (var f in order.Fulfillments)
            {
                f.Status = FulfillmentStatus.InProgress;
            }
        }
        else if (newPaid > 0)
        {
            order.Status = OrderStatus.Paid;
        }

        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _logService.LogAsync("订单管理", "支付订单", "Order", id, order.OrderNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse.Ok("支付成功");
    }

    public async Task<ApiResponse> CancelAsync(Guid id, string reason, Guid? operatorId)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return ApiResponse.Fail("订单不存在", 404);

        if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Refunded || order.Status == OrderStatus.Cancelled)
            return ApiResponse.Fail("当前订单状态不可取消");

        order.Status = OrderStatus.Cancelled;
        order.Remarks = string.IsNullOrEmpty(order.Remarks) ? reason : $"{order.Remarks}; {reason}";
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _logService.LogAsync("订单管理", "取消订单", "Order", id, order.OrderNo, afterData: reason);

        return ApiResponse.Ok("订单已取消");
    }

    public async Task<ApiResponse> UpdateFulfillmentAsync(Guid orderId, Guid fulfillmentId, UpdateFulfillmentRequest request, Guid? operatorId)
    {
        var fulfillment = await _context.OrderFulfillments.FirstOrDefaultAsync(f => f.Id == fulfillmentId && f.OrderId == orderId);
        if (fulfillment == null)
            return ApiResponse.Fail("履约记录不存在", 404);

        fulfillment.Status = request.Status;
        fulfillment.Handler = request.Handler;
        fulfillment.Remarks = request.Remarks;
        fulfillment.ExceptionReason = request.ExceptionReason;

        if (request.Status == FulfillmentStatus.Delivered)
            fulfillment.DeliveredAt = DateTime.UtcNow;
        if (request.Status == FulfillmentStatus.Received)
            fulfillment.ReceivedAt = DateTime.UtcNow;

        fulfillment.UpdatedAt = DateTime.UtcNow;

        var order = await _context.Orders.FindAsync(orderId);
        if (order != null && order.Fulfillments.All(f => f.Status == FulfillmentStatus.Received))
        {
            order.Status = OrderStatus.Completed;
            order.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        await _logService.LogAsync("订单管理", "更新履约", "Fulfillment", fulfillmentId, fulfillment.ItemName, afterData: JsonSerializer.Serialize(request));

        return ApiResponse.Ok("履约状态更新成功");
    }

    public async Task<ApiResponse<byte[]>> ExportOrdersAsync(OrderQuery query)
    {
        query.PageSize = 10000;
        var result = await GetListAsync(query);

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("订单");

        worksheet.Cells[1, 1].Value = "订单编号";
        worksheet.Cells[1, 2].Value = "客户姓名";
        worksheet.Cells[1, 3].Value = "订单类型";
        worksheet.Cells[1, 4].Value = "金额";
        worksheet.Cells[1, 5].Value = "已付金额";
        worksheet.Cells[1, 6].Value = "状态";
        worksheet.Cells[1, 7].Value = "创建时间";
        worksheet.Cells[1, 8].Value = "支付时间";

        var statusMap = new Dictionary<OrderStatus, string>
        {
            { OrderStatus.Pending, "待支付" },
            { OrderStatus.Paid, "已支付" },
            { OrderStatus.Fulfilling, "履约中" },
            { OrderStatus.Completed, "已完成" },
            { OrderStatus.Refunded, "已退款" },
            { OrderStatus.Cancelled, "已取消" }
        };

        for (int i = 0; i < result.Data!.Items.Count; i++)
        {
            var item = result.Data.Items[i];
            worksheet.Cells[i + 2, 1].Value = item.OrderNo;
            worksheet.Cells[i + 2, 2].Value = item.CustomerName;
            worksheet.Cells[i + 2, 3].Value = item.OrderType;
            worksheet.Cells[i + 2, 4].Value = item.TotalAmount;
            worksheet.Cells[i + 2, 5].Value = item.PaidAmount;
            worksheet.Cells[i + 2, 6].Value = statusMap.GetValueOrDefault(item.Status, item.Status.ToString());
            worksheet.Cells[i + 2, 7].Value = item.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
            worksheet.Cells[i + 2, 8].Value = item.PaidAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "";
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
        var bytes = await package.GetAsByteArrayAsync();
        return ApiResponse<byte[]>.Ok(bytes);
    }

    private static OrderDto MapToDto(Domain.Entities.Order o)
    {
        return new OrderDto
        {
            Id = o.Id,
            OrderNo = o.OrderNo,
            ContractId = o.ContractId,
            ContractNo = o.Contract?.ContractNo,
            OrderType = o.OrderType,
            TotalAmount = o.TotalAmount,
            PaidAmount = o.PaidAmount,
            Status = o.Status,
            CustomerName = o.CustomerName,
            CustomerPhone = o.CustomerPhone,
            PaymentMethod = o.PaymentMethod,
            PaidAt = o.PaidAt,
            Remarks = o.Remarks,
            RelatedAppointmentId = o.RelatedAppointmentId,
            CreatedAt = o.CreatedAt,
            Fulfillments = o.Fulfillments.Select(f => new FulfillmentDto
            {
                Id = f.Id,
                OrderId = f.OrderId,
                FulfillmentNo = f.FulfillmentNo,
                Status = f.Status,
                ItemName = f.ItemName,
                Quantity = f.Quantity,
                Amount = f.Amount,
                DeliveredAt = f.DeliveredAt,
                ReceivedAt = f.ReceivedAt,
                Handler = f.Handler,
                Remarks = f.Remarks,
                ExceptionReason = f.ExceptionReason
            }).ToList()
        };
    }
}
