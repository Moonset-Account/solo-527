
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IChiefComplaintService
{
    Task&lt;ChiefComplaintDto?&gt; GetByIdAsync(int id);
    Task&lt;ChiefComplaintDto&gt; CreateAsync(ChiefComplaintCreateDto dto);
    Task&lt;List&lt;ChiefComplaintDto&gt;&gt; GetByPatientIdAsync(int patientId);
    Task&lt;ChiefComplaintDto?&gt; GetLatestByPatientIdAsync(int patientId);
}
