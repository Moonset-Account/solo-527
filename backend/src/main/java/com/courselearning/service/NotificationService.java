package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.courselearning.common.PageResult;
import com.courselearning.entity.Notification;
import com.courselearning.mapper.NotificationMapper;
import com.courselearning.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationMapper notificationMapper;

    public PageResult<Notification> getNotificationList(Long pageNum, Long pageSize, String type, Boolean isRead) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<Notification> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, userId);
        if (type != null && !type.isEmpty()) {
            wrapper.eq(Notification::getType, type);
        }
        if (isRead != null) {
            wrapper.eq(Notification::getIsRead, isRead ? 1 : 0);
        }
        wrapper.orderByDesc(Notification::getCreatedAt);
        Page<Notification> result = notificationMapper.selectPage(page, wrapper);
        return PageResult.of(result.getTotal(), result.getRecords(), pageNum, pageSize);
    }

    @Transactional(rollbackFor = Exception.class)
    public void markAsRead(Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        Notification notification = notificationMapper.selectById(id);
        if (notification != null && notification.getUserId().equals(userId)) {
            notification.setIsRead(1);
            notificationMapper.updateById(notification);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void markAllAsRead() {
        Long userId = SecurityUtils.getCurrentUserId();
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0);
        List<Notification> unreadList = notificationMapper.selectList(wrapper);
        for (Notification n : unreadList) {
            n.setIsRead(1);
            notificationMapper.updateById(n);
        }
    }

    public Map<String, Object> getUnreadCount() {
        Long userId = SecurityUtils.getCurrentUserId();
        Map<String, Object> result = new HashMap<>();

        LambdaQueryWrapper<Notification> totalWrapper = new LambdaQueryWrapper<>();
        totalWrapper.eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0);
        Long total = notificationMapper.selectCount(totalWrapper);
        result.put("total", total);

        LambdaQueryWrapper<Notification> typeWrapper = new LambdaQueryWrapper<>();
        typeWrapper.eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0);
        List<Notification> unreadList = notificationMapper.selectList(typeWrapper);

        Map<String, Long> typeCount = new HashMap<>();
        for (Notification n : unreadList) {
            String type = n.getType() != null ? n.getType() : "OTHER";
            typeCount.merge(type, 1L, Long::sum);
        }
        result.put("byType", typeCount);

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public Notification createNotification(Long userId, String type, String title, String content, Long relatedId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRelatedId(relatedId);
        notification.setIsRead(0);
        notification.setCreatedAt(LocalDateTime.now());
        notificationMapper.insert(notification);
        return notification;
    }

    @Transactional(rollbackFor = Exception.class)
    public void sendCommissionDisputeNotification(Long userId, Long orderId, String orderNo) {
        createNotification(
                userId,
                "COMMISSION_DISPUTE",
                "佣金争议通知",
                "您有一笔订单的佣金存在争议，请联系客服处理。订单号：" + orderNo,
                orderId
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void sendOrderPaidNotification(Long userId, String orderNo) {
        createNotification(
                userId,
                "ORDER_PAID",
                "订单支付成功",
                "您的订单支付成功！订单号：" + orderNo,
                null
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void sendSystemNotification(String title, String content) {
        List<Long> allUserIds = new ArrayList<>();
        LambdaQueryWrapper<com.courselearning.entity.SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(com.courselearning.entity.SysUser::getStatus, 1);
        wrapper.select(com.courselearning.entity.SysUser::getId);

        for (Long userId : allUserIds) {
            createNotification(userId, "SYSTEM", title, content, null);
        }
    }
}
