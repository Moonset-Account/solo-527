
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class ScheduleSlotService : IScheduleSlotService
{
    private readonly AppDbContext _context;

    public ScheduleSlotService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ScheduleSlotDto>> GetListAsync(ScheduleSlotQueryDto query)
    {
        var queryable = _context.ScheduleSlots
            .Include(s => s.Doctor)
            .Include(s => s.Clinic)
            .AsQueryable();

        if (query.ClinicId.HasValue)
            queryable = queryable.Where(s => s.ClinicId == query.ClinicId.Value);
        if (query.DoctorId.HasValue)
            queryable = queryable.Where(s => s.DoctorId == query.DoctorId.Value);
        if (query.StartDate.HasValue)
            queryable = queryable.Where(s => s.Date.Date >= query.StartDate.Value.Date);
        if (query.EndDate.HasValue)
            queryable = queryable.Where(s => s.Date.Date <= query.EndDate.Value.Date);
        if (query.Status.HasValue)
            queryable = queryable.Where(s => s.Status == (ScheduleSlotStatus)query.Status.Value);

        return await queryable
            .OrderBy(s => s.Date)
            .ThenBy(s => s.StartTime)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<ScheduleSlotDto?> GetByIdAsync(int id)
    {
        var slot = await _context.ScheduleSlots
            .Include(s => s.Doctor)
            .Include(s => s.Clinic)
            .FirstOrDefaultAsync(s => s.Id == id);
        return slot == null ? null : MapToDto(slot);
    }

    public async Task<ScheduleSlotDto> CreateAsync(ScheduleSlotCreateDto dto)
    {
        var slot = new ScheduleSlot
        {
            DoctorId = dto.DoctorId,
            ClinicId = dto.ClinicId,
            Date = dto.Date,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            TotalSlots = dto.TotalSlots,
            BookedSlots = 0,
            Status = ScheduleSlotStatus.Available,
            Remark = dto.Remark,
            CreatedAt = DateTime.Now
        };

        _context.ScheduleSlots.Add(slot);
        await _context.SaveChangesAsync();
        return MapToDto(slot);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var slot = await _context.ScheduleSlots.FindAsync(id);
        if (slot == null) return false;

        slot.Status = ScheduleSlotStatus.Closed;
        slot.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ScheduleSlotDto>> GetAvailableSlotsAsync(int doctorId, DateTime date)
    {
        return await _context.ScheduleSlots
            .Include(s => s.Doctor)
            .Where(s => s.DoctorId == doctorId 
                && s.Date.Date == date.Date 
                && s.Status != ScheduleSlotStatus.Closed
                && s.AvailableSlots > 0)
            .OrderBy(s => s.StartTime)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<List<ScheduleSlotDto>> GetSlotsByDateRangeAsync(int? clinicId, int? doctorId, DateTime startDate, DateTime endDate)
    {
        var queryable = _context.ScheduleSlots
            .Include(s => s.Doctor)
            .Include(s => s.Clinic)
            .Where(s => s.Date.Date >= startDate.Date && s.Date.Date <= endDate.Date)
            .AsQueryable();

        if (clinicId.HasValue)
            queryable = queryable.Where(s => s.ClinicId == clinicId.Value);
        if (doctorId.HasValue)
            queryable = queryable.Where(s => s.DoctorId == doctorId.Value);

        return await queryable
            .OrderBy(s => s.Date)
            .ThenBy(s => s.StartTime)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    private static ScheduleSlotDto MapToDto(ScheduleSlot slot)
    {
        return new ScheduleSlotDto
        {
            Id = slot.Id,
            DoctorId = slot.DoctorId,
            DoctorName = slot.Doctor?.Name,
            DoctorTitle = slot.Doctor?.Title,
            ClinicId = slot.ClinicId,
            ClinicName = slot.Clinic?.Name,
            Date = slot.Date,
            DateText = slot.Date.ToString("yyyy-MM-dd"),
            StartTime = slot.StartTime,
            StartTimeText = slot.StartTime.ToString(@"hh\:mm"),
            EndTime = slot.EndTime,
            EndTimeText = slot.EndTime.ToString(@"hh\:mm"),
            TotalSlots = slot.TotalSlots,
            BookedSlots = slot.BookedSlots,
            AvailableSlots = slot.AvailableSlots,
            Status = (int)slot.Status,
            StatusText = slot.Status.ToString(),
            Remark = slot.Remark,
            CreatedAt = slot.CreatedAt
        };
    }
}
