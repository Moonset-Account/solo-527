package com.citytour.inventory.service;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.CleaningTask;
import com.citytour.inventory.repository.CleaningTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CleaningTaskService {

    private final CleaningTaskRepository cleaningTaskRepository;

    public PageResult<CleaningTask> list(int page, int size, String hotelCode, String roomNumber,
                                         LocalDate taskDate, String taskStatus, String taskType,
                                         String assignee) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "taskDate"));
        Page<CleaningTask> result = cleaningTaskRepository.findByConditions(
                hotelCode, roomNumber, taskDate, taskStatus, taskType, assignee, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    public CleaningTask getById(Long id) {
        return cleaningTaskRepository.findById(id).orElse(null);
    }

    public List<CleaningTask> getTodayTasks(String status) {
        return cleaningTaskRepository.findByTaskDateAndTaskStatus(LocalDate.now(), status);
    }

    @Transactional
    public CleaningTask create(CleaningTask task) {
        if (task.getTaskNo() == null) {
            task.setTaskNo("CT" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }
        if (task.getTaskStatus() == null) {
            task.setTaskStatus("PENDING");
        }
        if (task.getPriority() == null) {
            task.setPriority("NORMAL");
        }
        return cleaningTaskRepository.save(task);
    }

    @Transactional
    public CleaningTask update(CleaningTask task) {
        return cleaningTaskRepository.save(task);
    }

    @Transactional
    public CleaningTask updateStatus(Long id, String status, String operator) {
        CleaningTask task = cleaningTaskRepository.findById(id).orElseThrow();
        task.setTaskStatus(status);
        task.setUpdatedBy(operator);
        if ("IN_PROGRESS".equals(status) && task.getStartTime() == null) {
            task.setStartTime(LocalDateTime.now());
        }
        if ("COMPLETED".equals(status) && task.getEndTime() == null) {
            task.setEndTime(LocalDateTime.now());
        }
        return cleaningTaskRepository.save(task);
    }

    @Transactional
    public void delete(Long id) {
        cleaningTaskRepository.deleteById(id);
    }
}
