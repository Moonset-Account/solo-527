package com.pm.workstation.service;

import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.TodoItemDTO;
import com.pm.workstation.entity.TodoItem;
import java.util.List;

public interface TodoItemService {

    PageResultDTO<TodoItem> pageTodos(int page, int size, String status, Long userId);

    TodoItem createTodoItem(TodoItemDTO dto, Long userId);

    TodoItem updateTodoItem(Long id, TodoItemDTO dto);

    TodoItem completeTodoItem(Long id);

    List<TodoItem> getTodoItemsByUserId(Long userId);

    List<TodoItem> getTodoItemsByRequirementId(Long requirementId);
}
