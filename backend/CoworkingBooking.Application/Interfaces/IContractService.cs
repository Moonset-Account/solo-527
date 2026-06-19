using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Contract;

namespace CoworkingBooking.Application.Interfaces;

public interface IContractService
{
    Task<ApiResponse<PagedResult<ContractDto>>> GetListAsync(ContractQuery query);
    Task<ApiResponse<ContractDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<ContractDto>> CreateAsync(CreateContractRequest request, Guid? operatorId);
    Task<ApiResponse> SignAsync(Guid id, SignContractRequest request, Guid operatorId);
    Task<ApiResponse> TerminateAsync(Guid id, string reason, Guid operatorId);
    Task<ApiResponse<PagedResult<BillDto>>> GetBillsAsync(BillQuery query);
    Task<ApiResponse<BillDto>> GetBillByIdAsync(Guid id);
    Task<ApiResponse<BillDto>> CreateBillAsync(CreateBillRequest request, Guid? operatorId);
    Task<ApiResponse> PayBillAsync(Guid billId, PayBillRequest request, Guid? operatorId);
    Task<ApiResponse<byte[]>> ExportContractsAsync(ContractQuery query);
    Task<ApiResponse<byte[]>> ExportBillsAsync(BillQuery query);
}
