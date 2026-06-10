package com.courselearning.controller;

import com.courselearning.common.PageResult;
import com.courselearning.common.Result;
import com.courselearning.entity.Notification;
import com.courselearning.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notification")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/list")
    public Result<PageResult<Notification>> list(
            @RequestParam(defaultValue = "1") Long pageNum,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean isRead) {
        PageResult<Notification> result = notificationService.getNotificationList(pageNum, pageSize, type, isRead);
        return Result.success(result);
    }

    @PutMapping("/read")
    public Result<Void> markAsRead(@RequestParam(required = false) Long id,
                                   @RequestParam(defaultValue = "false") Boolean all) {
        if (all) {
            notificationService.markAllAsRead();
        } else if (id != null) {
            notificationService.markAsRead(id);
        }
        return Result.success("标记已读成功", null);
    }

    @GetMapping("/unread-count")
    public Result<Map<String, Object>> unreadCount() {
        Map<String, Object> result = notificationService.getUnreadCount();
        return Result.success(result);
    }
}
