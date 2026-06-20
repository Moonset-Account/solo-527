
using AutoMapper;
using TicketCounter.Application.DTOs;
using TicketCounter.Domain.Entities;

namespace TicketCounter.Application;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Session, SessionDto>().ReverseMap();
        CreateMap<CreateSessionDto, Session>();
        CreateMap<UpdateSessionDto, Session>();

        CreateMap<Seat, SeatDto>().ReverseMap();
        CreateMap<CreateSeatDto, Seat>();
        CreateMap<UpdateSeatDto, Seat>();

        CreateMap<TicketStock, TicketStockDto>().ReverseMap();
        CreateMap<CreateTicketStockDto, TicketStock>();
        CreateMap<UpdateTicketStockDto, TicketStock>();

        CreateMap<Registration, RegistrationDto>().ReverseMap();
        CreateMap<CreateRegistrationDto, Registration>();
        CreateMap<RegistrationAudit, RegistrationAuditDto>().ReverseMap();

        CreateMap<TodoItem, TodoItemDto>().ReverseMap();
        CreateMap<CreateTodoItemDto, TodoItem>();

        CreateMap<OperationLog, OperationLogDto>().ReverseMap();

        CreateMap<ApiRetryRecord, ApiRetryRecordDto>().ReverseMap();

        CreateMap<InventoryOccupancy, InventoryOccupancyDto>().ReverseMap();
    }
}
