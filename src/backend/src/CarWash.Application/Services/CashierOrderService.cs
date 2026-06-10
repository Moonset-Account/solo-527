using CarWash.Application.DTOs;
using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;

namespace CarWash.Application.Services;

public class CashierOrderService : ICashierOrderService
{
    private readonly IRepository<CashierOrder> _cashierOrderRepository;
    private readonly IRepository<CashierOrderItem> _cashierOrderItemRepository;
    private readonly IRepository<Appointment> _appointmentRepository;
    private readonly IRepository<Customer> _customerRepository;
    private readonly IAuditLogService _auditLogService;

    public CashierOrderService(
        IRepository<CashierOrder> cashierOrderRepository,
        IRepository<CashierOrderItem> cashierOrderItemRepository,
        IRepository<Appointment> appointmentRepository,
        IRepository<Customer> customerRepository,
        IAuditLogService auditLogService)
    {
        _cashierOrderRepository = cashierOrderRepository;
        _cashierOrderItemRepository = cashierOrderItemRepository;
        _appointmentRepository = appointmentRepository;
        _customerRepository = customerRepository;
        _auditLogService = auditLogService;
    }

    public async Task<CashierOrderDto> CreateAsync(CreateCashierOrderRequest request, CancellationToken cancellationToken = default)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(request.AppointmentId, cancellationToken);
        if (appointment == null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        var subtotal = request.Items.Sum(i => i.Quantity * i.UnitPrice);
        var total = subtotal - request.Discount;

        var order = new CashierOrder
        {
            Id = Guid.NewGuid(),
            AppointmentId = request.AppointmentId,
            CustomerId = appointment.CustomerId,
            Subtotal = subtotal,
            Discount = request.Discount,
            Total = total,
            PaymentMethod = request.PaymentMethod,
            PaymentStatus = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdOrder = await _cashierOrderRepository.AddAsync(order, cancellationToken);

        var items = new List<CashierOrderItem>();
        foreach (var item in request.Items)
        {
            var orderItem = new CashierOrderItem
            {
                Id = Guid.NewGuid(),
                CashierOrderId = createdOrder.Id,
                ServiceName = item.ServiceName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                PartsUsed = item.PartsUsed.Count > 0 ? string.Join(",", item.PartsUsed) : null
            };
            items.Add(orderItem);
        }

        await _cashierOrderItemRepository.AddRangeAsync(items, cancellationToken);

        return await MapToDto(createdOrder, items, cancellationToken);
    }

    public async Task<CashierOrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _cashierOrderRepository.GetByIdAsync(id, cancellationToken);
        if (order == null) return null;

        var items = await _cashierOrderItemRepository.GetAsync(
            i => i.CashierOrderId == id,
            cancellationToken);

        return await MapToDto(order, items.ToList(), cancellationToken);
    }

    public async Task<List<CashierOrderDto>> GetByAppointmentIdAsync(Guid appointmentId, CancellationToken cancellationToken = default)
    {
        var orders = await _cashierOrderRepository.GetAsync(
            o => o.AppointmentId == appointmentId,
            cancellationToken);

        var dtos = new List<CashierOrderDto>();
        foreach (var order in orders.OrderByDescending(o => o.CreatedAt))
        {
            var items = await _cashierOrderItemRepository.GetAsync(
                i => i.CashierOrderId == order.Id,
                cancellationToken);

            dtos.Add(await MapToDto(order, items.ToList(), cancellationToken));
        }

        return dtos;
    }

    public async Task<List<CashierOrderDto>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var orders = await _cashierOrderRepository.GetAsync(
            o => o.CustomerId == customerId,
            cancellationToken);

        var dtos = new List<CashierOrderDto>();
        foreach (var order in orders.OrderByDescending(o => o.CreatedAt))
        {
            var items = await _cashierOrderItemRepository.GetAsync(
                i => i.CashierOrderId == order.Id,
                cancellationToken);

            dtos.Add(await MapToDto(order, items.ToList(), cancellationToken));
        }

        return dtos;
    }

    public async Task<CashierOrderDto> UpdatePaymentStatusAsync(Guid id, UpdateCashierOrderStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var order = await _cashierOrderRepository.GetByIdAsync(id, cancellationToken);
        if (order == null)
            throw new KeyNotFoundException($"CashierOrder with id {id} not found");

        var oldStatus = order.PaymentStatus;
        order.PaymentStatus = request.PaymentStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _cashierOrderRepository.UpdateAsync(order, cancellationToken);

        if (oldStatus != request.PaymentStatus)
        {
            await _auditLogService.LogAsync(
                "cashier_order",
                id,
                "status_changed",
                oldStatus,
                request.PaymentStatus,
                Guid.Empty,
                "System",
                null,
                cancellationToken);
        }

        var items = await _cashierOrderItemRepository.GetAsync(
            i => i.CashierOrderId == id,
            cancellationToken);

        return await MapToDto(order, items.ToList(), cancellationToken);
    }

    private async Task<CashierOrderDto> MapToDto(CashierOrder order, List<CashierOrderItem> items,
        CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(order.CustomerId, cancellationToken);

        var itemDtos = items.Select(i => new CashierOrderItemDto
        {
            Id = i.Id,
            ServiceName = i.ServiceName,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            PartsUsed = string.IsNullOrEmpty(i.PartsUsed)
                ? new List<string>()
                : i.PartsUsed.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
        }).ToList();

        return new CashierOrderDto
        {
            Id = order.Id,
            AppointmentId = order.AppointmentId,
            CustomerId = order.CustomerId,
            CustomerName = customer?.Name ?? string.Empty,
            Items = itemDtos,
            Subtotal = order.Subtotal,
            Discount = order.Discount,
            Total = order.Total,
            PaymentMethod = order.PaymentMethod,
            PaymentStatus = order.PaymentStatus,
            CreatedAt = order.CreatedAt
        };
    }
}
