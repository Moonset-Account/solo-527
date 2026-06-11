package com.qinghe.course.controller;

import com.qinghe.course.common.Result;
import com.qinghe.course.entity.ClassMaterial;
import com.qinghe.course.service.ClassMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/class-materials")
@RequiredArgsConstructor
public class ClassMaterialController {

    private final ClassMaterialService classMaterialService;

    @GetMapping("/class/{classId}")
    public Result<List<ClassMaterial>> list(@PathVariable Long classId) {
        return Result.success(classMaterialService.getClassMaterials(classId));
    }

    @PostMapping
    public Result<ClassMaterial> create(@RequestBody ClassMaterial material) {
        return Result.success(classMaterialService.create(material));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        classMaterialService.delete(id);
        return Result.success();
    }
}
