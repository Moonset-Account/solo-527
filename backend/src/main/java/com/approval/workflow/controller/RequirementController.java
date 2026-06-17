package com.approval.workflow.controller;

import com.approval.workflow.dto.ApiResponse;
import com.approval.workflow.dto.RequirementQueryDTO;
import com.approval.workflow.entity.NodeInstance;
import com.approval.workflow.entity.Requirement;
import com.approval.workflow.service.RequirementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/requirements")
public class RequirementController {

    private final RequirementService requirementService;

    public RequirementController(RequirementService requirementService) {
        this.requirementService = requirementService;
    }

    @PostMapping
    public ApiResponse<Requirement> createRequirement(@RequestBody Requirement requirement) {
        try {
            Requirement saved = requirementService.createRequirement(requirement);
            return ApiResponse.success(saved);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<Requirement> updateRequirement(@PathVariable Long id,
                                                       @RequestBody Requirement requirement) {
        try {
            Requirement updated = requirementService.updateRequirement(id, requirement);
            return ApiResponse.success(updated);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<Requirement> getRequirement(@PathVariable Long id) {
        try {
            Requirement requirement = requirementService.getRequirementById(id);
            return ApiResponse.success(requirement);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/search")
    public ApiResponse<Page<Requirement>> searchRequirements(
            @RequestBody RequirementQueryDTO query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Sort sort = buildSort(query);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Requirement> result = requirementService.searchRequirements(query, pageable);
        return ApiResponse.success(result);
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<Requirement> submitRequirement(@PathVariable Long id,
                                                       @RequestParam Long workflowId) {
        try {
            Requirement submitted = requirementService.submitRequirement(id, workflowId);
            return ApiResponse.success(submitted);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/assign")
    public ApiResponse<Requirement> assignAssignee(@PathVariable Long id,
                                                    @RequestParam Long assigneeId) {
        try {
            Requirement updated = requirementService.assignAssignee(id, assigneeId);
            return ApiResponse.success(updated);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/merge")
    public ApiResponse<Requirement> mergeRequirement(@RequestParam Long sourceId,
                                                      @RequestParam Long targetId) {
        try {
            Requirement merged = requirementService.mergeRequirement(sourceId, targetId);
            return ApiResponse.success(merged);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/duplicates")
    public ApiResponse<List<Requirement>> getDuplicateRequirements(@PathVariable Long id) {
        List<Requirement> duplicates = requirementService.getDuplicateRequirements(id);
        return ApiResponse.success(duplicates);
    }

    @PostMapping("/{id}/close")
    public ApiResponse<Requirement> closeRequirement(@PathVariable Long id,
                                                      @RequestParam(required = false) String remark) {
        try {
            Requirement closed = requirementService.closeRequirement(id, remark);
            return ApiResponse.success(closed);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/nodes")
    public ApiResponse<List<NodeInstance>> getNodeInstances(@PathVariable Long id) {
        List<NodeInstance> nodes = requirementService.getNodeInstances(id);
        return ApiResponse.success(nodes);
    }

    @PostMapping("/nodes/{nodeId}/approve")
    public ApiResponse<NodeInstance> approveNode(@PathVariable Long nodeId,
                                                  @RequestParam(required = false) String comment) {
        try {
            NodeInstance node = requirementService.approveNode(nodeId, comment);
            return ApiResponse.success(node);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/nodes/{nodeId}/reject")
    public ApiResponse<NodeInstance> rejectNode(@PathVariable Long nodeId,
                                                 @RequestParam(required = false) String comment) {
        try {
            NodeInstance node = requirementService.rejectNode(nodeId, comment);
            return ApiResponse.success(node);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/nodes/{nodeId}/stuck")
    public ApiResponse<NodeInstance> markNodeStuck(@PathVariable Long nodeId,
                                                    @RequestParam String reason) {
        try {
            NodeInstance node = requirementService.markNodeStuck(nodeId, reason);
            return ApiResponse.success(node);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/batch")
    public ApiResponse<List<Requirement>> getRequirementsByIds(@RequestBody List<Long> ids) {
        List<Requirement> requirements = requirementService.getRequirementsByIds(ids);
        return ApiResponse.success(requirements);
    }

    private Sort buildSort(RequirementQueryDTO query) {
        String sortBy = query.getSortBy() != null ? query.getSortBy() : "createdAt";
        String direction = query.getSortDirection() != null ? query.getSortDirection() : "desc";
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, sortBy);
    }
}
