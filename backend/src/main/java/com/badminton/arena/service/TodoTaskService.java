package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.dto.TodoTaskDTO;
import com.badminton.arena.entity.TodoTask;
import com.badminton.arena.vo.TodoTaskGroupVO;

import java.util.List;

public interface TodoTaskService extends IService<TodoTask> {

    Page<TodoTask> page(int pageNum, int pageSize, String type, Integer status, Integer priority, Long assigneeId);

    TodoTask createTask(TodoTaskDTO dto);

    TodoTask completeTask(Long id, String remark);

    TodoTask cancelTask(Long id, String remark);

    List<TodoTaskGroupVO> getTaskGroupByAssignee();

    Page<TodoTask> getMyTasks(int pageNum, int pageSize, Integer status, String type);

    TodoTask getTaskById(Long id);
}
