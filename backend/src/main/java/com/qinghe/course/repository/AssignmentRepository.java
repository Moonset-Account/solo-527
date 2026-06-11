package com.qinghe.course.repository;

import com.qinghe.course.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByClassIdOrderByCreatedAtDesc(Long classId);
}
