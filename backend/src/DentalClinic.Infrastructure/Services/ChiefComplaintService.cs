
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class ChiefComplaintService : IChiefComplaintService
{
    private readonly AppDbContext _context;

    public ChiefComplaintService(AppDbContext context)
    {
        _context = context;
    }

    public async Task&lt;ChiefComplaintDto?&gt; GetByIdAsync(int id)
    {
        var complaint = await _context.ChiefComplaints
            .Include(c =&gt; c.Patient)
            .Include(c =&gt; c.Doctor)
            .FirstOrDefaultAsync(c =&gt; c.Id == id);

        return complaint == null ? null : MapToDto(complaint);
    }

    public async Task&lt;ChiefComplaintDto&gt; CreateAsync(ChiefComplaintCreateDto dto)
    {
        var complaint = new ChiefComplaint
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            DoctorId = dto.DoctorId,
            Description = dto.Description,
            History = dto.History,
            Examination = dto.Examination,
            Diagnosis = dto.Diagnosis,
            TreatmentPlan = dto.TreatmentPlan,
            VisitDate = dto.VisitDate,
            CreatedAt = DateTime.Now
        };

        _context.ChiefComplaints.Add(complaint);
        await _context.SaveChangesAsync();
        return MapToDto(complaint);
    }

    public async Task&lt;List&lt;ChiefComplaintDto&gt;&gt; GetByPatientIdAsync(int patientId)
    {
        return await _context.ChiefComplaints
            .Include(c =&gt; c.Doctor)
            .Where(c =&gt; c.PatientId == patientId)
            .OrderByDescending(c =&gt; c.VisitDate)
            .Select(c =&gt; MapToDto(c))
            .ToListAsync();
    }

    public async Task&lt;ChiefComplaintDto?&gt; GetLatestByPatientIdAsync(int patientId)
    {
        var complaint = await _context.ChiefComplaints
            .Include(c =&gt; c.Doctor)
            .Where(c =&gt; c.PatientId == patientId)
            .OrderByDescending(c =&gt; c.VisitDate)
            .FirstOrDefaultAsync();

        return complaint == null ? null : MapToDto(complaint);
    }

    private static ChiefComplaintDto MapToDto(ChiefComplaint complaint)
    {
        return new ChiefComplaintDto
        {
            Id = complaint.Id,
            PatientId = complaint.PatientId,
            PatientName = complaint.Patient?.Name,
            AppointmentId = complaint.AppointmentId,
            DoctorId = complaint.DoctorId,
            DoctorName = complaint.Doctor?.Name,
            Description = complaint.Description,
            History = complaint.History,
            Examination = complaint.Examination,
            Diagnosis = complaint.Diagnosis,
            TreatmentPlan = complaint.TreatmentPlan,
            VisitDate = complaint.VisitDate,
            VisitDateText = complaint.VisitDate.ToString("yyyy-MM-dd"),
            CreatedAt = complaint.CreatedAt
        };
    }
}
