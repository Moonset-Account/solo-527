using Microsoft.AspNetCore.SignalR;

namespace CarWash.WebAPI.Hubs;

public class NotificationHub : Hub
{
    public async Task SendNotification(string message)
    {
        await Clients.All.SendAsync("ReceiveNotification", message);
    }

    public async Task SendNotificationToUser(string userId, string message)
    {
        await Clients.User(userId).SendAsync("ReceiveNotification", message);
    }

    public async Task NotifyAppointmentUpdated(string appointmentId, string status)
    {
        await Clients.All.SendAsync("AppointmentUpdated", new
        {
            AppointmentId = appointmentId,
            Status = status,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyTechnicianStatusUpdated(string technicianId, string status)
    {
        await Clients.All.SendAsync("TechnicianStatusUpdated", new
        {
            TechnicianId = technicianId,
            Status = status,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyWorkstationStatusUpdated(string workstationId, string status)
    {
        await Clients.All.SendAsync("WorkstationStatusUpdated", new
        {
            WorkstationId = workstationId,
            Status = status,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyPartsShortageUpdated(string partsShortageId, string status)
    {
        await Clients.All.SendAsync("PartsShortageUpdated", new
        {
            PartsShortageId = partsShortageId,
            Status = status,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task JoinDashboardGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Dashboard");
    }

    public async Task LeaveDashboardGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Dashboard");
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
