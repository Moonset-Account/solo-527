
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class FollowUpService : IFollowUpService
{
    private readonly AppDbContext _context;
    private readonly IWorkloadReportService _workloadReportService;

    public FollowUpService(AppDbContext context, IWorkloadReportService workloadReportService)
    {
        _context = context;
        _workloadReportService = workloadReportService;
    }

    public async Task<PagedResultDto<FollowUpDto>> GetListAsync(FollowUpQueryDto query)
    {
        var queryable = _context.FollowUps
            .Include(f => f.Patient)
            .Include(f => f.Doctor)
            .AsQueryable();

        if (query.ClinicId.HasValue)
            queryable = queryable.Where(f => f.Doctor != null && f.Doctor.ClinicId == query.ClinicId.Value);
        if (query.DoctorId.HasValue)
            queryable = queryable.Where(f => f.DoctorId == query.DoctorId.Value);
        if (query.PatientId.HasValue)
            queryable = queryable.Where(f => f.PatientId == query.PatientId.Value);
        if (query.ResponsiblePersonId.HasValue)
            queryable = queryable.Where(f => f.ResponsiblePersonId == query.ResponsiblePersonId.Value);
        if (query.Status.HasValue)
            queryable = queryable.Where(f => f.Status == (FollowUpStatus)query.Status.Value);
        if (query.Type.HasValue)
            queryable = queryable.Where(f => f.Type == (FollowUpType)query.Type.Value);
        if (query.IsOverdue.HasValue)
            queryable = queryable.Where(f => f.IsOverdue == query.IsOverdue.Value);
        if (query.StartDate.HasValue)
            queryable = queryable.Where(f => f.PlannedDate.Date >= query.StartDate.Value.Date);
        if (query.EndDate.HasValue)
            queryable = queryable.Where(f => f.PlannedDate.Date <= query.EndDate.Value.Date);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderBy(f => f.Status)
            .ThenBy(f => f.PlannedDate)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(f => MapToDto(f))
            .ToListAsync();

        return new PagedResultDto<FollowUpDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<FollowUpDto?> GetByIdAsync(int id)
    {
        var followUp = await _context.FollowUps
            .Include(f => f.Patient)
            .Include(f => f.Doctor)
            .FirstOrDefaultAsync(f => f.Id == id);
        return followUp == null ? null : MapToDto(followUp);
    }

    public async Task<FollowUpDto> CreateAsync(FollowUpCreateDto dto)
    {
        var followUp = new FollowUp
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            DoctorId = dto.DoctorId,
            ResponsiblePersonId = dto.ResponsiblePersonId,
            ResponsiblePersonName = dto.ResponsiblePersonName,
            Type = (FollowUpType)dto.Type,
            Status = FollowUpStatus.Pending,
            PlannedDate = dto.PlannedDate,
            DueDate = dto.DueDate,
            Content = dto.Content,
            IsOverdue = false,
            CreatedAt = DateTime.Now
        };

        _context.FollowUps.Add(followUp);

        var todo = new TodoItem
        {
            Title = $"随访提醒：{followUp.Id}",
            Type = TodoType.FollowUp,
            Priority = TodoPriority.Medium,
            Status = TodoStatus.Pending,
            PatientId = dto.PatientId,
            FollowUpId = followUp.Id,
            AssignedToUserId = dto.ResponsiblePersonId,
            AssignedToUserName = dto.ResponsiblePersonName,
            DueDate = dto.PlannedDate,
            Description = dto.Content,
            CreatedAt = DateTime.Now
        };
        _context.TodoItems.Add(todo);

        await _context.SaveChangesAsync();
        todo.Title = $"随访提醒：{followUp.Id}";
        await _context.SaveChangesAsync();

        return MapToDto(followUp);
    }

    public async Task<FollowUpDto?> UpdateAsync(int id, FollowUpUpdateDto dto)
    {
        var followUp = await _context.FollowUps.FindAsync(id);
        if (followUp == null) return null;

        followUp.Status = (FollowUpStatus)dto.Status;
        followUp.Result = dto.Result;
        followUp.Remark = dto.Remark;
        followUp.CompletedDate = dto.CompletedDate;
        followUp.UpdatedAt = DateTime.Now;

        if (dto.Status == (int)FollowUpStatus.Completed && !followUp.CompletedDate.HasValue)
        {
            followUp.CompletedDate = DateTime.Now;
        }

        await _context.SaveChangesAsync();
        return MapToDto(followUp);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var followUp = await _context.FollowUps.FindAsync(id);
        if (followUp == null) return false;

        followUp.Status = FollowUpStatus.Cancelled;
        followUp.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FollowUpDto?> CompleteAsync(int id, string result, string? remark = null)
    {
        var followUp = await _context.FollowUps
            .Include(f => f.Patient)
            .Include(f => f.Doctor)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (followUp == null) return null;

        followUp.Status = FollowUpStatus.Completed;
        followUp.Result = result;
        followUp.Remark = remark;
        followUp.CompletedDate = DateTime.Now;
        followUp.UpdatedAt = DateTime.Now;

        var todos = await _context.TodoItems
            .Where(t => t.FollowUpId == id && t.Status != TodoStatus.Completed)
            .ToListAsync();

        foreach (var todo in todos)
        {
            todo.Status = TodoStatus.Completed;
            todo.CompletedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();
        await _workloadReportService.GenerateAsync(followUp.DoctorId, DateTime.Today);

        return MapToDto(followUp);
    }

    public async Task<int> GetOverdueCountAsync(int? responsiblePersonId = null)
    {
        var query = _context.FollowUps
            .Where(f => f.IsOverdue && f.Status == FollowUpStatus.Pending)
            .AsQueryable();

        if (responsiblePersonId.HasValue)
            query = query.Where(f => f.ResponsiblePersonId == responsiblePersonId.Value);

        return await query.CountAsync();
    }

    private static FollowUpDto MapToDto(FollowUp followUp)
    {
        return new FollowUpDto
        {
            Id = followUp.Id,
            PatientId = followUp.PatientId,
            PatientName = followUp.Patient?.Name,
            PatientPhone = followUp.Patient?.Phone,
            AppointmentId = followUp.AppointmentId,
            DoctorId = followUp.DoctorId,
            DoctorName = followUp.Doctor?.Name,
            ResponsiblePersonId = followUp.ResponsiblePersonId,
            ResponsiblePersonName = followUp.ResponsiblePersonName,
            Type = (int)followUp.Type,
            TypeText = followUp.Type.ToString(),
            Status = (int)followUp.Status,
            StatusText = followUp.Status.ToString(),
            PlannedDate = followUp.PlannedDate,
            PlannedDateText = followUp.PlannedDate.ToString("yyyy-MM-dd"),
            CompletedDate = followUp.CompletedDate,
            DueDate = followUp.DueDate,
            IsOverdue = followUp.IsOverdue,
            Content = followUp.Content,
            Result = followUp.Result,
            Remark = followUp.Remark,
            CreatedAt = followUp.CreatedAt
        };
    }
}
