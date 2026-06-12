package com.finance.approval.service.scheduling;

import com.finance.approval.entity.TimeoutException;
import com.finance.approval.enums.TimeoutStatus;
import com.finance.approval.repository.TimeoutExceptionRepository;
import com.finance.approval.service.TimeoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final TimeoutExceptionRepository timeoutExceptionRepository;
    private final TimeoutService timeoutService;

    @Scheduled(cron = "${scheduling.reminder.cron:0 0 9 * * ?}")
    public void sendReminders() {
        log.info("开始执行提醒定时任务");
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime upcomingThreshold = now.plusHours(24);

            Set<Long> notifiedApprovers = new HashSet<>();

            List<TimeoutException> overdueTimeouts = timeoutExceptionRepository
                    .findByStatus(TimeoutStatus.PENDING, Pageable.unpaged()).getContent();

            for (TimeoutException timeout : overdueTimeouts) {
                if (timeout.getDueTime().isBefore(now) && !notifiedApprovers.contains(timeout.getApproverId())) {
                    timeoutService.sendReminder(timeout.getId());
                    notifiedApprovers.add(timeout.getApproverId());
                    log.info("已发送超时提醒给审批人: {}, 超时ID: {}", timeout.getApproverName(), timeout.getId());
                }
            }

            List<TimeoutException> pendingTimeouts = timeoutExceptionRepository.findPendingTimeouts(upcomingThreshold);
            for (TimeoutException timeout : pendingTimeouts) {
                if (timeout.getDueTime().isAfter(now) && !notifiedApprovers.contains(timeout.getApproverId())) {
                    timeoutService.sendReminder(timeout.getId());
                    notifiedApprovers.add(timeout.getApproverId());
                    log.info("已发送即将超时提醒给审批人: {}, 超时ID: {}", timeout.getApproverName(), timeout.getId());
                }
            }

            log.info("提醒定时任务执行完成，共通知 {} 位审批人", notifiedApprovers.size());
        } catch (Exception e) {
            log.error("提醒定时任务执行失败", e);
        }
    }
}
