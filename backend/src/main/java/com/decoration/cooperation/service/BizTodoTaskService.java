package com.decoration.cooperation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.entity.BizTodoTask;

public interface BizTodoTaskService extends IService<BizTodoTask> {

    BizTodoTask createTodo(BizTodoTask task);

    PageResult<BizTodoTask> listMyTodos(PageQuery pageQuery, Long userId);

    void completeTodo(Long id, String remark);

    void updateStatus(Long id, String status);
}
