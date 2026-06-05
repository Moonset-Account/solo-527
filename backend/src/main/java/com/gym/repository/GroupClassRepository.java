package com.gym.repository;

import com.gym.entity.GroupClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GroupClassRepository extends JpaRepository<GroupClass, Long> {

    @Query("SELECT gc FROM GroupClass gc WHERE gc.startTime BETWEEN :start AND :end AND gc.cancelled = false ORDER BY gc.startTime")
    List<GroupClass> findClassesInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<GroupClass> findByCoachIdOrderByStartTimeDesc(Long coachId);
}
