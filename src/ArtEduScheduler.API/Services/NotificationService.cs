using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface INotificationService
{
    Task SendNotificationAsync(int fromUserId, int toUserId, NotificationType type,
        string title, string content, string? entityType = null, int? entityId = null);
    Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false);
    Task MarkAsReadAsync(int notificationId, int userId);
    Task MarkAllAsReadAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task SendNotificationAsync(int fromUserId, int toUserId, NotificationType type,
        string title, string content, string? entityType = null, int? entityId = null)
    {
        var notification = new Notification
        {
            FromUserId = fromUserId,
            ToUserId = toUserId,
            Type = type,
            Title = title,
            Content = content,
            RelatedEntityType = entityType,
            RelatedEntityId = entityId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
    {
        var query = _context.Notifications.Where(n => n.ToUserId == userId);
        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Include(n => n.FromUser)
            .Take(100)
            .ToListAsync();

        return notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type.ToString(),
            FromUserId = n.FromUserId,
            FromUserName = n.FromUser?.RealName,
            Title = n.Title,
            Content = n.Content,
            IsRead = n.IsRead,
            RelatedEntityType = n.RelatedEntityType,
            RelatedEntityId = n.RelatedEntityId,
            CreatedAt = n.CreatedAt
        }).ToList();
    }

    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.ToUserId == userId);
        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.ToUserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in notifications)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications.CountAsync(n => n.ToUserId == userId && !n.IsRead);
    }
}
