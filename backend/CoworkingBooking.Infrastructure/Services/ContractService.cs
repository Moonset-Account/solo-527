using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Contract;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Entities;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using OfficeOpenXml;

namespace CoworkingBooking.Infrastructure.Services;

public class ContractService : IContractService
{
    private readonly ApplicationDbContext _context;
    private readonly IOperationLogService _logService;
    private readonly CurrentUserService _currentUser;

    public ContractService(ApplicationDbContext context, IOperationLogService logService, CurrentUserService currentUser)
    {
        _context = context;
        _logService = logService;
        _currentUser = currentUser;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<ApiResponse<PagedResult<ContractDto>>> GetListAsync(ContractQuery query)
    {
        var queryable = _context.LeaseContracts
            .Include(c => c.Space)
            .Include(c => c.Bills)
            .AsQueryable();

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(c => c.ContractNo.Contains(query.Keyword!) || c.TenantName.Contains(query.Keyword!) || c.TenantPhone.Contains(query.Keyword!));

        if (query.Status.HasValue)
            queryable = queryable.Where(c => c.Status == query.Status.Value);

        if (query.SpaceId.HasValue)
            queryable = queryable.Where(c => c.SpaceId == query.SpaceId.Value);

        if (!string.IsNullOrEmpty(query.TenantName))
            queryable = queryable.Where(c => c.TenantName.Contains(query.TenantName!));

        if (query.StartDate.HasValue)
            queryable = queryable.Where(c => c.StartDate >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(c => c.EndDate <= query.EndDate.Value);

        var totalCount = await queryable.CountAsync();
        queryable = queryable.OrderByDescending(c => c.CreatedAt);

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(c => MapContractToDto(c))
            .ToListAsync();

        return ApiResponse<PagedResult<ContractDto>>.Ok(new PagedResult<ContractDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<ContractDto>> GetByIdAsync(Guid id)
    {
        var contract = await _context.LeaseContracts
            .Include(c => c.Space)
            .Include(c => c.Bills.OrderByDescending(b => b.BillingDate))
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contract == null)
            return ApiResponse<ContractDto>.Fail("合同不存在", 404);

        return ApiResponse<ContractDto>.Ok(MapContractToDto(contract));
    }

    public async Task<ApiResponse<ContractDto>> CreateAsync(CreateContractRequest request, Guid? operatorId)
    {
        var space = await _context.CoworkingSpaces.FindAsync(request.SpaceId);
        if (space == null)
            return ApiResponse<ContractDto>.Fail("房源不存在", 404);

        var contractNo = $"CT{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(100, 999)}";

        var contract = new LeaseContract
        {
            Id = Guid.NewGuid(),
            ContractNo = contractNo,
            SpaceId = request.SpaceId,
            TenantName = request.TenantName,
            TenantPhone = request.TenantPhone,
            TenantIdCard = request.TenantIdCard,
            TenantCompany = request.TenantCompany,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MonthlyRent = request.MonthlyRent,
            DepositAmount = request.DepositAmount,
            PaymentMonths = request.PaymentMonths,
            PaymentMethod = request.PaymentMethod,
            Status = ContractStatus.Draft,
            Terms = request.Terms,
            SpecialClauses = request.SpecialClauses,
            RelatedAppointmentId = request.RelatedAppointmentId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = operatorId
        };

        _context.LeaseContracts.Add(contract);

        var months = (request.EndDate.Year - request.StartDate.Year) * 12 + (request.EndDate.Month - request.StartDate.Month);
        for (int i = 0; i <= months; i++)
        {
            var billDate = request.StartDate.AddMonths(i);
            var bill = new Bill
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                BillNo = $"BL{billDate:yyyyMMdd}{new Random().Next(100, 999)}",
                BillType = "月租",
                Amount = request.MonthlyRent,
                PaidAmount = 0,
                Status = BillStatus.Unpaid,
                BillingDate = billDate,
                DueDate = billDate.AddDays(7),
                Period = $"{billDate:yyyy-MM}",
                TenantName = request.TenantName,
                CreatedAt = DateTime.UtcNow
            };
            contract.Bills.Add(bill);
        }

        if (request.DepositAmount > 0)
        {
            contract.Bills.Add(new Bill
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                BillNo = $"BL{DateTime.Now:yyyyMMddHHmm}{new Random().Next(10, 99)}",
                BillType = "押金",
                Amount = request.DepositAmount,
                PaidAmount = 0,
                Status = BillStatus.Unpaid,
                BillingDate = request.StartDate,
                DueDate = request.StartDate.AddDays(7),
                Period = "押金",
                TenantName = request.TenantName,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        await _logService.LogAsync("合同管理", "创建合同", "Contract", contract.Id, contractNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse<ContractDto>.Ok(MapContractToDto(contract), "合同创建成功");
    }

    public async Task<ApiResponse> SignAsync(Guid id, SignContractRequest request, Guid operatorId)
    {
        var contract = await _context.LeaseContracts.FindAsync(id);
        if (contract == null)
            return ApiResponse.Fail("合同不存在", 404);

        if (contract.Status != ContractStatus.Draft && contract.Status != ContractStatus.PendingSignature)
            return ApiResponse.Fail("当前合同状态不可签署");

        var user = await _context.Users.FindAsync(operatorId);

        contract.Status = ContractStatus.Active;
        contract.SignedAt = DateTime.UtcNow;
        contract.SignedById = operatorId;
        contract.SignedByName = user?.RealName ?? "Unknown";
        contract.ContractFile = request.ContractFile;
        contract.UpdatedAt = DateTime.UtcNow;

        var space = await _context.CoworkingSpaces.FindAsync(contract.SpaceId);
        if (space != null)
        {
            space.Status = SpaceStatus.Rented;
            space.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        await _logService.LogAsync("合同管理", "签署合同", "Contract", id, contract.ContractNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse.Ok("合同签署成功");
    }

    public async Task<ApiResponse> TerminateAsync(Guid id, string reason, Guid operatorId)
    {
        var contract = await _context.LeaseContracts.FindAsync(id);
        if (contract == null)
            return ApiResponse.Fail("合同不存在", 404);

        if (contract.Status != ContractStatus.Active)
            return ApiResponse.Fail("只有生效中的合同可以终止");

        contract.Status = ContractStatus.Terminated;
        contract.UpdatedAt = DateTime.UtcNow;

        var space = await _context.CoworkingSpaces.FindAsync(contract.SpaceId);
        if (space != null)
        {
            space.Status = SpaceStatus.Available;
            space.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        await _logService.LogAsync("合同管理", "终止合同", "Contract", id, contract.ContractNo, afterData: reason);

        return ApiResponse.Ok("合同已终止");
    }

    public async Task<ApiResponse<PagedResult<BillDto>>> GetBillsAsync(BillQuery query)
    {
        var queryable = _context.Bills.AsQueryable();

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(b => b.BillNo.Contains(query.Keyword!) || b.TenantName!.Contains(query.Keyword!));

        if (query.Status.HasValue)
            queryable = queryable.Where(b => b.Status == query.Status.Value);

        if (query.ContractId.HasValue)
            queryable = queryable.Where(b => b.ContractId == query.ContractId.Value);

        if (!string.IsNullOrEmpty(query.TenantName))
            queryable = queryable.Where(b => b.TenantName!.Contains(query.TenantName!));

        if (query.StartDate.HasValue)
            queryable = queryable.Where(b => b.BillingDate >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(b => b.BillingDate <= query.EndDate.Value);

        var totalCount = await queryable.CountAsync();
        queryable = queryable.OrderByDescending(b => b.BillingDate);

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(b => new BillDto
            {
                Id = b.Id,
                BillNo = b.BillNo,
                ContractId = b.ContractId,
                BillType = b.BillType,
                Amount = b.Amount,
                PaidAmount = b.PaidAmount,
                Status = b.Status,
                BillingDate = b.BillingDate,
                DueDate = b.DueDate,
                PaidAt = b.PaidAt,
                Period = b.Period,
                Remarks = b.Remarks,
                PaymentMethod = b.PaymentMethod,
                TenantName = b.TenantName
            })
            .ToListAsync();

        return ApiResponse<PagedResult<BillDto>>.Ok(new PagedResult<BillDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<BillDto>> GetBillByIdAsync(Guid id)
    {
        var bill = await _context.Bills.FirstOrDefaultAsync(b => b.Id == id);
        if (bill == null)
            return ApiResponse<BillDto>.Fail("账单不存在", 404);

        return ApiResponse<BillDto>.Ok(new BillDto
        {
            Id = bill.Id,
            BillNo = bill.BillNo,
            ContractId = bill.ContractId,
            BillType = bill.BillType,
            Amount = bill.Amount,
            PaidAmount = bill.PaidAmount,
            Status = bill.Status,
            BillingDate = bill.BillingDate,
            DueDate = bill.DueDate,
            PaidAt = bill.PaidAt,
            Period = bill.Period,
            Remarks = bill.Remarks,
            PaymentMethod = bill.PaymentMethod,
            TenantName = bill.TenantName
        });
    }

    public async Task<ApiResponse<BillDto>> CreateBillAsync(CreateBillRequest request, Guid? operatorId)
    {
        var contract = await _context.LeaseContracts.FindAsync(request.ContractId);
        if (contract == null)
            return ApiResponse<BillDto>.Fail("合同不存在", 404);

        var billNo = $"BL{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(100, 999)}";

        var bill = new Bill
        {
            Id = Guid.NewGuid(),
            ContractId = request.ContractId,
            BillNo = billNo,
            BillType = request.BillType,
            Amount = request.Amount,
            PaidAmount = 0,
            Status = BillStatus.Unpaid,
            BillingDate = request.BillingDate,
            DueDate = request.DueDate,
            Period = request.Period,
            Remarks = request.Remarks,
            TenantName = contract.TenantName,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = operatorId
        };

        _context.Bills.Add(bill);
        await _context.SaveChangesAsync();
        await _logService.LogAsync("账单管理", "创建账单", "Bill", bill.Id, billNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse<BillDto>.Ok(new BillDto
        {
            Id = bill.Id,
            BillNo = bill.BillNo,
            ContractId = bill.ContractId,
            BillType = bill.BillType,
            Amount = bill.Amount,
            PaidAmount = bill.PaidAmount,
            Status = bill.Status,
            BillingDate = bill.BillingDate,
            DueDate = bill.DueDate,
            Period = bill.Period,
            Remarks = bill.Remarks,
            TenantName = bill.TenantName
        }, "账单创建成功");
    }

    public async Task<ApiResponse> PayBillAsync(Guid billId, PayBillRequest request, Guid? operatorId)
    {
        var bill = await _context.Bills.FindAsync(billId);
        if (bill == null)
            return ApiResponse.Fail("账单不存在", 404);

        if (bill.Status == BillStatus.Paid || bill.Status == BillStatus.Void)
            return ApiResponse.Fail("当前账单状态不可支付");

        var newPaidAmount = bill.PaidAmount + request.Amount;
        bill.PaidAmount = newPaidAmount;
        bill.PaymentMethod = request.PaymentMethod;

        if (newPaidAmount >= bill.Amount)
        {
            bill.Status = BillStatus.Paid;
            bill.PaidAt = DateTime.UtcNow;
        }
        else if (newPaidAmount > 0)
        {
            bill.Status = BillStatus.PartialPaid;
        }

        if (DateTime.UtcNow > bill.DueDate && bill.Status == BillStatus.Unpaid)
            bill.Status = BillStatus.Overdue;

        bill.UpdatedAt = DateTime.UtcNow;
        bill.UpdatedBy = operatorId;

        await _context.SaveChangesAsync();
        await _logService.LogAsync("账单管理", "支付账单", "Bill", billId, bill.BillNo, afterData: JsonSerializer.Serialize(request));

        return ApiResponse.Ok("支付成功");
    }

    public async Task<ApiResponse<byte[]>> ExportContractsAsync(ContractQuery query)
    {
        query.PageSize = 10000;
        var result = await GetListAsync(query);

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("租约合同");

        worksheet.Cells[1, 1].Value = "合同编号";
        worksheet.Cells[1, 2].Value = "租客姓名";
        worksheet.Cells[1, 3].Value = "联系电话";
        worksheet.Cells[1, 4].Value = "房源";
        worksheet.Cells[1, 5].Value = "开始日期";
        worksheet.Cells[1, 6].Value = "结束日期";
        worksheet.Cells[1, 7].Value = "月租金";
        worksheet.Cells[1, 8].Value = "押金";
        worksheet.Cells[1, 9].Value = "状态";
        worksheet.Cells[1, 10].Value = "签署时间";

        var statusMap = new Dictionary<ContractStatus, string>
        {
            { ContractStatus.Draft, "草稿" },
            { ContractStatus.PendingSignature, "待签署" },
            { ContractStatus.Active, "生效中" },
            { ContractStatus.Expired, "已过期" },
            { ContractStatus.Terminated, "已终止" }
        };

        for (int i = 0; i < result.Data!.Items.Count; i++)
        {
            var item = result.Data.Items[i];
            worksheet.Cells[i + 2, 1].Value = item.ContractNo;
            worksheet.Cells[i + 2, 2].Value = item.TenantName;
            worksheet.Cells[i + 2, 3].Value = item.TenantPhone;
            worksheet.Cells[i + 2, 4].Value = item.SpaceName;
            worksheet.Cells[i + 2, 5].Value = item.StartDate.ToString("yyyy-MM-dd");
            worksheet.Cells[i + 2, 6].Value = item.EndDate.ToString("yyyy-MM-dd");
            worksheet.Cells[i + 2, 7].Value = item.MonthlyRent;
            worksheet.Cells[i + 2, 8].Value = item.DepositAmount;
            worksheet.Cells[i + 2, 9].Value = statusMap.GetValueOrDefault(item.Status, item.Status.ToString());
            worksheet.Cells[i + 2, 10].Value = item.SignedAt?.ToString("yyyy-MM-dd HH:mm") ?? "";
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
        var bytes = await package.GetAsByteArrayAsync();
        return ApiResponse<byte[]>.Ok(bytes);
    }

    public async Task<ApiResponse<byte[]>> ExportBillsAsync(BillQuery query)
    {
        query.PageSize = 10000;
        var result = await GetBillsAsync(query);

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("账单");

        worksheet.Cells[1, 1].Value = "账单编号";
        worksheet.Cells[1, 2].Value = "租客姓名";
        worksheet.Cells[1, 3].Value = "账单类型";
        worksheet.Cells[1, 4].Value = "账期";
        worksheet.Cells[1, 5].Value = "金额";
        worksheet.Cells[1, 6].Value = "已付金额";
        worksheet.Cells[1, 7].Value = "状态";
        worksheet.Cells[1, 8].Value = "账单日期";
        worksheet.Cells[1, 9].Value = "到期日期";

        var statusMap = new Dictionary<BillStatus, string>
        {
            { BillStatus.Unpaid, "未付" },
            { BillStatus.PartialPaid, "部分支付" },
            { BillStatus.Paid, "已付" },
            { BillStatus.Overdue, "逾期" },
            { BillStatus.Void, "作废" }
        };

        for (int i = 0; i < result.Data!.Items.Count; i++)
        {
            var item = result.Data.Items[i];
            worksheet.Cells[i + 2, 1].Value = item.BillNo;
            worksheet.Cells[i + 2, 2].Value = item.TenantName ?? "";
            worksheet.Cells[i + 2, 3].Value = item.BillType;
            worksheet.Cells[i + 2, 4].Value = item.Period ?? "";
            worksheet.Cells[i + 2, 5].Value = item.Amount;
            worksheet.Cells[i + 2, 6].Value = item.PaidAmount;
            worksheet.Cells[i + 2, 7].Value = statusMap.GetValueOrDefault(item.Status, item.Status.ToString());
            worksheet.Cells[i + 2, 8].Value = item.BillingDate.ToString("yyyy-MM-dd");
            worksheet.Cells[i + 2, 9].Value = item.DueDate.ToString("yyyy-MM-dd");
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
        var bytes = await package.GetAsByteArrayAsync();
        return ApiResponse<byte[]>.Ok(bytes);
    }

    private static ContractDto MapContractToDto(LeaseContract c)
    {
        return new ContractDto
        {
            Id = c.Id,
            ContractNo = c.ContractNo,
            SpaceId = c.SpaceId,
            SpaceName = c.Space?.Name ?? "",
            TenantName = c.TenantName,
            TenantPhone = c.TenantPhone,
            TenantCompany = c.TenantCompany,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            MonthlyRent = c.MonthlyRent,
            DepositAmount = c.DepositAmount,
            PaymentMonths = c.PaymentMonths,
            PaymentMethod = c.PaymentMethod,
            Status = c.Status,
            SignedAt = c.SignedAt,
            SignedByName = c.SignedByName,
            ContractFile = c.ContractFile,
            Terms = c.Terms,
            SpecialClauses = c.SpecialClauses,
            CreatedAt = c.CreatedAt,
            Bills = c.Bills.Select(b => new BillDto
            {
                Id = b.Id,
                BillNo = b.BillNo,
                ContractId = b.ContractId,
                BillType = b.BillType,
                Amount = b.Amount,
                PaidAmount = b.PaidAmount,
                Status = b.Status,
                BillingDate = b.BillingDate,
                DueDate = b.DueDate,
                PaidAt = b.PaidAt,
                Period = b.Period,
                Remarks = b.Remarks,
                PaymentMethod = b.PaymentMethod,
                TenantName = b.TenantName
            }).ToList()
        };
    }
}
