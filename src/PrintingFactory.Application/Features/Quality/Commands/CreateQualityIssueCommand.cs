
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Quality.Commands;

public class CreateQualityIssueCommand : IRequest<QualityIssueDto>
{
    public CreateQualityIssueDto Issue { get; set; } = new();
}

public class CreateQualityIssueCommandHandler : IRequestHandler<CreateQualityIssueCommand, QualityIssueDto>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;

    public CreateQualityIssueCommandHandler(PrintingFactoryDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<QualityIssueDto> Handle(CreateQualityIssueCommand request, CancellationToken cancellationToken)
    {
        var inspection = await _context.QualityInspections
            .Include(q => q.Order)
            .FirstOrDefaultAsync(q => q.Id == request.Issue.QualityInspectionId, cancellationToken);
        
        if (inspection == null)
            throw new KeyNotFoundException($"Quality inspection with id {request.Issue.QualityInspectionId} not found");

        var existingIssue = await _context.QualityIssues
            .AnyAsync(q => q.QualityInspectionId == request.Issue.QualityInspectionId, cancellationToken);
        
        if (existingIssue)
            throw new InvalidOperationException($"Quality issue already exists for inspection {request.Issue.QualityInspectionId}");

        var issue = new QualityIssue
        {
            QualityInspectionId = request.Issue.QualityInspectionId,
            AffectedScope = request.Issue.AffectedScope,
            IssueDescription = request.Issue.IssueDescription,
            RootCause = request.Issue.RootCause,
            HandlingPath = request.Issue.HandlingPath,
            CorrectiveAction = request.Issue.CorrectiveAction,
            PreventiveAction = request.Issue.PreventiveAction,
            ReviewNotes = request.Issue.ReviewNotes,
            Status = request.Issue.Status,
            Handler = request.Issue.Handler,
            Reviewer = request.Issue.Reviewer,
            ResolvedAt = request.Issue.Status == QualityIssueStatus.Closed ? DateTime.UtcNow : null
        };

        _context.QualityIssues.Add(issue);

        if (inspection.Order != null)
        {
            inspection.Order.Status = OrderStatus.QualityFailed;
            inspection.Order.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (inspection.Order != null)
        {
            await _cacheService.RemoveAsync($"order:{inspection.Order.Id}");
            await _cacheService.RemoveAsync("orders:list");
        }

        return new QualityIssueDto
        {
            Id = issue.Id,
            QualityInspectionId = issue.QualityInspectionId,
            AffectedScope = issue.AffectedScope,
            IssueDescription = issue.IssueDescription,
            RootCause = issue.RootCause,
            HandlingPath = issue.HandlingPath,
            CorrectiveAction = issue.CorrectiveAction,
            PreventiveAction = issue.PreventiveAction,
            ReviewNotes = issue.ReviewNotes,
            Status = issue.Status,
            Handler = issue.Handler,
            Reviewer = issue.Reviewer,
            ResolvedAt = issue.ResolvedAt,
            CreatedAt = issue.CreatedAt
        };
    }
}
