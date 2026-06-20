using AutoMapper;
using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Domain.Entities;

namespace MedicalAllocation.Application;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDTO>().ReverseMap();
        CreateMap<User, LoginResponse>();

        CreateMap<Supplier, SupplierDTO>().ReverseMap();

        CreateMap<SupplierReply, SupplierReplyDTO>()
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier != null ? src.Supplier.Name : null))
            .ForMember(dest => dest.SupplierCode, opt => opt.MapFrom(src => src.Supplier != null ? src.Supplier.Code : null))
            .ForMember(dest => dest.MedicineName, opt => opt.MapFrom(src => src.ReplenishmentSuggestion != null && src.ReplenishmentSuggestion.Medicine != null ? src.ReplenishmentSuggestion.Medicine.Name : null))
            .ForMember(dest => dest.MedicineCode, opt => opt.MapFrom(src => src.ReplenishmentSuggestion != null && src.ReplenishmentSuggestion.Medicine != null ? src.ReplenishmentSuggestion.Medicine.Code : null))
            .ForMember(dest => dest.WarehouseName, opt => opt.MapFrom(src => src.ReplenishmentSuggestion != null && src.ReplenishmentSuggestion.Warehouse != null ? src.ReplenishmentSuggestion.Warehouse.Name : null))
            .ForMember(dest => dest.ReplenishmentSuggestedQuantity, opt => opt.MapFrom(src => src.ReplenishmentSuggestion != null ? src.ReplenishmentSuggestion.SuggestedQuantity : null))
            .ForMember(dest => dest.ProcessingDurationHours, opt => opt.MapFrom(src =>
                src.RepliedAt.HasValue ? (int?)Math.Round((src.RepliedAt.Value - src.CreatedAt).TotalHours) : null))
            .ReverseMap();
        CreateMap<SupplierReplyCreateDTO, SupplierReply>();

        CreateMap<AllocationRequest, AllocationRequestDTO>()
            .ForMember(dest => dest.SourceWarehouseName, opt => opt.MapFrom(src => src.SourceWarehouse != null ? src.SourceWarehouse.Name : null))
            .ForMember(dest => dest.TargetWarehouseName, opt => opt.MapFrom(src => src.TargetWarehouse != null ? src.TargetWarehouse.Name : null))
            .ForMember(dest => dest.MedicineName, opt => opt.MapFrom(src => src.Medicine != null ? src.Medicine.Name : null))
            .ForMember(dest => dest.MedicineCode, opt => opt.MapFrom(src => src.Medicine != null ? src.Medicine.Code : null))
            .ForMember(dest => dest.MedicineSpecification, opt => opt.MapFrom(src => src.Medicine != null ? src.Medicine.Specification : null))
            .ForMember(dest => dest.BatchNumber, opt => opt.MapFrom(src => src.Batch != null ? src.Batch.BatchNumber : null))
            .ForMember(dest => dest.RequestedByUserName, opt => opt.MapFrom(src => src.RequestedByUser != null ? src.RequestedByUser.RealName : null))
            .ForMember(dest => dest.ApprovedByUserName, opt => opt.MapFrom(src => src.ApprovedByUser != null ? src.ApprovedByUser.RealName : null))
            .ForMember(dest => dest.ReceivedByUserName, opt => opt.MapFrom(src => src.ReceivedByUser != null ? src.ReceivedByUser.RealName : null));
        CreateMap<AllocationCreateDTO, AllocationRequest>();

        CreateMap<ReplenishmentSuggestion, ReplenishmentSuggestionDTO>()
            .ForMember(dest => dest.MedicineName, opt => opt.MapFrom(src => src.Medicine != null ? src.Medicine.Name : null))
            .ForMember(dest => dest.MedicineCode, opt => opt.MapFrom(src => src.Medicine != null ? src.Medicine.Code : null))
            .ForMember(dest => dest.MedicineSpecification, opt => opt.MapFrom(src => src.Medicine != null ? src.Medicine.Specification : null))
            .ForMember(dest => dest.WarehouseName, opt => opt.MapFrom(src => src.Warehouse != null ? src.Warehouse.Name : null))
            .ForMember(dest => dest.WarehouseCode, opt => opt.MapFrom(src => src.Warehouse != null ? src.Warehouse.Code : null))
            .ForMember(dest => dest.PreferredSupplierName, opt => opt.MapFrom(src => src.PreferredSupplier != null ? src.PreferredSupplier.Name : null))
            .ReverseMap();
        CreateMap<CreateReplenishmentDTO, ReplenishmentSuggestion>();

        CreateMap<ExceptionRecord, ExceptionRecordDTO>()
            .ForMember(dest => dest.AllocationRequestNumber, opt => opt.MapFrom(src => src.AllocationRequest != null ? src.AllocationRequest.RequestNumber : null))
            .ForMember(dest => dest.SupplierReplyNumber, opt => opt.MapFrom(src => src.SupplierReply != null ? src.SupplierReply.PurchaseOrderNumber : null))
            .ForMember(dest => dest.MedicineName, opt => opt.MapFrom(src => src.Medicine != null ? src.Medicine.Name : null))
            .ForMember(dest => dest.MedicineCode, opt => opt.MapFrom(src => src.Medicine != null ? src.Medicine.Code : null))
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier != null ? src.Supplier.Name : null))
            .ForMember(dest => dest.ResponsibleUserName, opt => opt.MapFrom(src => src.ResponsibleUser != null ? src.ResponsibleUser.Username : null))
            .ForMember(dest => dest.ResponsibleUserRealName, opt => opt.MapFrom(src => src.ResponsibleUser != null ? src.ResponsibleUser.RealName : null))
            .ForMember(dest => dest.CreatedByUserName, opt => opt.MapFrom(src => src.CreatedByUser != null ? src.CreatedByUser.RealName : null))
            .ForMember(dest => dest.ResolvedByUserName, opt => opt.MapFrom(src => src.ResolvedByUserId.HasValue && src.CreatedByUser != null ? src.CreatedByUser.RealName : null))
            .ForMember(dest => dest.ProcessingDurationHours, opt => opt.MapFrom(src =>
                src.ResolvedAt.HasValue ? (int?)Math.Round((src.ResolvedAt.Value - src.CreatedAt).TotalHours) : null))
            .ReverseMap();
        CreateMap<ExceptionCreateDTO, ExceptionRecord>();

        CreateMap<DiscrepancyRecord, DiscrepancyRecordDTO>()
            .ForMember(dest => dest.AllocationRequestNumber, opt => opt.MapFrom(src => src.AllocationRequest != null ? src.AllocationRequest.RequestNumber : null))
            .ForMember(dest => dest.SourceWarehouseName, opt => opt.MapFrom(src => src.AllocationRequest != null && src.AllocationRequest.SourceWarehouse != null ? src.AllocationRequest.SourceWarehouse.Name : null))
            .ForMember(dest => dest.TargetWarehouseName, opt => opt.MapFrom(src => src.AllocationRequest != null && src.AllocationRequest.TargetWarehouse != null ? src.AllocationRequest.TargetWarehouse.Name : null))
            .ForMember(dest => dest.MedicineName, opt => opt.MapFrom(src => src.AllocationRequest != null && src.AllocationRequest.Medicine != null ? src.AllocationRequest.Medicine.Name : null))
            .ForMember(dest => dest.MedicineCode, opt => opt.MapFrom(src => src.AllocationRequest != null && src.AllocationRequest.Medicine != null ? src.AllocationRequest.Medicine.Code : null))
            .ForMember(dest => dest.ResponsibleUserName, opt => opt.MapFrom(src => src.ResponsibleUser != null ? src.ResponsibleUser.Username : null))
            .ForMember(dest => dest.ResponsibleUserRealName, opt => opt.MapFrom(src => src.ResponsibleUser != null ? src.ResponsibleUser.RealName : null))
            .ForMember(dest => dest.ResolvedByUserName, opt => opt.MapFrom(src => src.ResolvedByUser != null ? src.ResolvedByUser.RealName : null));
        CreateMap<DiscrepancyRecordDTO, DiscrepancyRecord>();
    }
}
