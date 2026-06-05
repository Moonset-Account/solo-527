package com.gym.repository;

import com.gym.entity.CoursePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoursePackageRepository extends JpaRepository<CoursePackage, Long> {

    List<CoursePackage> findByActiveTrue();
}
