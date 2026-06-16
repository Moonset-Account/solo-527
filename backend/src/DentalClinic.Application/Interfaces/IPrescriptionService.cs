
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IPrescriptionService
{
    Task&lt;PrescriptionDto?&gt; GetByIdAsync(int id);
    Task&lt;PrescriptionDto&gt; CreateAsync(PrescriptionCreateDto dto);
    Task&lt;List&lt;PrescriptionDto&gt;&gt; GetByPatientIdAsync(int patientId);
    Task&lt;List&lt;PrescriptionDto&gt;&gt; GetByAppointmentIdAsync(int appointmentId);
}
