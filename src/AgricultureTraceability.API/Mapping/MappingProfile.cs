using AgricultureTraceability.API.Dtos;
using AgricultureTraceability.Domain.Entities;
using AutoMapper;

namespace AgricultureTraceability.API.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<RecordDataDto, EnvironmentData>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Plot, opt => opt.Ignore())
            .ForMember(dest => dest.RecordedAt, opt => opt.Ignore());

        CreateMap<Plot, Plot>().ForMember(dest => dest.Id, opt => opt.Ignore());
        CreateMap<Variety, Variety>().ForMember(dest => dest.Id, opt => opt.Ignore());
        CreateMap<Threshold, Threshold>().ForMember(dest => dest.Id, opt => opt.Ignore());
        CreateMap<HarvestBatch, HarvestBatch>().ForMember(dest => dest.Id, opt => opt.Ignore());
        CreateMap<ApplicationMaterial, ApplicationMaterial>().ForMember(dest => dest.Id, opt => opt.Ignore());
        CreateMap<Order, Order>().ForMember(dest => dest.Id, opt => opt.Ignore());
    }
}
