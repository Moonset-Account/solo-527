package com.decoration.cooperation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.entity.BizTodoTask;
import com.decoration.cooperation.exception.BusinessException;
import com.decoration.cooperation.mapper.BizTodoTaskMapper;
import com.decoration.cooperation.service.BizTodoTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class BizTodoTaskServiceImpl extends ServiceImpl<BizTodoTaskMapper, BizTodoTask> implements BizTodoTaskService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BizTodoTask createTodo(BizTodoTask task) {
        task.setTaskNo(generateTaskNo());
        if (task.getStatus() == null) {
            task.setStatus("PENDING");
        }
        if (task.getPriority() == null) {
            task.setPriority(1);
        }
        task.setStartTime(LocalDateTime.now());
        save(task);
        return task;
    }

    @Override
    public PageResult<BizTodoTask> listMyTodos(PageQuery pageQuery, Long userId) {
        Page<BizTodoTask> page = new Page<>(pageQuery.getCurrent(), pageQuery.getSize());
        LambdaQueryWrapper<BizTodoTask> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BizTodoTask::getAssigneeId, userId);
        if (StringUtils.hasText(pageQuery.getKeyword())) {
            wrapper.and(w -> w.like(BizTodoTask::getTitle, pageQuery.getKeyword())
                    .or().like(BizTodoTask::getContent, pageQuery.getKeyword()));
        }
        if (StringUtils.hasText(pageQuery.getStatus())) {
            wrapper.eq(BizTodoTask::getStatus, pageQuery.getStatus());
        }
        wrapper.orderByAsc(BizTodoTask::getPriority);
        wrapper.orderByAsc(BizTodoTask::getDueTime);
        wrapper.orderByDesc(BizTodoTask::getCreateTime);
        Page<BizTodoTask> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void completeTodo(Long id, String remark) {
        BizTodoTask task = getById(id);
        if (task == null) {
            throw new BusinessException("待办不存在");
        }
        task.setStatus("COMPLETED");
        task.setCompleteTime(LocalDateTime.now());
        if (task.getStartTime() != null) {
            long duration = java.time.Duration.between(task.getStartTime(), LocalDateTime.now()).toMinutes();
            task.setProcessDuration(duration);
        }
        if (StringUtils.hasText(remark)) {
            task.setRemark(remark);
        }
        updateById(task);
    }

    @Override
    public void updateStatus(Long id, String status) {
        BizTodoTask task = getById(id);
        if (task == null) {
            throw new BusinessException("待办不存在");
        }
        task.setStatus(status);
        if ("IN_PROGRESS".equals(status) && task.getStartTime() == null) {
            task.setStartTime(LocalDateTime.now());
        }
        if ("COMPLETED".equals(status)) {
            task.setCompleteTime(LocalDateTime.now());
            if (task.getStartTime() != null) {
                long duration = java.time.Duration.between(task.getStartTime(), LocalDateTime.now()).toMinutes();
                task.setProcessDuration(duration);
            }
        }
        updateById(task);
    }

    private String generateTaskNo() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "TD" + dateStr;
        LambdaQueryWrapper<BizTodoTask> wrapper = new LambdaQueryWrapper<>();
        wrapper.likeRight(BizTodoTask::getTaskNo, prefix);
        wrapper.orderByDesc(BizTodoTask::getTaskNo);
        wrapper.last("LIMIT 1");
        BizTodoTask last = getOne(wrapper);
        int seq = 1;
        if (last != null && last.getTaskNo() != null) {
            String lastSeq = last.getTaskNo().substring(prefix.length());
            try {
                seq = Integer.parseInt(lastSeq) + 1;
            } catch (NumberFormatException e) {
                seq = 1;
            }
        }
        return prefix + String.format("%03d", seq);
    }
}
