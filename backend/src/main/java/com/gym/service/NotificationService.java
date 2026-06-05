package com.gym.service;

import com.gym.entity.Notification;
import com.gym.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Async
    public void createNotification(String type, String title, String content,
                                    Long receiverId, String receiverType,
                                    String relatedType, Long relatedId) {
        Notification notification = new Notification();
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setReceiverId(receiverId);
        notification.setReceiverType(receiverType);
        notification.setRelatedType(relatedType);
        notification.setRelatedId(relatedId);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    public List<Notification> getUnreadNotifications(Long receiverId, String receiverType) {
        return notificationRepository.findByReceiverIdAndReceiverTypeAndReadFalseOrderByCreatedAtDesc(
                receiverId, receiverType);
    }

    public List<Notification> getAllNotifications(Long receiverId, String receiverType) {
        return notificationRepository.findByReceiverIdAndReceiverTypeOrderByCreatedAtDesc(
                receiverId, receiverType);
    }

    public void markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("通知不存在"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(Long receiverId, String receiverType) {
        List<Notification> notifications = notificationRepository
                .findByReceiverIdAndReceiverTypeAndReadFalseOrderByCreatedAtDesc(receiverId, receiverType);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }
}
