
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly AppDbContext _context;

    public PrescriptionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task&lt;PrescriptionDto?&gt; GetByIdAsync(int id)
    {
        var prescription = await _context.Prescriptions
            .Include(p =&gt; p.Patient)
            .Include(p =&gt; p.Doctor)
            .Include(p =&gt; p.Items)
            .FirstOrDefaultAsync(p =&gt; p.Id == id);

        return prescription == null ? null : MapToDto(prescription);
    }

    public async Task&lt;PrescriptionDto&gt; CreateAsync(PrescriptionCreateDto dto)
    {
        var prescriptionNo = $"RX{DateTime.Now:yyyyMMdd}{Guid.NewGuid().ToString("N")[..4].ToUpper()}";

        var prescription = new Prescription
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            DoctorId = dto.DoctorId,
            PrescriptionNo = prescriptionNo,
            Remark = dto.Remark,
            Status = PrescriptionStatus.Pending,
            CreatedAt = DateTime.Now
        };

        var items = dto.Items.Select(item =&gt; new PrescriptionItem
        {
            MedicineName = item.MedicineName,
            Specification = item.Specification,
            Quantity = item.Quantity,
            Usage = item.Usage,
            Dosage = item.Dosage,
            UnitPrice = item.UnitPrice,
            Remark = item.Remark
        }).ToList();

        prescription.Items = items;
        prescription.TotalAmount = items.Sum(i =&gt; i.Amount);

        _context.Prescriptions.Add(prescription);
        await _context.SaveChangesAsync();

        return MapToDto(prescription);
    }

    public async Task&lt;List&lt;PrescriptionDto&gt;&gt; GetByPatientIdAsync(int patientId)
    {
        return await _context.Prescriptions
            .Include(p =&gt; p.Doctor)
            .Include(p =&gt; p.Items)
            .Where(p =&gt; p.PatientId == patientId)
            .OrderByDescending(p =&gt; p.CreatedAt)
            .Select(p =&gt; MapToDto(p))
            .ToListAsync();
    }

    public async Task&lt;List&lt;PrescriptionDto&gt;&gt; GetByAppointmentIdAsync(int appointmentId)
    {
        return await _context.Prescriptions
            .Include(p =&gt; p.Doctor)
            .Include(p =&gt; p.Items)
            .Where(p =&gt; p.AppointmentId == appointmentId)
            .OrderByDescending(p =&gt; p.CreatedAt)
            .Select(p =&gt; MapToDto(p))
            .ToListAsync();
    }

    private static PrescriptionDto MapToDto(Prescription prescription)
    {
        return new PrescriptionDto
        {
            Id = prescription.Id,
            PatientId = prescription.PatientId,
            PatientName = prescription.Patient?.Name,
            AppointmentId = prescription.AppointmentId,
            DoctorId = prescription.DoctorId,
            DoctorName = prescription.Doctor?.Name,
            PrescriptionNo = prescription.PrescriptionNo,
            Remark = prescription.Remark,
            TotalAmount = prescription.TotalAmount,
            Status = (int)prescription.Status,
            StatusText = prescription.Status.ToString(),
            CreatedAt = prescription.CreatedAt,
            Items = prescription.Items.Select(i =&gt; new PrescriptionItemDto
            {
                Id = i.Id,
                MedicineName = i.MedicineName,
                Specification = i.Specification,
                Quantity = i.Quantity,
                Usage = i.Usage,
                Dosage = i.Dosage,
                UnitPrice = i.UnitPrice,
                Amount = i.Amount,
                Remark = i.Remark
            }).ToList()
        };
    }
}
