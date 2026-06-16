
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class AppointmentService : IAppointmentService
{
    private readonly AppDbContext _context;

    public AppointmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task&lt;PagedResultDto&lt;AppointmentDto&gt;&gt; GetListAsync(AppointmentQueryDto query)
    {
        var queryable = _context.Appointments
            .Include(a =&gt; a.Patient)
            .Include(a =&gt; a.Doctor)
            .Include(a =&gt; a.Clinic)
            .AsQueryable();

        if (query.ClinicId.HasValue)
            queryable = queryable.Where(a =&gt; a.ClinicId == query.ClinicId.Value);
        if (query.DoctorId.HasValue)
            queryable = queryable.Where(a =&gt; a.DoctorId == query.DoctorId.Value);
        if (query.PatientId.HasValue)
            queryable = queryable.Where(a =&gt; a.PatientId == query.PatientId.Value);
        if (query.Status.HasValue)
            queryable = queryable.Where(a =&gt; a.Status == (AppointmentStatus)query.Status.Value);
        if (query.Type.HasValue)
            queryable = queryable.Where(a =&gt; a.Type == (AppointmentType)query.Type.Value);
        if (query.StartDate.HasValue)
            queryable = queryable.Where(a =&gt; a.AppointmentDate.Date &gt;= query.StartDate.Value.Date);
        if (query.EndDate.HasValue)
            queryable = queryable.Where(a =&gt; a.AppointmentDate.Date &lt;= query.EndDate.Value.Date);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(a =&gt; a.AppointmentDate)
            .ThenBy(a =&gt; a.StartTime)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(a =&gt; MapToDto(a))
            .ToListAsync();

        return new PagedResultDto&lt;AppointmentDto&gt;
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task&lt;AppointmentDto?&gt; GetByIdAsync(int id, bool includeDetails = false)
    {
        var query = _context.Appointments
            .Include(a =&gt; a.Patient)
            .Include(a =&gt; a.Doctor)
            .Include(a =&gt; a.Clinic)
            .AsQueryable();

        if (includeDetails)
        {
            query = query
                .Include(a =&gt; a.FeeItems)
                .Include(a =&gt; a.ChiefComplaintRecords)
                .Include(a =&gt; a.Prescriptions);
        }

        var appointment = await query.FirstOrDefaultAsync(a =&gt; a.Id == id);
        return appointment == null ? null : MapToDto(appointment, includeDetails);
    }

    public async Task&lt;AppointmentDto&gt; CreateAsync(AppointmentCreateDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var appointment = new Appointment
            {
                PatientId = dto.PatientId,
                DoctorId = dto.DoctorId,
                ClinicId = dto.ClinicId,
                AppointmentDate = dto.AppointmentDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = AppointmentStatus.Pending,
                Type = (AppointmentType)dto.Type,
                ChiefComplaint = dto.ChiefComplaint,
                Remark = dto.Remark,
                ScheduleSlotId = dto.ScheduleSlotId,
                CreatedAt = DateTime.Now
            };

            _context.Appointments.Add(appointment);

            if (dto.ScheduleSlotId.HasValue)
            {
                var slot = await _context.ScheduleSlots.FindAsync(dto.ScheduleSlotId.Value);
                if (slot != null)
                {
                    slot.BookedSlots++;
                    if (slot.BookedSlots &gt;= slot.TotalSlots)
                        slot.Status = ScheduleSlotStatus.FullyBooked;
                    else if (slot.BookedSlots &gt; 0)
                        slot.Status = ScheduleSlotStatus.PartiallyBooked;
                    slot.UpdatedAt = DateTime.Now;
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return MapToDto(appointment);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task&lt;AppointmentDto?&gt; UpdateAsync(int id, AppointmentUpdateDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return null;

        appointment.Status = (AppointmentStatus)dto.Status;
        appointment.Remark = dto.Remark;
        appointment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return MapToDto(appointment);
    }

    public async Task&lt;bool&gt; DeleteAsync(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return false;

        if (appointment.ScheduleSlotId.HasValue)
        {
            var slot = await _context.ScheduleSlots.FindAsync(appointment.ScheduleSlotId.Value);
            if (slot != null)
            {
                slot.BookedSlots = Math.Max(0, slot.BookedSlots - 1);
                if (slot.BookedSlots == 0)
                    slot.Status = ScheduleSlotStatus.Available;
                else if (slot.BookedSlots &lt; slot.TotalSlots)
                    slot.Status = ScheduleSlotStatus.PartiallyBooked;
                slot.UpdatedAt = DateTime.Now;
            }
        }

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task&lt;bool&gt; UpdateStatusAsync(int id, int status)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return false;

        appointment.Status = (AppointmentStatus)status;
        appointment.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    private static AppointmentDto MapToDto(Appointment appointment, bool includeDetails = false)
    {
        var dto = new AppointmentDto
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient?.Name,
            PatientPhone = appointment.Patient?.Phone,
            DoctorId = appointment.DoctorId,
            DoctorName = appointment.Doctor?.Name,
            DoctorTitle = appointment.Doctor?.Title,
            ClinicId = appointment.ClinicId,
            ClinicName = appointment.Clinic?.Name,
            AppointmentDate = appointment.AppointmentDate,
            AppointmentDateText = appointment.AppointmentDate.ToString("yyyy-MM-dd"),
            StartTime = appointment.StartTime,
            StartTimeText = appointment.StartTime.ToString(@"hh\:mm"),
            EndTime = appointment.EndTime,
            EndTimeText = appointment.EndTime.ToString(@"hh\:mm"),
            Status = (int)appointment.Status,
            StatusText = appointment.Status.ToString(),
            Type = (int)appointment.Type,
            TypeText = appointment.Type.ToString(),
            ChiefComplaint = appointment.ChiefComplaint,
            Remark = appointment.Remark,
            ScheduleSlotId = appointment.ScheduleSlotId,
            CreatedAt = appointment.CreatedAt
        };

        if (includeDetails)
        {
            dto.FeeItems = appointment.FeeItems?.Select(f =&gt; new FeeItemDto
            {
                Id = f.Id,
                ItemName = f.ItemName,
                ItemCode = f.ItemCode,
                Category = (int)f.Category,
                CategoryText = f.Category.ToString(),
                UnitPrice = f.UnitPrice,
                Quantity = f.Quantity,
                Amount = f.Amount,
                Status = (int)f.Status,
                StatusText = f.Status.ToString()
            }).ToList();

            dto.ChiefComplaintRecords = appointment.ChiefComplaintRecords?.Select(c =&gt; new ChiefComplaintDto
            {
                Id = c.Id,
                Description = c.Description,
                Diagnosis = c.Diagnosis,
                TreatmentPlan = c.TreatmentPlan,
                VisitDate = c.VisitDate,
                VisitDateText = c.VisitDate.ToString("yyyy-MM-dd")
            }).ToList();

            dto.Prescriptions = appointment.Prescriptions?.Select(p =&gt; new PrescriptionDto
            {
                Id = p.Id,
                PrescriptionNo = p.PrescriptionNo,
                TotalAmount = p.TotalAmount,
                Status = (int)p.Status,
                StatusText = p.Status.ToString()
            }).ToList();
        }

        return dto;
    }
}
