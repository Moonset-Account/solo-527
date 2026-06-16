
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class FeeItemService : IFeeItemService
{
    private readonly AppDbContext _context;

    public FeeItemService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FeeItemDto>> GetByAppointmentIdAsync(int appointmentId)
    {
        return await _context.FeeItems
            .Where(f => f.AppointmentId == appointmentId)
            .OrderBy(f => f.Category)
            .Select(f => MapToDto(f))
            .ToListAsync();
    }

    public async Task<FeeItemDto> CreateAsync(FeeItemCreateDto dto)
    {
        var feeItem = new FeeItem
        {
            AppointmentId = dto.AppointmentId,
            PrescriptionId = dto.PrescriptionId,
            ItemName = dto.ItemName,
            ItemCode = dto.ItemCode,
            Category = (FeeItemCategory)dto.Category,
            UnitPrice = dto.UnitPrice,
            Quantity = dto.Quantity,
            Remark = dto.Remark,
            Status = FeeItemStatus.Unpaid,
            CreatedAt = DateTime.Now
        };

        _context.FeeItems.Add(feeItem);
        await _context.SaveChangesAsync();
        return MapToDto(feeItem);
    }

    public async Task<FeeItemDto?> UpdateStatusAsync(int id, int status)
    {
        var feeItem = await _context.FeeItems.FindAsync(id);
        if (feeItem == null) return null;

        feeItem.Status = (FeeItemStatus)status;
        feeItem.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return MapToDto(feeItem);
    }

    public async Task<decimal> GetTotalAmountByAppointmentIdAsync(int appointmentId)
    {
        return await _context.FeeItems
            .Where(f => f.AppointmentId == appointmentId)
            .SumAsync(f => f.Amount);
    }

    private static FeeItemDto MapToDto(FeeItem feeItem)
    {
        return new FeeItemDto
        {
            Id = feeItem.Id,
            AppointmentId = feeItem.AppointmentId,
            PrescriptionId = feeItem.PrescriptionId,
            ItemName = feeItem.ItemName,
            ItemCode = feeItem.ItemCode,
            Category = (int)feeItem.Category,
            CategoryText = feeItem.Category.ToString(),
            UnitPrice = feeItem.UnitPrice,
            Quantity = feeItem.Quantity,
            Amount = feeItem.Amount,
            Remark = feeItem.Remark,
            Status = (int)feeItem.Status,
            StatusText = feeItem.Status.ToString(),
            CreatedAt = feeItem.CreatedAt
        };
    }
}
