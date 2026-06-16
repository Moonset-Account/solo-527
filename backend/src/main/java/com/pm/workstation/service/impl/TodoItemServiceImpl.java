package com.pm.workstation.service.impl;

import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.TodoItemDTO;
import com.pm.workstation.entity.TodoItem;
import com.pm.workstation.enums.TodoStatus;
import com.pm.workstation.repository.TodoItemRepository;
import com.pm.workstation.service.TodoItemService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TodoItemServiceImpl implements TodoItemService {

    @Autowired
    private TodoItemRepository todoItemRepository;

    @Override
    public PageResultDTO<TodoItem> pageTodos(int page, int size, String status, Long userId) {
        TodoStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            statusEnum = TodoStatus.valueOf(status);
        }
        Page<TodoItem> pageResult = todoItemRepository.findByFilters(
                statusEnum, userId, PageRequest.of(page - 1, size));
        return PageResultDTO.of(pageResult.getContent(), pageResult.getTotalElements(), page, size);
    }

    @Override
    @Transactional
    public TodoItem createTodoItem(TodoItemDTO dto, Long userId) {
        TodoItem item = new TodoItem();
        item.setRequirementId(dto.getRequirementId());
        item.setUserId(userId);
        item.setTitle(dto.getTitle());
        item.setDescription(dto.getDescription());
        item.setStatus(TodoStatus.PENDING);
        item.setDueDate(dto.getDueDate());
        item.setReminderRuleId(dto.getReminderRuleId());
        item.setReminded(false);
        LocalDateTime now = LocalDateTime.now();
        item.setCreatedAt(now);
        item.setUpdatedAt(now);
        return todoItemRepository.save(item);
    }

    @Override
    @Transactional
    public TodoItem updateTodoItem(Long id, TodoItemDTO dto) {
        TodoItem item = todoItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("待办不存在"));
        item.setTitle(dto.getTitle());
        item.setDescription(dto.getDescription());
        item.setStatus(dto.getStatus() != null ? dto.getStatus() : item.getStatus());
        item.setDueDate(dto.getDueDate());
        item.setReminderRuleId(dto.getReminderRuleId());
        item.setUpdatedAt(LocalDateTime.now());
        return todoItemRepository.save(item);
    }

    @Override
    @Transactional
    public TodoItem completeTodoItem(Long id) {
        TodoItem item = todoItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("待办不存在"));
        item.setStatus(TodoStatus.COMPLETED);
        item.setCompletedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        return todoItemRepository.save(item);
    }

    @Override
    public List<TodoItem> getTodoItemsByUserId(Long userId) {
        return todoItemRepository.findByUserIdAndStatus(userId, TodoStatus.PENDING);
    }

    @Override
    public List<TodoItem> getTodoItemsByRequirementId(Long requirementId) {
        return todoItemRepository.findByRequirementId(requirementId);
    }
}
