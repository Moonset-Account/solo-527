package com.qinghe.course.service;

import com.qinghe.course.entity.ClassMaterial;
import com.qinghe.course.repository.ClassMaterialRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassMaterialService {

    private final ClassMaterialRepository classMaterialRepository;

    public List<ClassMaterial> getClassMaterials(Long classId) {
        return classMaterialRepository.findByClassIdOrderBySortOrderAsc(classId);
    }

    @Transactional
    public ClassMaterial create(ClassMaterial material) {
        material.setCreatedBy(SecurityUtils.getCurrentUserId());
        return classMaterialRepository.save(material);
    }

    @Transactional
    public void delete(Long id) {
        classMaterialRepository.deleteById(id);
    }
}
