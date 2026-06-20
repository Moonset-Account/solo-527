package com.carcore.admin.repository;

import com.carcore.admin.entity.Technician;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Long> {

    Optional<Technician> findByTechNo(String techNo);

    List<Technician> findByStatus(Integer status);

    List<Technician> findBySkillLevel(String skillLevel);

    @Query("SELECT t FROM Technician t WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "t.name LIKE %:keyword% OR t.techNo LIKE %:keyword%) " +
           "AND (:skillLevel IS NULL OR :skillLevel = '' OR t.skillLevel = :skillLevel) " +
           "AND (:status IS NULL OR t.status = :status)")
    Page<Technician> findByConditions(@Param("keyword") String keyword,
                                      @Param("skillLevel") String skillLevel,
                                      @Param("status") Integer status,
                                      Pageable pageable);
}
