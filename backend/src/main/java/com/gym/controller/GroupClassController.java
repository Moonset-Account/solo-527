package com.gym.controller;

import com.gym.common.response.Result;
import com.gym.entity.GroupClass;
import com.gym.repository.GroupClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/group-classes")
@RequiredArgsConstructor
public class GroupClassController {

    private final GroupClassRepository groupClassRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Result<List<GroupClass>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return Result.success(groupClassRepository
                    .findClassesInRange(startDate.atStartOfDay(), endDate.atTime(23, 59, 59)));
        }
        return Result.success(groupClassRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<GroupClass> getById(@PathVariable Long id) {
        return groupClassRepository.findById(id)
                .map(Result::success)
                .orElse(Result.error("团课不存在"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<GroupClass> create(@RequestBody GroupClass groupClass) {
        groupClass.setId(null);
        if (groupClass.getBookedCount() == null) {
            groupClass.setBookedCount(0);
        }
        if (groupClass.getCancelled() == null) {
            groupClass.setCancelled(false);
        }
        return Result.success(groupClassRepository.save(groupClass));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<GroupClass> update(@PathVariable Long id, @RequestBody GroupClass groupClass) {
        return groupClassRepository.findById(id).map(gc -> {
            if (groupClass.getName() != null) gc.setName(groupClass.getName());
            if (groupClass.getCoach() != null) gc.setCoach(groupClass.getCoach());
            if (groupClass.getStartTime() != null) gc.setStartTime(groupClass.getStartTime());
            if (groupClass.getEndTime() != null) gc.setEndTime(groupClass.getEndTime());
            if (groupClass.getMaxCapacity() != null) gc.setMaxCapacity(groupClass.getMaxCapacity());
            if (groupClass.getLocation() != null) gc.setLocation(groupClass.getLocation());
            if (groupClass.getDescription() != null) gc.setDescription(groupClass.getDescription());
            if (groupClass.getCancelled() != null) gc.setCancelled(groupClass.getCancelled());
            return Result.success(groupClassRepository.save(gc));
        }).orElse(Result.error("团课不存在"));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<GroupClass> cancel(@PathVariable Long id, @RequestParam(required = false) String reason) {
        return groupClassRepository.findById(id).map(gc -> {
            gc.setCancelled(true);
            gc.setCancelReason(reason);
            return Result.success(groupClassRepository.save(gc));
        }).orElse(Result.error("团课不存在"));
    }
}
