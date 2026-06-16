package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.ImportResultDTO;
import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.RequirementDTO;
import com.pm.workstation.entity.Requirement;
import com.pm.workstation.enums.RequirementConclusion;
import com.pm.workstation.service.RequirementService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requirements")
public class RequirementController {

    @Autowired
    private RequirementService requirementService;

    @PostMapping
    public ApiResponseDTO<Requirement> submitRequirement(
            @Valid @RequestBody RequirementDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        return ApiResponseDTO.success(requirementService.submitRequirement(dto, userId));
    }

    @PutMapping("/{id}")
    public ApiResponseDTO<Requirement> updateRequirement(
            @PathVariable Long id,
            @Valid @RequestBody RequirementDTO dto) {
        return ApiResponseDTO.success(requirementService.updateRequirement(id, dto));
    }

    @GetMapping("/{id}")
    public ApiResponseDTO<Requirement> getRequirementById(@PathVariable Long id) {
        return ApiResponseDTO.success(requirementService.getRequirementById(id));
    }

    @GetMapping("/page")
    public ApiResponseDTO<PageResultDTO<Requirement>> pageRequirements(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ApiResponseDTO.success(requirementService.pageRequirements(page, size, status, keyword));
    }

    @PostMapping("/{id}/complete")
    public ApiResponseDTO<Requirement> completeRequirement(
            @PathVariable Long id,
            @RequestParam RequirementConclusion conclusion) {
        return ApiResponseDTO.success(requirementService.completeRequirement(id, conclusion));
    }

    @PostMapping("/batch-approve")
    public ApiResponseDTO<ImportResultDTO> batchApprove(@RequestBody List<Long> ids) {
        return ApiResponseDTO.success(requirementService.batchApprove(ids));
    }
}
