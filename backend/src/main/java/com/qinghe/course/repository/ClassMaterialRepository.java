package com.qinghe.course.repository;

import com.qinghe.course.entity.ClassMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassMaterialRepository extends JpaRepository<ClassMaterial, Long> {

    List<ClassMaterial> findByClassIdOrderBySortOrderAsc(Long classId);

    void deleteByClassId(Long classId);
}
