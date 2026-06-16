package com.badminton.arena.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.context.UserContext;
import com.badminton.arena.dto.TodoTaskDTO;
import com.badminton.arena.entity.SysUser;
import com.badminton.arena.entity.TodoTask;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.TodoTaskMapper;
import com.badminton.arena.service.SysUserService;
import com.badminton.arena.service.TodoTaskService;
import com.badminton.arena.vo.TodoTaskGroupVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TodoTaskServiceImpl extends ServiceImpl<TodoTaskMapper, TodoTask> implements TodoTaskService {

    private static final Logger log = LoggerFactory.getLogger(TodoTaskServiceImpl.class);

    @Autowired
    private SysUserService sysUserService;

    @Override
    public Page<TodoTask> page(int pageNum, int pageSize, String type, Integer status, Integer priority, Long assigneeId) {
        LambdaQueryWrapper<TodoTask> wrapper = new LambdaQueryWrapper<>();
        if (type != null && !type.isEmpty()) {
            wrapper.eq(TodoTask::getType, type);
        }
        if (status != null) {
            wrapper.eq(TodoTask::getStatus, status);
        }
        if (priority != null) {
            wrapper.eq(TodoTask::getPriority, priority);
        }
        if (assigneeId != null) {
            wrapper.eq(TodoTask::getAssigneeId, assigneeId);
        }
        wrapper.orderByDesc(TodoTask::getCreateTime);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional
    public TodoTask createTask(TodoTaskDTO dto) {
        Long currentUserId = UserContext.getUserId();
        TodoTask task = new TodoTask();
        task.setTaskNo(generateTaskNo());
        task.setTitle(dto.getTitle());
        task.setContent(dto.getContent());
        task.setType(dto.getType());
        task.setBizId(dto.getBizId());
        task.setAssigneeId(dto.getAssigneeId());
        task.setAssignerId(currentUserId);
        task.setPriority(dto.getPriority() != null ? dto.getPriority() : 2);
        task.setStatus(0);
        task.setDueTime(dto.getDueTime());
        task.setRemark(dto.getRemark());
        save(task);
        return task;
    }

    @Override
    @Transactional
    public TodoTask completeTask(Long id, String remark) {
        TodoTask task = getTaskById(id);
        if (task.getStatus() == 2) {
            throw new BusinessException("任务已完成，无需重复操作");
        }
        if (task.getStatus() == 3) {
            throw new BusinessException("已取消的任务不能完成");
        }
        task.setStatus(2);
        task.setFinishTime(LocalDateTime.now());
        if (remark != null && !remark.isEmpty()) {
            task.setRemark(remark);
        }
        updateById(task);
        return task;
    }

    @Override
    @Transactional
    public TodoTask cancelTask(Long id, String remark) {
        TodoTask task = getTaskById(id);
        if (task.getStatus() == 2) {
            throw new BusinessException("已完成的任务不能取消");
        }
        if (task.getStatus() == 3) {
            throw new BusinessException("任务已取消，无需重复操作");
        }
        task.setStatus(3);
        if (remark != null && !remark.isEmpty()) {
            task.setRemark(remark);
        }
        updateById(task);
        return task;
    }

    @Override
    public List<TodoTaskGroupVO> getTaskGroupByAssignee() {
        List<TodoTask> allTasks = list();
        Map<Long, List<TodoTask>> groupMap = allTasks.stream()
                .collect(Collectors.groupingBy(TodoTask::getAssigneeId));

        List<TodoTaskGroupVO> result = new ArrayList<>();
        for (Map.Entry<Long, List<TodoTask>> entry : groupMap.entrySet()) {
            Long assigneeId = entry.getKey();
            List<TodoTask> tasks = entry.getValue();

            SysUser user = sysUserService.getById(assigneeId);

            TodoTaskGroupVO vo = new TodoTaskGroupVO();
            vo.setAssigneeId(assigneeId);
            vo.setAssigneeName(user != null ? user.getRealName() : "未知");
            vo.setPendingCount((int) tasks.stream().filter(t -> t.getStatus() == 0).count());
            vo.setProcessingCount((int) tasks.stream().filter(t -> t.getStatus() == 1).count());
            vo.setCompletedCount((int) tasks.stream().filter(t -> t.getStatus() == 2).count());
            vo.setCancelledCount((int) tasks.stream().filter(t -> t.getStatus() == 3).count());
            vo.setTotalCount(tasks.size());

            result.add(vo);
        }
        return result;
    }

    @Override
    public Page<TodoTask> getMyTasks(int pageNum, int pageSize, Integer status, String type) {
        Long currentUserId = UserContext.getUserId();
        LambdaQueryWrapper<TodoTask> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TodoTask::getAssigneeId, currentUserId);
        if (status != null) {
            wrapper.eq(TodoTask::getStatus, status);
        }
        if (type != null && !type.isEmpty()) {
            wrapper.eq(TodoTask::getType, type);
        }
        wrapper.orderByDesc(TodoTask::getPriority);
        wrapper.orderByDesc(TodoTask::getCreateTime);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public TodoTask getTaskById(Long id) {
        TodoTask task = super.getById(id);
        if (task == null) {
            throw new BusinessException("待办任务不存在");
        }
        return task;
    }

    private String generateTaskNo() {
        return "TODO" + IdUtil.getSnowflakeNextIdStr();
    }
}
