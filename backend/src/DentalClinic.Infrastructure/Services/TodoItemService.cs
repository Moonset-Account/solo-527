
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class TodoItemService : ITodoItemService
{
    private readonly AppDbContext _context;
    private readonly IWorkloadReportService _workloadReportService;

    public TodoItemService(AppDbContext context, IWorkloadReportService workloadReportService)
    {
        _context = context;
        _workloadReportService = workloadReportService;
    }

    public async Task&lt;PagedResultDto&lt;TodoItemDto&gt;&gt; GetListAsync(TodoQueryDto query)
    {
        var queryable = _context.TodoItems
            .Include(t =&gt; t.Patient)
            .AsQueryable();

        if (query.AssignedToUserId.HasValue)
            queryable = queryable.Where(t =&gt; t.AssignedToUserId == query.AssignedToUserId.Value);
        if (query.Status.HasValue)
            queryable = queryable.Where(t =&gt; t.Status == (TodoStatus)query.Status.Value);
        if (query.Type.HasValue)
            queryable = queryable.Where(t =&gt; t.Type == (TodoType)query.Type.Value);
        if (query.Priority.HasValue)
            queryable = queryable.Where(t =&gt; t.Priority == (TodoPriority)query.Priority.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(t =&gt; t.Priority)
            .ThenBy(t =&gt; t.DueDate)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(t =&gt; MapToDto(t))
            .ToListAsync();

        return new PagedResultDto&lt;TodoItemDto&gt;
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task&lt;TodoItemDto?&gt; GetByIdAsync(int id, bool includeDetails = false)
    {
        var todo = await _context.TodoItems
            .Include(t =&gt; t.Patient)
            .FirstOrDefaultAsync(t =&gt; t.Id == id);

        if (todo == null) return null;

        var dto = MapToDto(todo);

        if (includeDetails)
        {
            if (todo.AppointmentId.HasValue)
            {
                var appointment = await _context.Appointments
                    .Include(a =&gt; a.FeeItems)
                    .Include(a =&gt; a.ChiefComplaintRecords)
                    .Include(a =&gt; a.Prescriptions)
                    .ThenInclude(p =&gt; p.Items)
                    .FirstOrDefaultAsync(a =&gt; a.Id == todo.AppointmentId.Value);

                if (appointment != null)
                {
                    dto.Appointment = new AppointmentDto
                    {
                        Id = appointment.Id,
                        AppointmentDate = appointment.AppointmentDate,
                        AppointmentDateText = appointment.AppointmentDate.ToString("yyyy-MM-dd"),
                        StartTime = appointment.StartTime,
                        StartTimeText = appointment.StartTime.ToString(@"hh\:mm"),
                        Status = (int)appointment.Status,
                        StatusText = appointment.Status.ToString(),
                        Type = (int)appointment.Type,
                        TypeText = appointment.Type.ToString(),
                        ChiefComplaint = appointment.ChiefComplaint
                    };

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

                    dto.ChiefComplaint = appointment.ChiefComplaintRecords?
                        .OrderByDescending(c =&gt; c.VisitDate)
                        .Select(c =&gt; new ChiefComplaintDto
                        {
                            Id = c.Id,
                            Description = c.Description,
                            History = c.History,
                            Examination = c.Examination,
                            Diagnosis = c.Diagnosis,
                            TreatmentPlan = c.TreatmentPlan,
                            VisitDate = c.VisitDate,
                            VisitDateText = c.VisitDate.ToString("yyyy-MM-dd")
                        }).FirstOrDefault();

                    dto.Prescription = appointment.Prescriptions?
                        .OrderByDescending(p =&gt; p.CreatedAt)
                        .Select(p =&gt; new PrescriptionDto
                        {
                            Id = p.Id,
                            PrescriptionNo = p.PrescriptionNo,
                            TotalAmount = p.TotalAmount,
                            Status = (int)p.Status,
                            StatusText = p.Status.ToString(),
                            Items = p.Items.Select(i =&gt; new PrescriptionItemDto
                            {
                                Id = i.Id,
                                MedicineName = i.MedicineName,
                                Specification = i.Specification,
                                Quantity = i.Quantity,
                                Usage = i.Usage,
                                Dosage = i.Dosage,
                                UnitPrice = i.UnitPrice,
                                Amount = i.Amount
                            }).ToList()
                        }).FirstOrDefault();
                }
            }

            if (todo.FollowUpId.HasValue)
            {
                var followUp = await _context.FollowUps
                    .Include(f =&gt; f.Patient)
                    .Include(f =&gt; f.Doctor)
                    .FirstOrDefaultAsync(f =&gt; f.Id == todo.FollowUpId.Value);

                if (followUp != null)
                {
                    dto.FollowUp = new FollowUpDto
                    {
                        Id = followUp.Id,
                        PatientId = followUp.PatientId,
                        PatientName = followUp.Patient?.Name,
                        DoctorId = followUp.DoctorId,
                        DoctorName = followUp.Doctor?.Name,
                        Type = (int)followUp.Type,
                        TypeText = followUp.Type.ToString(),
                        Status = (int)followUp.Status,
                        StatusText = followUp.Status.ToString(),
                        PlannedDate = followUp.PlannedDate,
                        PlannedDateText = followUp.PlannedDate.ToString("yyyy-MM-dd"),
                        DueDate = followUp.DueDate,
                        IsOverdue = followUp.IsOverdue,
                        Content = followUp.Content
                    };
                }
            }
        }

        return dto;
    }

    public async Task&lt;TodoItemDto&gt; CreateAsync(TodoItemCreateDto dto)
    {
        var todo = new TodoItem
        {
            Title = dto.Title,
            Type = (TodoType)dto.Type,
            Priority = (TodoPriority)dto.Priority,
            Status = TodoStatus.Pending,
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            FollowUpId = dto.FollowUpId,
            AssignedToUserId = dto.AssignedToUserId,
            AssignedToUserName = dto.AssignedToUserName,
            DueDate = dto.DueDate,
            Description = dto.Description,
            CreatedAt = DateTime.Now
        };

        _context.TodoItems.Add(todo);
        await _context.SaveChangesAsync();
        return MapToDto(todo);
    }

    public async Task&lt;TodoItemDto?&gt; UpdateAsync(int id, TodoItemUpdateDto dto)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null) return null;

        todo.Status = (TodoStatus)dto.Status;
        todo.Description = dto.Description;

        if (dto.Status == (int)TodoStatus.Completed &amp;&amp; !todo.CompletedAt.HasValue)
        {
            todo.CompletedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();
        return MapToDto(todo);
    }

    public async Task&lt;bool&gt; DeleteAsync(int id)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null) return false;

        _context.TodoItems.Remove(todo);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CompleteAsync(int id)
    {
        var todo = await _context.TodoItems
            .Include(t => t.FollowUp)
            .FirstOrDefaultAsync(t => t.Id == id);
            
        if (todo == null) return false;

        todo.Status = TodoStatus.Completed;
        todo.CompletedAt = DateTime.Now;

        if (todo.FollowUpId.HasValue && todo.FollowUp != null)
        {
            todo.FollowUp.Status = FollowUpStatus.Completed;
            todo.FollowUp.CompletedDate = DateTime.Now;
            todo.FollowUp.UpdatedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();

        if (todo.FollowUpId.HasValue && todo.FollowUp != null)
        {
            try
            {
                await _workloadReportService.SyncFromFollowUpCompletionAsync(
                    todo.FollowUp.DoctorId, DateTime.Today);
            }
            catch
            {
            }
        }

        return true;
    }

    public async Task&lt;int&gt; GetPendingCountAsync(int? assignedToUserId = null)
    {
        var query = _context.TodoItems
            .Where(t =&gt; t.Status == TodoStatus.Pending)
            .AsQueryable();

        if (assignedToUserId.HasValue)
            query = query.Where(t =&gt; t.AssignedToUserId == assignedToUserId.Value);

        return await query.CountAsync();
    }

    private static TodoItemDto MapToDto(TodoItem todo)
    {
        return new TodoItemDto
        {
            Id = todo.Id,
            Title = todo.Title,
            Type = (int)todo.Type,
            TypeText = todo.Type.ToString(),
            Priority = (int)todo.Priority,
            PriorityText = todo.Priority.ToString(),
            Status = (int)todo.Status,
            StatusText = todo.Status.ToString(),
            PatientId = todo.PatientId,
            PatientName = todo.Patient?.Name,
            PatientPhone = todo.Patient?.Phone,
            AppointmentId = todo.AppointmentId,
            FollowUpId = todo.FollowUpId,
            AssignedToUserId = todo.AssignedToUserId,
            AssignedToUserName = todo.AssignedToUserName,
            DueDate = todo.DueDate,
            DueDateText = todo.DueDate?.ToString("yyyy-MM-dd HH:mm"),
            Description = todo.Description,
            CreatedAt = todo.CreatedAt,
            CompletedAt = todo.CompletedAt
        };
    }
}
