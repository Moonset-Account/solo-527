
using AutoMapper;
using TicketCounter.Application.DTOs;
using TicketCounter.Application.Interfaces;
using TicketCounter.Domain.Enums;
using E = TicketCounter.Domain.Entities;

namespace TicketCounter.Application.Services;

public interface ISeatService
{
    Task<IEnumerable<SeatDto>> GetBySessionAsync(Guid sessionId);
    Task<SeatDto?> GetByIdAsync(Guid id);
    Task<SeatDto> CreateAsync(CreateSeatDto dto, string operatorName);
    Task<IEnumerable<SeatDto>> BatchCreateAsync(BatchCreateSeatsDto dto, string operatorName);
    Task UpdateAsync(Guid id, UpdateSeatDto dto, string operatorName);
    Task DeleteAsync(Guid id, string operatorName);
    Task BatchUpdateStatusAsync(Guid sessionId, SeatStatus fromStatus, SeatStatus toStatus, string? area, string operatorName);
}

public class SeatService : ISeatService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOperationLogService _logService;

    public SeatService(IUnitOfWork unitOfWork, IMapper mapper, IOperationLogService logService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logService = logService;
    }

    public async Task<IEnumerable<SeatDto>> GetBySessionAsync(Guid sessionId)
    {
        var seats = await _unitOfWork.Seats.FindAsync(s => s.SessionId == sessionId);
        var list = seats.OrderBy(s => s.Area).ThenBy(s => s.Row).ThenBy(s => s.SortOrder).ThenBy(s => s.Number).ToList();
        var dtos = new List<SeatDto>();
        foreach (var s in list)
        {
            var dto = _mapper.Map<SeatDto>(s);
            if (s.RegistrationId.HasValue)
            {
                var reg = await _unitOfWork.Registrations.GetByIdAsync(s.RegistrationId.Value);
                dto.RegistrationName = reg?.Name;
            }
            dtos.Add(dto);
        }
        return dtos;
    }

    public async Task<SeatDto?> GetByIdAsync(Guid id)
    {
        var seat = await _unitOfWork.Seats.GetByIdAsync(id);
        return seat == null ? null : _mapper.Map<SeatDto>(seat);
    }

    public async Task<SeatDto> CreateAsync(CreateSeatDto dto, string operatorName)
    {
        var seat = _mapper.Map<E.Seat>(dto);
        seat.Id = Guid.NewGuid();
        seat.Status = SeatStatus.Available;
        seat.CreatedAt = DateTime.Now;
        await _unitOfWork.Seats.AddAsync(seat);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Create, "Seat", seat.Id.ToString(), seat.SeatCode, operatorName, null, null);
        return _mapper.Map<SeatDto>(seat);
    }

    public async Task<IEnumerable<SeatDto>> BatchCreateAsync(BatchCreateSeatsDto dto, string operatorName)
    {
        var seats = new List<E.Seat>();
        int sortOrder = 0;
        for (int row = dto.StartRow; row <= dto.EndRow; row++)
        {
            for (int num = 1; num <= dto.SeatsPerRow; num++)
            {
                var rowLabel = string.IsNullOrEmpty(dto.RowPrefix) ? row.ToString() : $"{dto.RowPrefix}{row}";
                seats.Add(new E.Seat
                {
                    Id = Guid.NewGuid(),
                    SessionId = dto.SessionId,
                    SeatCode = $"{rowLabel}-{num:D2}",
                    Row = rowLabel,
                    Number = num,
                    Area = dto.Area,
                    Status = SeatStatus.Available,
                    TicketType = dto.TicketType,
                    SortOrder = sortOrder++,
                    CreatedAt = DateTime.Now
                });
            }
        }
        await _unitOfWork.Seats.AddRangeAsync(seats);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Create, "Seat", "BATCH", $"批量创建{seats.Count}个座位", operatorName, null, null);
        return seats.Select(s => _mapper.Map<SeatDto>(s));
    }

    public async Task UpdateAsync(Guid id, UpdateSeatDto dto, string operatorName)
    {
        var seat = await _unitOfWork.Seats.GetByIdAsync(id);
        if (seat == null) throw new KeyNotFoundException($"座位不存在: {id}");
        var original = Newtonsoft.Json.JsonConvert.SerializeObject(seat);
        _mapper.Map(dto, seat);
        seat.UpdatedAt = DateTime.Now;
        await _unitOfWork.Seats.UpdateAsync(seat);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Update, "Seat", id.ToString(), seat.SeatCode, operatorName, original, Newtonsoft.Json.JsonConvert.SerializeObject(seat));
    }

    public async Task DeleteAsync(Guid id, string operatorName)
    {
        var seat = await _unitOfWork.Seats.GetByIdAsync(id);
        if (seat == null) throw new KeyNotFoundException($"座位不存在: {id}");
        await _unitOfWork.Seats.DeleteAsync(seat);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Delete, "Seat", id.ToString(), seat.SeatCode, operatorName, null, null);
    }

    public async Task BatchUpdateStatusAsync(Guid sessionId, SeatStatus fromStatus, SeatStatus toStatus, string? area, string operatorName)
    {
        var seats = (await _unitOfWork.Seats.FindAsync(s => s.SessionId == sessionId && s.Status == fromStatus && (area == null || s.Area == area))).ToList();
        foreach (var seat in seats)
        {
            seat.Status = toStatus;
            seat.UpdatedAt = DateTime.Now;
            await _unitOfWork.Seats.UpdateAsync(seat);
        }
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Update, "Seat", "BATCH", $"批量更新{seats.Count}个座位状态: {fromStatus}->{toStatus}", operatorName, null, null);
    }
}

public interface ITicketStockService
{
    Task<IEnumerable<TicketStockDto>> GetBySessionAsync(Guid sessionId);
    Task<TicketStockDto?> GetByIdAsync(Guid id);
    Task<TicketStockDto> CreateAsync(CreateTicketStockDto dto, string operatorName);
    Task UpdateAsync(Guid id, UpdateTicketStockDto dto, string operatorName);
    Task DeleteAsync(Guid id, string operatorName);
    Task RefreshInventoryOccupancyAsync(Guid? sessionId = null);
}

public class TicketStockService : ITicketStockService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOperationLogService _logService;

    public TicketStockService(IUnitOfWork unitOfWork, IMapper mapper, IOperationLogService logService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logService = logService;
    }

    public async Task<IEnumerable<TicketStockDto>> GetBySessionAsync(Guid sessionId)
    {
        var stocks = await _unitOfWork.TicketStocks.FindAsync(t => t.SessionId == sessionId);
        return stocks.Select(s => _mapper.Map<TicketStockDto>(s)).OrderBy(t => t.TicketType);
    }

    public async Task<TicketStockDto?> GetByIdAsync(Guid id)
    {
        var stock = await _unitOfWork.TicketStocks.GetByIdAsync(id);
        return stock == null ? null : _mapper.Map<TicketStockDto>(stock);
    }

    public async Task<TicketStockDto> CreateAsync(CreateTicketStockDto dto, string operatorName)
    {
        var stock = _mapper.Map<E.TicketStock>(dto);
        stock.Id = Guid.NewGuid();
        stock.ReservedQuantity = 0;
        stock.SoldQuantity = 0;
        stock.CreatedAt = DateTime.Now;
        await _unitOfWork.TicketStocks.AddAsync(stock);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Create, "TicketStock", stock.Id.ToString(), stock.TicketTypeName, operatorName, null, null);
        return _mapper.Map<TicketStockDto>(stock);
    }

    public async Task UpdateAsync(Guid id, UpdateTicketStockDto dto, string operatorName)
    {
        var stock = await _unitOfWork.TicketStocks.GetByIdAsync(id);
        if (stock == null) throw new KeyNotFoundException($"票种库存不存在: {id}");
        var original = Newtonsoft.Json.JsonConvert.SerializeObject(stock);
        _mapper.Map(dto, stock);
        stock.UpdatedAt = DateTime.Now;
        await _unitOfWork.TicketStocks.UpdateAsync(stock);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Update, "TicketStock", id.ToString(), stock.TicketTypeName, operatorName, original, Newtonsoft.Json.JsonConvert.SerializeObject(stock));
    }

    public async Task DeleteAsync(Guid id, string operatorName)
    {
        var stock = await _unitOfWork.TicketStocks.GetByIdAsync(id);
        if (stock == null) throw new KeyNotFoundException($"票种库存不存在: {id}");
        await _unitOfWork.TicketStocks.DeleteAsync(stock);
        await _unitOfWork.SaveChangesAsync();
        await _logService.LogAsync(AuditAction.Delete, "TicketStock", id.ToString(), stock.TicketTypeName, operatorName, null, null);
    }

    public async Task RefreshInventoryOccupancyAsync(Guid? sessionId = null)
    {
        var sessions = sessionId.HasValue
            ? new[] { (await _unitOfWork.Sessions.GetByIdAsync(sessionId.Value))! }.Where(s => s != null)
            : await _unitOfWork.Sessions.GetAllAsync();

        foreach (var session in sessions)
        {
            var ticketTypes = Enum.GetValues<TicketType>();
            foreach (var tType in ticketTypes)
            {
                var seatsByType = (await _unitOfWork.Seats.FindAsync(s => s.SessionId == session.Id && s.TicketType == tType)).ToList();
                if (!seatsByType.Any()) continue;

                var totalCapacity = seatsByType.Count;
                var approvedIds = (await _unitOfWork.Registrations.FindAsync(r => r.SessionId == session.Id && r.Status == RegistrationStatus.Approved && r.TicketType == tType)).Select(r => r.Id).ToList();
                var approvedOccupancy = seatsByType.Count(s => s.RegistrationId.HasValue && approvedIds.Contains(s.RegistrationId.Value));
                var pendingIds = (await _unitOfWork.Registrations.FindAsync(r => r.SessionId == session.Id && r.Status == RegistrationStatus.Pending && r.TicketType == tType)).Select(r => r.Id).ToList();
                var pendingOccupancy = seatsByType.Count(s => s.RegistrationId.HasValue && pendingIds.Contains(s.RegistrationId.Value));
                var missingIds = (await _unitOfWork.Registrations.FindAsync(r => r.SessionId == session.Id && r.HasMissingData && r.TicketType == tType)).Select(r => r.Id).ToList();
                var missingOccupancy = seatsByType.Count(s => s.RegistrationId.HasValue && missingIds.Contains(s.RegistrationId.Value));
                var reservedOccupancy = seatsByType.Count(s => s.Status == SeatStatus.Reserved);
                var available = totalCapacity - approvedOccupancy - pendingOccupancy - missingOccupancy - reservedOccupancy;

                var existing = (await _unitOfWork.InventoryOccupancies.FindAsync(i => i.SessionId == session.Id && i.TicketType == tType)).FirstOrDefault();
                if (existing == null)
                {
                    await _unitOfWork.InventoryOccupancies.AddAsync(new E.InventoryOccupancy
                    {
                        Id = Guid.NewGuid(),
                        SessionId = session.Id,
                        TicketType = tType,
                        TotalCapacity = totalCapacity,
                        ApprovedOccupancy = approvedOccupancy,
                        PendingReviewOccupancy = pendingOccupancy,
                        MissingDataOccupancy = missingOccupancy,
                        ReservedOccupancy = reservedOccupancy,
                        AvailableCount = available < 0 ? 0 : available,
                        UpdatedAt = DateTime.Now
                    });
                }
                else
                {
                    existing.TotalCapacity = totalCapacity;
                    existing.ApprovedOccupancy = approvedOccupancy;
                    existing.PendingReviewOccupancy = pendingOccupancy;
                    existing.MissingDataOccupancy = missingOccupancy;
                    existing.ReservedOccupancy = reservedOccupancy;
                    existing.AvailableCount = available < 0 ? 0 : available;
                    existing.UpdatedAt = DateTime.Now;
                    await _unitOfWork.InventoryOccupancies.UpdateAsync(existing);
                }
            }
        }
        await _unitOfWork.SaveChangesAsync();
    }
}
