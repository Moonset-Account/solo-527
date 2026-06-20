package com.property.workorder.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.workorder.common.PageResult;
import com.property.workorder.entity.InspectionTask;
import com.property.workorder.mapper.InspectionTaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InspectionService {

    private final InspectionTaskMapper inspectionMapper;

    public PageResult<InspectionTask> queryTasks(String title, String inspectionType, String status,
                                                  LocalDate planDate, Long assigneeId,
                                                  Integer current, Integer size) {
        Page<InspectionTask> page = new Page<>(current, size);
        LambdaQueryWrapper<InspectionTask> wrapper = new LambdaQueryWrapper<>();
        if (title != null && !title.isEmpty()) {
            wrapper.like(InspectionTask::getTitle, title);
        }
        if (inspectionType != null && !inspectionType.isEmpty()) {
            wrapper.eq(InspectionTask::getInspectionType, inspectionType);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(InspectionTask::getStatus, status);
        }
        if (planDate != null) {
            wrapper.eq(InspectionTask::getPlanDate, planDate);
        }
        if (assigneeId != null) {
            wrapper.eq(InspectionTask::getAssigneeId, assigneeId);
        }
        wrapper.orderByDesc(InspectionTask::getCreatedAt);
        return PageResult.of(inspectionMapper.selectPage(page, wrapper));
    }

    public List<InspectionTask> queryTasksForExport(String title, String inspectionType, String status,
                                                     LocalDate planDate, Long assigneeId) {
        LambdaQueryWrapper<InspectionTask> wrapper = new LambdaQueryWrapper<>();
        if (title != null && !title.isEmpty()) {
            wrapper.like(InspectionTask::getTitle, title);
        }
        if (inspectionType != null && !inspectionType.isEmpty()) {
            wrapper.eq(InspectionTask::getInspectionType, inspectionType);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(InspectionTask::getStatus, status);
        }
        if (planDate != null) {
            wrapper.eq(InspectionTask::getPlanDate, planDate);
        }
        if (assigneeId != null) {
            wrapper.eq(InspectionTask::getAssigneeId, assigneeId);
        }
        wrapper.orderByDesc(InspectionTask::getCreatedAt);
        return inspectionMapper.selectList(wrapper);
    }

    @Transactional(rollbackFor = Exception.class)
    public InspectionTask createTask(InspectionTask task) {
        task.setTaskNo("IT" + System.currentTimeMillis());
        task.setStatus("PENDING");
        inspectionMapper.insert(task);
        return task;
    }

    @Transactional(rollbackFor = Exception.class)
    public InspectionTask startTask(Long id) {
        InspectionTask task = inspectionMapper.selectById(id);
        if (task == null) {
            throw new RuntimeException("巡检任务不存在");
        }
        task.setStatus("IN_PROGRESS");
        task.setStartedAt(LocalDateTime.now());
        inspectionMapper.updateById(task);
        return task;
    }

    @Transactional(rollbackFor = Exception.class)
    public InspectionTask completeTask(Long id, String result, String issuesFound) {
        InspectionTask task = inspectionMapper.selectById(id);
        if (task == null) {
            throw new RuntimeException("巡检任务不存在");
        }
        task.setStatus("COMPLETED");
        task.setCompletedAt(LocalDateTime.now());
        task.setResult(result);
        task.setIssuesFound(issuesFound);
        inspectionMapper.updateById(task);
        return task;
    }
}
