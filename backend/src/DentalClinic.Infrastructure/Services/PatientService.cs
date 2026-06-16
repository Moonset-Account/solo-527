
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class PatientService : IPatientService
{
    private readonly AppDbContext _context;

    public PatientService(AppDbContext context)
    {
        _context = context;
    }

    public async Task&lt;PagedResultDto&lt;PatientDto&gt;&gt; GetListAsync(PatientQueryDto query)
    {
        var queryable = _context.Patients
            .Include(p =&gt; p.Clinic)
            .AsQueryable();

        if (query.ClinicId.HasValue)
            queryable = queryable.Where(p =&gt; p.ClinicId == query.ClinicId.Value);
        if (!string.IsNullOrEmpty(query.Name))
            queryable = queryable.Where(p =&gt; p.Name.Contains(query.Name));
        if (!string.IsNullOrEmpty(query.Phone))
            queryable = queryable.Where(p =&gt; p.Phone.Contains(query.Phone));
        if (query.Status.HasValue)
            queryable = queryable.Where(p =&gt; p.Status == (PatientStatus)query.Status.Value);

        var totalCount = await queryable.CountAsync();

        var sortField = query.SortField ?? "CreatedAt";
        var sortOrder = query.SortOrder?.ToLower() == "asc";
        
        queryable = sortField.ToLower() switch
        {
            "name" =&gt; sortOrder ? queryable.OrderBy(p =&gt; p.Name) : queryable.OrderByDescending(p =&gt; p.Name),
            _ =&gt; sortOrder ? queryable.OrderBy(p =&gt; p.CreatedAt) : queryable.OrderByDescending(p =&gt; p.CreatedAt)
        };

        var items = await queryable
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p =&gt; MapToDto(p))
            .ToListAsync();

        return new PagedResultDto&lt;PatientDto&gt;
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task&lt;PatientDto?&gt; GetByIdAsync(int id)
    {
        var patient = await _context.Patients
            .Include(p =&gt; p.Clinic)
            .FirstOrDefaultAsync(p =&gt; p.Id == id);
        return patient == null ? null : MapToDto(patient);
    }

    public async Task&lt;PatientDto&gt; CreateAsync(PatientCreateDto dto)
    {
        var patient = new Patient
        {
            ClinicId = dto.ClinicId,
            Name = dto.Name,
            Gender = dto.Gender,
            BirthDate = dto.BirthDate,
            Phone = dto.Phone,
            IdCard = dto.IdCard,
            Address = dto.Address,
            Remark = dto.Remark,
            Status = PatientStatus.Active,
            CreatedAt = DateTime.Now
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
        
        return MapToDto(patient);
    }

    public async Task&lt;PatientDto?&gt; UpdateAsync(int id, PatientUpdateDto dto)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return null;

        patient.Name = dto.Name;
        patient.Gender = dto.Gender;
        patient.BirthDate = dto.BirthDate;
        patient.Phone = dto.Phone;
        patient.IdCard = dto.IdCard;
        patient.Address = dto.Address;
        patient.Remark = dto.Remark;
        patient.Status = (PatientStatus)dto.Status;
        patient.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return MapToDto(patient);
    }

    public async Task&lt;bool&gt; DeleteAsync(int id)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return false;

        patient.Status = PatientStatus.Inactive;
        patient.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task&lt;PatientDto?&gt; GetByPhoneAsync(string phone)
    {
        var patient = await _context.Patients
            .Include(p =&gt; p.Clinic)
            .FirstOrDefaultAsync(p =&gt; p.Phone == phone);
        return patient == null ? null : MapToDto(patient);
    }

    private static PatientDto MapToDto(Patient patient)
    {
        return new PatientDto
        {
            Id = patient.Id,
            ClinicId = patient.ClinicId,
            ClinicName = patient.Clinic?.Name,
            Name = patient.Name,
            Gender = patient.Gender,
            BirthDate = patient.BirthDate,
            Age = patient.BirthDate.HasValue ? CalculateAge(patient.BirthDate.Value) : null,
            Phone = patient.Phone,
            IdCard = patient.IdCard,
            Address = patient.Address,
            Remark = patient.Remark,
            Status = (int)patient.Status,
            StatusText = patient.Status.ToString(),
            CreatedAt = patient.CreatedAt
        };
    }

    private static int CalculateAge(DateTime birthDate)
    {
        var age = DateTime.Today.Year - birthDate.Year;
        if (birthDate.Date &gt; DateTime.Today.AddYears(-age)) age--;
        return age;
    }
}
