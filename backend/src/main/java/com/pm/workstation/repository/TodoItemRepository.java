package com.pm.workstation.repository;

import com.pm.workstation.entity.TodoItem;
import com.pm.workstation.enums.TodoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TodoItemRepository extends JpaRepository<TodoItem, Long> {

    List<TodoItem> findByUserIdAndStatus(Long userId, TodoStatus status);

    List<TodoItem> findByRequirementId(Long requirementId);

    List<TodoItem> findByStatusAndDueDateBefore(TodoStatus status, LocalDate date);

    List<TodoItem> findByStatusAndRemindedFalse(TodoStatus status);

    long countByUserIdAndStatus(Long userId, TodoStatus status);
}
