package com.badminton.arena.controller;

import com.badminton.arena.common.Result;
import com.badminton.arena.entity.Waitlist;
import com.badminton.arena.service.WaitlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/waitlist")
public class WaitlistController {

    @Autowired
    private WaitlistService waitlistService;

    @GetMapping("/schedule/{scheduleId}")
    public Result<List<Waitlist>> listBySchedule(@PathVariable Long scheduleId) {
        List<Waitlist> list = waitlistService.listBySchedule(scheduleId);
        return Result.success(list);
    }

    @PostMapping("/schedule/{scheduleId}")
    public Result<Waitlist> addToWaitlist(@PathVariable Long scheduleId) {
        Waitlist waitlist = waitlistService.addToWaitlist(scheduleId);
        return Result.success("已加入候补名单", waitlist);
    }

    @DeleteMapping("/schedule/{scheduleId}")
    public Result<String> removeFromWaitlist(@PathVariable Long scheduleId) {
        waitlistService.removeFromWaitlist(scheduleId);
        return Result.success("已退出候补名单");
    }
}
