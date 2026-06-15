
using MediatR;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Export.Queries;

public class ExportOrdersQuery : IRequest<byte[]>
{
    public int? StoreId { get; set; }
    public OrderStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string ExportFormat { get; set; } = "xlsx";
}

public class ExportOrdersQueryHandler : IRequestHandler<ExportOrdersQuery, byte[]>
{
    private readonly PrintingFactoryDbContext _context;

    public ExportOrdersQueryHandler(PrintingFactoryDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> Handle(ExportOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders
            .Include(o => o.Store)
            .Include(o => o.ProductionProgresses)
                .ThenInclude(p => p.ProductionNode)
            .Include(o => o.DeliveryTrackings)
            .AsQueryable();

        if (request.StoreId.HasValue)
            query = query.Where(o => o.StoreId == request.StoreId.Value);

        if (request.Status.HasValue)
            query = query.Where(o => o.Status == request.Status.Value);

        if (request.StartDate.HasValue)
            query = query.Where(o => o.OrderDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(o => o.OrderDate <= request.EndDate.Value);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return request.ExportFormat.ToLower() switch
        {
            "csv" => GenerateCsv(orders),
            "xlsx" => GenerateExcel(orders),
            _ => GenerateExcel(orders)
        };
    }

    private static byte[] GenerateCsv(List<Order> orders)
    {
        using var writer = new StringWriter();
        writer.WriteLine("订单号,门店,客户名称,客户电话,产品名称,规格,数量,单位,单价,总金额,订单日期,交付日期,状态,进度,备注");

        foreach (var order in orders)
        {
            var progress = order.ProductionProgresses.Any() 
                ? $"{order.ProductionProgresses.Count(p => p.Status == ProductionStatus.Completed)}/{order.ProductionProgresses.Count}"
                : "未开始";
            
            writer.WriteLine($"{CsvEscape(order.OrderNo)},{CsvEscape(order.Store?.Name)},{CsvEscape(order.CustomerName)},{CsvEscape(order.CustomerPhone)},{CsvEscape(order.ProductName)},{CsvEscape(order.Specifications)},{order.Quantity},{CsvEscape(order.Unit)},{order.UnitPrice},{order.TotalAmount},{order.OrderDate:yyyy-MM-dd},{order.DeliveryDate:yyyy-MM-dd},{GetStatusText(order.Status)},{progress},{CsvEscape(order.Remarks)}");
        }

        return System.Text.Encoding.UTF8.GetBytes(writer.ToString());
    }

    private static string CsvEscape(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    private static string GetStatusText(OrderStatus status)
    {
        return status switch
        {
            OrderStatus.Pending => "待处理",
            OrderStatus.InProduction => "生产中",
            OrderStatus.QualityInspecting => "质检中",
            OrderStatus.QualityFailed => "质检不合格",
            OrderStatus.Completed => "已完成",
            OrderStatus.Delivered => "已交付",
            OrderStatus.Cancelled => "已取消",
            _ => "未知"
        };
    }

    private static byte[] GenerateExcel(List<Order> orders)
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("订单列表");

        var headers = new[] 
        { 
            "订单号", "门店", "客户名称", "客户电话", "产品名称", "规格", 
            "数量", "单位", "单价", "总金额", "订单日期", "交付日期", 
            "状态", "生产进度", "备注" 
        };

        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cells[1, i + 1].Value = headers[i];
            worksheet.Cells[1, i + 1].Style.Font.Bold = true;
        }

        for (int i = 0; i < orders.Count; i++)
        {
            var order = orders[i];
            var row = i + 2;
            var progress = order.ProductionProgresses.Any() 
                ? $"{order.ProductionProgresses.Count(p => p.Status == ProductionStatus.Completed)}/{order.ProductionProgresses.Count}"
                : "未开始";

            worksheet.Cells[row, 1].Value = order.OrderNo;
            worksheet.Cells[row, 2].Value = order.Store?.Name;
            worksheet.Cells[row, 3].Value = order.CustomerName;
            worksheet.Cells[row, 4].Value = order.CustomerPhone;
            worksheet.Cells[row, 5].Value = order.ProductName;
            worksheet.Cells[row, 6].Value = order.Specifications;
            worksheet.Cells[row, 7].Value = order.Quantity;
            worksheet.Cells[row, 8].Value = order.Unit;
            worksheet.Cells[row, 9].Value = order.UnitPrice;
            worksheet.Cells[row, 10].Value = order.TotalAmount;
            worksheet.Cells[row, 11].Value = order.OrderDate;
            worksheet.Cells[row, 12].Value = order.DeliveryDate;
            worksheet.Cells[row, 13].Value = GetStatusText(order.Status);
            worksheet.Cells[row, 14].Value = progress;
            worksheet.Cells[row, 15].Value = order.Remarks;
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }
}
