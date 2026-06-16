package com.pm.workstation.repository;

import com.pm.workstation.entity.TodoItem;
import com.pm.workstation.enums.TodoStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface TodoItemRepository extends JpaRepository<TodoItem, Long> {

    List<TodoItem> findByUserIdAndStatus(Long userId, TodoStatus status);

    List<TodoItem> findByRequirementId(Long requirementId);

    List<TodoItem> findByStatusAndDueDateBefore(TodoStatus status, LocalDate date);

    List<TodoItem> findByStatusAndRemindedFalse(TodoStatus status);

    long countByUserIdAndStatus(Long userId, TodoStatus status);

    @Query("SELECT t FROM TodoItem t WHERE (:status IS NULL OR t.status = :status) AND (:userId IS NULL OR t.userId = :userId)")
    Page<TodoItem> findByFilters(@Param("status") TodoStatus status, @Param("userId") Long userId, Pageable pageable);
}
