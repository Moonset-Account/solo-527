package com.property.controller;

import com.property.common.Result;
import com.property.entity.SysMessage;
import com.property.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @GetMapping
    public Result<List<SysMessage>> getMyMessages(
            @RequestParam(required = false) String isRead,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(messageService.getMyMessages(isRead, page, size));
    }

    @PostMapping("/{id}/read")
    public Result<Void> markAsRead(@PathVariable Long id) {
        messageService.markAsRead(id);
        return Result.success();
    }

    @GetMapping("/unread/count")
    public Result<Map<String, Object>> getUnreadCount() {
        long count = messageService.getUnreadCount();
        Map<String, Object> result = new HashMap<>();
        result.put("count", count);
        return Result.success(result);
    }
}
