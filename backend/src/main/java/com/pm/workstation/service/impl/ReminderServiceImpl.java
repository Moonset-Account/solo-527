package com.pm.workstation.service.impl;

import com.pm.workstation.dto.ReminderRuleDTO;
import com.pm.workstation.entity.Comment;
import com.pm.workstation.entity.MeetingMinutes;
import com.pm.workstation.entity.ProcessInstance;
import com.pm.workstation.entity.ProcessInstanceNode;
import com.pm.workstation.entity.ProcessNode;
import com.pm.workstation.entity.ReminderLog;
import com.pm.workstation.entity.ReminderRule;
import com.pm.workstation.entity.TodoItem;
import com.pm.workstation.enums.NodeStatus;
import com.pm.workstation.enums.ProcessStatus;
import com.pm.workstation.enums.ReminderLogStatus;
import com.pm.workstation.enums.ReminderType;
import com.pm.workstation.enums.TargetType;
import com.pm.workstation.enums.TodoStatus;
import com.pm.workstation.repository.CommentRepository;
import com.pm.workstation.repository.MeetingMinutesRepository;
import com.pm.workstation.repository.ProcessInstanceNodeRepository;
import com.pm.workstation.repository.ProcessInstanceRepository;
import com.pm.workstation.repository.ProcessNodeRepository;
import com.pm.workstation.repository.ReminderLogRepository;
import com.pm.workstation.repository.ReminderRuleRepository;
import com.pm.workstation.repository.TodoItemRepository;
import com.pm.workstation.service.AuditLogService;
import com.pm.workstation.service.ReminderService;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReminderServiceImpl implements ReminderService {

    @Autowired
    private ReminderRuleRepository reminderRuleRepository;

    @Autowired
    private ReminderLogRepository reminderLogRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TodoItemRepository todoItemRepository;

    @Autowired
    private MeetingMinutesRepository meetingMinutesRepository;

    @Autowired
    private ProcessInstanceRepository processInstanceRepository;

    @Autowired
    private ProcessInstanceNodeRepository processInstanceNodeRepository;

    @Autowired
    private ProcessNodeRepository processNodeRepository;

    @Override
    @Transactional
    public ReminderRule createRule(ReminderRuleDTO dto) {
        ReminderRule rule = new ReminderRule();
        rule.setRuleName(dto.getRuleName());
        rule.setRuleType(dto.getRuleType());
        if (dto.getTriggerHours() != null) {
            rule.setTriggerCondition("{\"hours\":" + dto.getTriggerHours() + "}");
        } else {
            rule.setTriggerCondition(dto.getTriggerCondition());
        }
        rule.setRemindMethod(dto.getRemindMethod());
        rule.setRemindBeforeHours(dto.getRemindBeforeHours());
        rule.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : true);
        LocalDateTime now = LocalDateTime.now();
        rule.setCreatedAt(now);
        rule.setUpdatedAt(now);
        return reminderRuleRepository.save(rule);
    }

    @Override
    @Transactional
    public ReminderRule updateRule(Long id, ReminderRuleDTO dto) {
        ReminderRule rule = reminderRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("提醒规则不存在"));
        rule.setRuleName(dto.getRuleName());
        rule.setRuleType(dto.getRuleType());
        if (dto.getTriggerHours() != null) {
            rule.setTriggerCondition("{\"hours\":" + dto.getTriggerHours() + "}");
        } else if (dto.getTriggerCondition() != null) {
            rule.setTriggerCondition(dto.getTriggerCondition());
        }
        if (dto.getRemindMethod() != null) {
            rule.setRemindMethod(dto.getRemindMethod());
        }
        if (dto.getRemindBeforeHours() != null) {
            rule.setRemindBeforeHours(dto.getRemindBeforeHours());
        }
        if (dto.getEnabled() != null) {
            rule.setEnabled(dto.getEnabled());
        }
        rule.setUpdatedAt(LocalDateTime.now());
        return reminderRuleRepository.save(rule);
    }

    @Override
    @Transactional
    public void deleteRule(Long id) {
        reminderRuleRepository.deleteById(id);
    }

    @Override
    public List<ReminderRule> getEnabledRules() {
        return reminderRuleRepository.findByEnabledTrue();
    }

    @Override
    @Transactional
    public ReminderLog sendReminder(Long ruleId, Long targetId, Long receiverId) {
        ReminderLog log = new ReminderLog();
        log.setRuleId(ruleId != null ? ruleId : 0L);
        log.setTargetType(TargetType.COMMENT);
        log.setTargetId(targetId);
        log.setReceiverId(receiverId);
        log.setContent("您有一条提醒");
        log.setSentAt(LocalDateTime.now());
        log.setStatus(ReminderLogStatus.SUCCESS);
        return reminderLogRepository.save(log);
    }

    @Override
    @Transactional
    public void checkAndRemind() {
        List<ReminderRule> rules = reminderRuleRepository.findByEnabledTrue();
        for (ReminderRule rule : rules) {
            switch (rule.getRuleType()) {
                case COMMENT_NO_REPLY:
                    checkCommentNoReply(rule);
                    break;
                case TODO_DUE:
                    checkTodoDue(rule);
                    break;
                case MEETING_UPCOMING:
                    checkMeetingUpcoming(rule);
                    break;
                case PROCESS_TIMEOUT:
                    checkProcessTimeout(rule);
                    break;
            }
        }
    }

    private void checkCommentNoReply(ReminderRule rule) {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Comment> unreplied = commentRepository.findByHasReplyFalseAndReplyRemindedFalse();
        for (Comment comment : unreplied) {
            if (comment.getCreatedAt().isBefore(cutoff)) {
                sendReminder(rule.getId(), comment.getId(), comment.getUserId());
                comment.setReplyReminded(true);
                comment.setUpdatedAt(LocalDateTime.now());
                commentRepository.save(comment);
                auditLogService.logAction(comment.getUserId(),
                        com.pm.workstation.enums.AuditAction.COMMENT_NO_REPLY,
                        "COMMENT", comment.getId(), "评论超过24小时无人回复");
            }
        }
    }

    private void checkTodoDue(ReminderRule rule) {
        int hours = rule.getRemindBeforeHours() != null ? rule.getRemindBeforeHours() : 24;
        LocalDate dueDate = LocalDateTime.now().plusHours(hours).toLocalDate();
        List<TodoItem> todos = todoItemRepository.findByStatusAndRemindedFalse(TodoStatus.PENDING);
        for (TodoItem todo : todos) {
            if (todo.getDueDate() != null && !todo.getDueDate().isAfter(dueDate)) {
                sendReminder(rule.getId(), todo.getId(), todo.getUserId());
                todo.setReminded(true);
                todo.setUpdatedAt(LocalDateTime.now());
                todoItemRepository.save(todo);
            }
        }
    }

    private void checkMeetingUpcoming(ReminderRule rule) {
        int hours = rule.getRemindBeforeHours() != null ? rule.getRemindBeforeHours() : 24;
        LocalDateTime upcoming = LocalDateTime.now().plusHours(hours);
        LocalDate meetingDate = upcoming.toLocalDate();
        List<MeetingMinutes> meetings = meetingMinutesRepository.findByMeetingDateBetween(
                LocalDate.now(), meetingDate);
        for (MeetingMinutes meeting : meetings) {
            sendReminder(rule.getId(), meeting.getId(), meeting.getRecorderId());
        }
    }

    private void checkProcessTimeout(ReminderRule rule) {
        int hours = rule.getRemindBeforeHours() != null ? rule.getRemindBeforeHours() : 48;
        LocalDateTime timeout = LocalDateTime.now().minusHours(hours);
        List<ProcessInstance> instances = processInstanceRepository.findByStatus(ProcessStatus.IN_PROGRESS);
        for (ProcessInstance instance : instances) {
            if (instance.getUpdatedAt().isBefore(timeout)) {
                List<ProcessInstanceNode> pendingNodes = processInstanceNodeRepository
                        .findByInstanceIdAndStatus(instance.getId(), NodeStatus.PENDING);
                for (ProcessInstanceNode node : pendingNodes) {
                    if (node.getAssigneeId() != null) {
                        sendReminder(rule.getId(), instance.getId(), node.getAssigneeId());
                    }
                }
            }
        }
    }
}
