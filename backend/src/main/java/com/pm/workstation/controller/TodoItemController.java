package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.TodoItemDTO;
import com.pm.workstation.entity.TodoItem;
import com.pm.workstation.service.TodoItemService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/todos")
public class TodoItemController {

    @Autowired
    private TodoItemService todoItemService;

    @GetMapping
    public ApiResponseDTO<PageResultDTO<TodoItem>> pageTodos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId) {
        return ApiResponseDTO.success(todoItemService.pageTodos(page, size, status, userId));
    }

    @PostMapping
    public ApiResponseDTO<TodoItem> createTodoItem(
            @Valid @RequestBody TodoItemDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        return ApiResponseDTO.success(todoItemService.createTodoItem(dto, userId));
    }

    @PutMapping("/{id}")
    public ApiResponseDTO<TodoItem> updateTodoItem(
            @PathVariable Long id,
            @Valid @RequestBody TodoItemDTO dto) {
        return ApiResponseDTO.success(todoItemService.updateTodoItem(id, dto));
    }

    @PostMapping("/{id}/complete")
    public ApiResponseDTO<TodoItem> completeTodoItem(@PathVariable Long id) {
        return ApiResponseDTO.success(todoItemService.completeTodoItem(id));
    }

    @GetMapping("/user/{userId}")
    public ApiResponseDTO<List<TodoItem>> getTodoItemsByUserId(@PathVariable Long userId) {
        return ApiResponseDTO.success(todoItemService.getTodoItemsByUserId(userId));
    }

    @GetMapping("/requirement/{id}")
    public ApiResponseDTO<List<TodoItem>> getTodoItemsByRequirementId(@PathVariable Long id) {
        return ApiResponseDTO.success(todoItemService.getTodoItemsByRequirementId(id));
    }
}
