package com.gym.repository;

import com.gym.entity.GroupClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupClassRepository extends JpaRepository<GroupClass, Long> {
    Optional<GroupClass> findByClassNo(String classNo);
    List<GroupClass> findByCoachId(Long coachId);
    List<GroupClass> findByStatus(String status);
    List<GroupClass> findByClassDate(LocalDate classDate);

    @Query("SELECT gc FROM GroupClass gc WHERE gc.classDate BETWEEN :startDate AND :endDate")
    List<GroupClass> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT gc FROM GroupClass gc WHERE gc.coachId = :coachId AND gc.classDate BETWEEN :startDate AND :endDate")
    List<GroupClass> findCoachClassesInRange(@Param("coachId") Long coachId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
