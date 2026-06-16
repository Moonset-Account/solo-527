
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class DoctorService : IDoctorService
{
    private readonly AppDbContext _context;

    public DoctorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<DoctorDto>> GetListAsync(DoctorQueryDto query)
    {
        var queryable = _context.Doctors
            .Include(d => d.Clinic)
            .AsQueryable();

        if (query.ClinicId.HasValue)
            queryable = queryable.Where(d => d.ClinicId == query.ClinicId.Value);
        if (!string.IsNullOrEmpty(query.Name))
            queryable = queryable.Where(d => d.Name.Contains(query.Name));
        if (!string.IsNullOrEmpty(query.Department))
            queryable = queryable.Where(d => d.Department.Contains(query.Department));
        if (query.IsActive.HasValue)
            queryable = queryable.Where(d => d.IsActive == query.IsActive.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderBy(d => d.ClinicId)
            .ThenBy(d => d.Name)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(d => MapToDto(d))
            .ToListAsync();

        return new PagedResultDto<DoctorDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<List<DoctorDto>> GetAllAsync(int? clinicId = null)
    {
        var queryable = _context.Doctors
            .Include(d => d.Clinic)
            .Where(d => d.IsActive)
            .AsQueryable();

        if (clinicId.HasValue)
            queryable = queryable.Where(d => d.ClinicId == clinicId.Value);

        return await queryable
            .OrderBy(d => d.Name)
            .Select(d => MapToDto(d))
            .ToListAsync();
    }

    public async Task<DoctorDto?> GetByIdAsync(int id)
    {
        var doctor = await _context.Doctors
            .Include(d => d.Clinic)
            .FirstOrDefaultAsync(d => d.Id == id);
        return doctor == null ? null : MapToDto(doctor);
    }

    public async Task<DoctorDto> CreateAsync(DoctorCreateDto dto)
    {
        var doctor = new Doctor
        {
            ClinicId = dto.ClinicId,
            Name = dto.Name,
            Title = dto.Title,
            Department = dto.Department,
            Avatar = dto.Avatar,
            Introduction = dto.Introduction,
            Phone = dto.Phone,
            IsActive = true,
            CreatedAt = DateTime.Now
        };

        _context.Doctors.Add(doctor);
        await _context.SaveChangesAsync();
        return MapToDto(doctor);
    }

    public async Task<DoctorDto?> UpdateAsync(int id, DoctorUpdateDto dto)
    {
        var doctor = await _context.Doctors.FindAsync(id);
        if (doctor == null) return null;

        doctor.Name = dto.Name;
        doctor.Title = dto.Title;
        doctor.Department = dto.Department;
        doctor.Avatar = dto.Avatar;
        doctor.Introduction = dto.Introduction;
        doctor.Phone = dto.Phone;
        doctor.IsActive = dto.IsActive;
        doctor.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return MapToDto(doctor);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var doctor = await _context.Doctors.FindAsync(id);
        if (doctor == null) return false;

        doctor.IsActive = false;
        doctor.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    private static DoctorDto MapToDto(Doctor doctor)
    {
        return new DoctorDto
        {
            Id = doctor.Id,
            ClinicId = doctor.ClinicId,
            ClinicName = doctor.Clinic?.Name,
            Name = doctor.Name,
            Title = doctor.Title,
            Department = doctor.Department,
            Avatar = doctor.Avatar,
            Introduction = doctor.Introduction,
            Phone = doctor.Phone,
            IsActive = doctor.IsActive,
            CreatedAt = doctor.CreatedAt
        };
    }
}
