
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

    public async Task&lt;List&lt;ScheduleSlotDto&gt;&gt; GetListAsync(ScheduleSlotQueryDto query)
    {
        var queryable = _context.ScheduleSlots
            .Include(s =&gt; s.Doctor)
            .Include(s =&gt; s.Clinic)
            .AsQueryable();

        if (query.ClinicId.HasValue)
            queryable = queryable.Where(s =&gt; s.ClinicId == query.ClinicId.Value);
        if (query.DoctorId.HasValue)
            queryable = queryable.Where(s =&gt; s.DoctorId == query.DoctorId.Value);
        if (query.StartDate.HasValue)
            queryable = queryable.Where(s =&gt; s.Date.Date &gt;= query.StartDate.Value.Date);
        if (query.EndDate.HasValue)
            queryable = queryable.Where(s =&gt; s.Date.Date &lt;= query.EndDate.Value.Date);
        if (query.Status.HasValue)
            queryable = queryable.Where(s =&gt; s.Status == (ScheduleSlotStatus)query.Status.Value);

        return await queryable
            .OrderBy(s =&gt; s.Date)
            .ThenBy(s =&gt; s.StartTime)
            .Select(s =&gt; MapToDto(s))
            .ToListAsync();
    }

    public async Task&lt;ScheduleSlotDto?&gt; GetByIdAsync(int id)
    {
        var slot = await _context.ScheduleSlots
            .Include(s =&gt; s.Doctor)
            .Include(s =&gt; s.Clinic)
            .FirstOrDefaultAsync(s =&gt; s.Id == id);
        return slot == null ? null : MapToDto(slot);
    }

    public async Task&lt;ScheduleSlotDto&gt; CreateAsync(ScheduleSlotCreateDto dto)
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

    public async Task&lt;bool&gt; DeleteAsync(int id)
    {
        var slot = await _context.ScheduleSlots.FindAsync(id);
        if (slot == null) return false;

        slot.Status = ScheduleSlotStatus.Closed;
        slot.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task&lt;List&lt;ScheduleSlotDto&gt;&gt; GetAvailableSlotsAsync(int doctorId, DateTime date)
    {
        return await _context.ScheduleSlots
            .Include(s =&gt; s.Doctor)
            .Where(s =&gt; s.DoctorId == doctorId 
                &amp;&amp; s.Date.Date == date.Date 
                &amp;&amp; s.Status != ScheduleSlotStatus.Closed
                &amp;&amp; s.AvailableSlots &gt; 0)
            .OrderBy(s =&gt; s.StartTime)
            .Select(s =&gt; MapToDto(s))
            .ToListAsync();
    }

    public async Task&lt;List&lt;ScheduleSlotDto&gt;&gt; GetSlotsByDateRangeAsync(int? clinicId, int? doctorId, DateTime startDate, DateTime endDate)
    {
        var queryable = _context.ScheduleSlots
            .Include(s =&gt; s.Doctor)
            .Include(s =&gt; s.Clinic)
            .Where(s =&gt; s.Date.Date &gt;= startDate.Date &amp;&amp; s.Date.Date &lt;= endDate.Date)
            .AsQueryable();

        if (clinicId.HasValue)
            queryable = queryable.Where(s =&gt; s.ClinicId == clinicId.Value);
        if (doctorId.HasValue)
            queryable = queryable.Where(s =&gt; s.DoctorId == doctorId.Value);

        return await queryable
            .OrderBy(s =&gt; s.Date)
            .ThenBy(s =&gt; s.StartTime)
            .Select(s =&gt; MapToDto(s))
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
