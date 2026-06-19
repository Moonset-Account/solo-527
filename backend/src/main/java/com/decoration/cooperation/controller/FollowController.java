package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.dto.FollowRecordCreateDTO;
import com.decoration.cooperation.entity.BizFollowRecord;
import com.decoration.cooperation.service.FollowService;
import com.decoration.cooperation.vo.TimelineItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Result<Long> create(@RequestBody FollowRecordCreateDTO dto) {
        return Result.success(followService.create(dto));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Result<List<BizFollowRecord>> listByLead(@RequestParam Long leadId) {
        return Result.success(followService.listByLead(leadId));
    }

    @GetMapping("/timeline")
    @PreAuthorize("isAuthenticated()")
    public Result<List<TimelineItemVO>> getTimeline(
            @RequestParam(required = false) Long leadId,
            @RequestParam(required = false) Long contractId) {
        return Result.success(followService.getTimeline(leadId, contractId));
    }
}
