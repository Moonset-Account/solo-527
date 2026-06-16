package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.entity.Waitlist;

import java.util.List;

public interface WaitlistService extends IService<Waitlist> {

    List<Waitlist> listBySchedule(Long scheduleId);

    Waitlist addToWaitlist(Long scheduleId);

    void removeFromWaitlist(Long scheduleId);

    void promoteNext(Long scheduleId);
}
