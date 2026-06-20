
using AutoMapper;
using TicketCounter.Application.DTOs;
using TicketCounter.Application.Interfaces;
using TicketCounter.Domain.Enums;
using E = TicketCounter.Domain.Entities;

namespace TicketCounter.Application.Services;

public interface ISessionService
{
    Task<IEnumerable<SessionDto>> GetAllAsync();
    Task<SessionDto?> GetByIdAsync(Guid id);
    Task<SessionDto> CreateAsync(CreateSessionDto dto, string operatorName);
    Task UpdateAsync(Guid id, UpdateSessionDto dto, string operatorName);
    Task DeleteAsync(Guid id, string operatorName);
    Task ChangeStatusAsync(Guid id, SessionStatus status, string operatorName);
}

public class SessionService : ISessionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOperationLogService _logService;

    public SessionService(IUnitOfWork unitOfWork, IMapper mapper, IOperationLogService logService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logService = logService;
    }

    public async Task<IEnumerable<SessionDto>> GetAllAsync()
    {
        var sessions = await _unitOfWork.Sessions.GetAllAsync();
        var list = sessions.OrderBy(s => s.SortOrder).ThenBy(s => s.StartTime).ToList();
        var dtos = new List<SessionDto>();
        foreach (var s in list)
        {
            var dto = _mapper.Map<SessionDto>(s);
            dto.SeatCount = (await _unitOfWork.Seats.CountAsync(x => x.SessionId == s.Id));
            dto.SoldSeatCount = (await _unitOfWork.Seats.CountAsync(x => x.SessionId == s.Id && x.Status == SeatStatus.Sold));
            dtos.Add(dto);
        }
        return dtos;
    }

    public async Task<SessionDto?> GetByIdAsync(Guid id)
    {
        var session = await _unitOfWork.Sessions.GetByIdAsync(id);
        if (session == null) return null;
        var dto = _mapper.Map<SessionDto>(session);
        dto.SeatCount = (await _unitOfWork.Seats.CountAsync(x => x.SessionId == id));
        dto.SoldSeatCount = (await _unitOfWork.Seats.CountAsync(x => x.SessionId == id && x.Status == SeatStatus.Sold));
        return dto;
    }

    public async Task<SessionDto> CreateAsync(CreateSessionDto dto, string operatorName)
    {
        var session = _mapper.Map<E.Session>(dto);
        session.Id = Guid.NewGuid();
        session.Status = SessionStatus.Draft;
        session.CreatedAt = DateTime.Now;
        session.CreatedBy = operatorName;
        await _unitOfWork.Sessions.AddAsync(session);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Create, "Session", session.Id.ToString(), session.Name, operatorName, null, null);
        return _mapper.Map<SessionDto>(session);
    }

    public async Task UpdateAsync(Guid id, UpdateSessionDto dto, string operatorName)
    {
        var session = await _unitOfWork.Sessions.GetByIdAsync(id);
        if (session == null) throw new KeyNotFoundException($"场次不存在: {id}");
        var original = Newtonsoft.Json.JsonConvert.SerializeObject(session);
        _mapper.Map(dto, session);
        session.UpdatedAt = DateTime.Now;
        session.UpdatedBy = operatorName;
        await _unitOfWork.Sessions.UpdateAsync(session);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Update, "Session", session.Id.ToString(), session.Name, operatorName, original, Newtonsoft.Json.JsonConvert.SerializeObject(session));
    }

    public async Task DeleteAsync(Guid id, string operatorName)
    {
        var session = await _unitOfWork.Sessions.GetByIdAsync(id);
        if (session == null) throw new KeyNotFoundException($"场次不存在: {id}");
        await _unitOfWork.Sessions.DeleteAsync(session);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Delete, "Session", id.ToString(), session.Name, operatorName, null, null);
    }

    public async Task ChangeStatusAsync(Guid id, SessionStatus status, string operatorName)
    {
        var session = await _unitOfWork.Sessions.GetByIdAsync(id);
        if (session == null) throw new KeyNotFoundException($"场次不存在: {id}");
        var original = session.Status.ToString();
        session.Status = status;
        session.UpdatedAt = DateTime.Now;
        session.UpdatedBy = operatorName;
        await _unitOfWork.Sessions.UpdateAsync(session);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Update, "Session", id.ToString(), session.Name, operatorName, original, status.ToString(), "Status");
    }
}
