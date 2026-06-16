package com.pm.workstation.scheduler;

import com.pm.workstation.service.CommentService;
import com.pm.workstation.service.ReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReminderScheduler {

    @Autowired
    private ReminderService reminderService;

    @Autowired
    private CommentService commentService;

    @Scheduled(fixedRate = 300000)
    public void checkAndRemind() {
        reminderService.checkAndRemind();
    }

    @Scheduled(fixedRate = 600000)
    public void checkUnrepliedComments() {
        commentService.checkUnrepliedComments();
    }
}
