package com.citytour.inventory.repository;

import com.citytour.inventory.entity.CleaningTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CleaningTaskRepository extends JpaRepository<CleaningTask, Long> {

    List<CleaningTask> findByTaskNo(String taskNo);

    @Query("SELECT t FROM CleaningTask t WHERE " +
           "(:hotelCode IS NULL OR t.hotelCode = :hotelCode) AND " +
           "(:roomNumber IS NULL OR t.roomNumber LIKE %:roomNumber%) AND " +
           "(:taskDate IS NULL OR t.taskDate = :taskDate) AND " +
           "(:taskStatus IS NULL OR t.taskStatus = :taskStatus) AND " +
           "(:taskType IS NULL OR t.taskType = :taskType) AND " +
           "(:assignee IS NULL OR t.assignee = :assignee)")
    Page<CleaningTask> findByConditions(@Param("hotelCode") String hotelCode,
                                      @Param("roomNumber") String roomNumber,
                                      @Param("taskDate") LocalDate taskDate,
                                      @Param("taskStatus") String taskStatus,
                                      @Param("taskType") String taskType,
                                      @Param("assignee") String assignee,
                                      Pageable pageable);

    List<CleaningTask> findByTaskDateAndTaskStatus(LocalDate taskDate, String taskStatus);
}
