using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;
using CarWash.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Repositories;

public class PaymentRepository : GenericRepository<Payment>, IPaymentRepository
{
    public PaymentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Payment?> GetByAppointmentIdAsync(Guid appointmentId)
    {
        return await _dbSet.FirstOrDefaultAsync(p => p.AppointmentId == appointmentId);
    }
}
