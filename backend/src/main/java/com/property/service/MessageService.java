package com.property.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.property.common.enums.MessageTypeEnum;
import com.property.common.enums.UserRoleEnum;
import com.property.common.enums.WorkOrderPriorityEnum;
import com.property.entity.SysMessage;
import com.property.entity.SysUser;
import com.property.mapper.SysMessageMapper;
import com.property.mapper.SysUserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;


@Service
public class MessageService {

    private static final Logger log = LoggerFactory.getLogger(MessageService.class);

    @Autowired
    private SysMessageMapper sysMessageMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String MESSAGE_CACHE_PREFIX = "property:message:unread:";

    @Async
    public void sendMessage(Long receiverId, Long senderId, MessageTypeEnum type, String title, String content,
                            String relatedType, Long relatedId, String priority) {
        SysMessage message = new SysMessage();
        message.setReceiverId(receiverId);
        message.setSenderId(senderId);
        message.setMessageType(type.getCode());
        message.setTitle(title);
        message.setContent(content);
        message.setRelatedType(relatedType);
        message.setRelatedId(relatedId);
        message.setIsRead(0);
        message.setPriority(priority != null ? priority : WorkOrderPriorityEnum.NORMAL.getCode());

        sysMessageMapper.insert(message);

        redisTemplate.opsForValue().increment(MESSAGE_CACHE_PREFIX + receiverId);
        redisTemplate.expire(MESSAGE_CACHE_PREFIX + receiverId, 24, TimeUnit.HOURS);

        log.info("消息发送成功: receiverId={}, title={}, priority={}", receiverId, title, message.getPriority());
    }

    @Async
    public void sendMessageToAdmins(MessageTypeEnum type, String title, String content, Long relatedId) {
        List<SysUser> admins = sysUserMapper.selectList(
                new LambdaQueryWrapper<SysUser>()
                        .in(SysUser::getRole, UserRoleEnum.ADMIN.getCode(), UserRoleEnum.PROPERTY.getCode())
                        .eq(SysUser::getStatus, 1)
        );

        for (SysUser admin : admins) {
            sendMessage(admin.getId(), null, type, title, content, "WORK_ORDER", relatedId, WorkOrderPriorityEnum.NORMAL.getCode());
        }
    }

    @Async
    public void sendUrgentMessageToAdmins(String title, String content, Long relatedId) {
        List<SysUser> admins = sysUserMapper.selectList(
                new LambdaQueryWrapper<SysUser>()
                        .in(SysUser::getRole, UserRoleEnum.ADMIN.getCode(), UserRoleEnum.PROPERTY.getCode())
                        .eq(SysUser::getStatus, 1)
        );

        for (SysUser admin : admins) {
            sendMessage(admin.getId(), null, MessageTypeEnum.URGENT_REMIND, title, content,
                    "WORK_ORDER", relatedId, WorkOrderPriorityEnum.URGENT.getCode());
        }

        log.warn("紧急消息已发送给所有管理员: relatedId={}", relatedId);
    }

    public List<SysMessage> getMyMessages(String isRead, int page, int size) {
        Long userId = com.property.common.UserContext.getUserId();

        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysMessage::getReceiverId, userId);

        if (StrUtil.isNotBlank(isRead)) {
            wrapper.eq(SysMessage::getIsRead, "1".equals(isRead) ? 1 : 0);
        }

        wrapper.orderByDesc(SysMessage::getCreatedAt);
        wrapper.last("LIMIT " + size + " OFFSET " + (page - 1) * size);

        List<SysMessage> messages = sysMessageMapper.selectList(wrapper);
        messages.forEach(this::fillMessageInfo);

        return messages;
    }

    public void markAsRead(Long messageId) {
        Long userId = com.property.common.UserContext.getUserId();
        SysMessage message = sysMessageMapper.selectById(messageId);

        if (message != null && message.getReceiverId().equals(userId) && message.getIsRead() == 0) {
            message.setIsRead(1);
            message.setReadTime(LocalDateTime.now());
            sysMessageMapper.updateById(message);

            redisTemplate.opsForValue().decrement(MESSAGE_CACHE_PREFIX + userId);
        }
    }

    public long getUnreadCount() {
        Long userId = com.property.common.UserContext.getUserId();

        try {
            Long count = (Long) redisTemplate.opsForValue().get(MESSAGE_CACHE_PREFIX + userId);
            if (count != null && count > 0) {
                return count;
            }
        } catch (Exception e) {
            // ignore
        }

        long count = sysMessageMapper.selectCount(
                new LambdaQueryWrapper<SysMessage>()
                        .eq(SysMessage::getReceiverId, userId)
                        .eq(SysMessage::getIsRead, 0)
        );

        redisTemplate.opsForValue().set(MESSAGE_CACHE_PREFIX + userId, count, 24, TimeUnit.HOURS);

        return count;
    }

    private void fillMessageInfo(SysMessage message) {
        if (message.getSenderId() != null) {
            SysUser sender = sysUserMapper.selectById(message.getSenderId());
            if (sender != null) {
                message.setSenderName(sender.getRealName());
            }
        }
    }
}
