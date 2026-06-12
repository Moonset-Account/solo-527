package com.finance.approval.service.scheduling;

import com.finance.approval.service.TimeoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TimeoutCheckScheduler {

    private final TimeoutService timeoutService;

    @Scheduled(cron = "${scheduling.timeout-check.cron:0 */30 * * * ?}")
    public void checkTimeouts() {
        log.info("开始执行超时检查定时任务");
        try {
            timeoutService.checkAndCreateTimeoutExceptions();
            log.info("超时检查定时任务执行完成");
        } catch (Exception e) {
            log.error("超时检查定时任务执行失败", e);
        }
    }
}
