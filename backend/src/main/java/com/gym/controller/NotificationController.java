package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.entity.Notification;
import com.gym.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<Notification>> getNotificationsByUser(@PathVariable Long userId) {
        return ApiResponse.success(notificationService.getNotificationsByUser(userId));
    }

    @GetMapping("/user/{userId}/unread")
    public ApiResponse<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
        return ApiResponse.success(notificationService.getUnreadNotificationsByUser(userId));
    }

    @GetMapping("/user/{userId}/count-unread")
    public ApiResponse<Long> countUnread(@PathVariable Long userId) {
        return ApiResponse.success(notificationService.countUnread(userId));
    }

    @GetMapping("/user/{userId}/page")
    public ApiResponse<Page<Notification>> getNotificationsPage(@PathVariable Long userId, Pageable pageable) {
        return ApiResponse.success(notificationService.getNotificationsByUser(userId, pageable));
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ApiResponse.success(null);
    }

    @PutMapping("/user/{userId}/read-all")
    public ApiResponse<Void> markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
        return ApiResponse.success(null);
    }
}
