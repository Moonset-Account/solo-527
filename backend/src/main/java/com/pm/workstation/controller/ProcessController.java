package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.ProcessConfigDTO;
import com.pm.workstation.entity.ProcessDefinition;
import com.pm.workstation.entity.ProcessInstance;
import com.pm.workstation.entity.ProcessNode;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import com.pm.workstation.service.ProcessService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/processes")
public class ProcessController {

    @Autowired
    private ProcessService processService;

    @GetMapping("/definitions")
    public ApiResponseDTO<List<ProcessDefinition>> listDefinitions() {
        return ApiResponseDTO.success(processService.listDefinitions());
    }

    @PostMapping("/definitions")
    public ApiResponseDTO<ProcessDefinition> createDefinition(@Valid @RequestBody ProcessConfigDTO dto) {
        return ApiResponseDTO.success(processService.createDefinition(dto));
    }

    @PutMapping("/definitions/{id}")
    public ApiResponseDTO<ProcessDefinition> updateDefinition(
            @PathVariable Long id,
            @Valid @RequestBody ProcessConfigDTO dto) {
        return ApiResponseDTO.success(processService.updateDefinition(id, dto));
    }

    @DeleteMapping("/definitions/{id}")
    public ApiResponseDTO<Void> deleteDefinition(@PathVariable Long id) {
        processService.deleteDefinition(id);
        return ApiResponseDTO.success(null);
    }

    @PostMapping("/definitions/{id}/nodes")
    public ApiResponseDTO<ProcessNode> addNode(
            @PathVariable Long id,
            @Valid @RequestBody ProcessConfigDTO.NodeConfig nodeDTO) {
        return ApiResponseDTO.success(processService.addNode(id, nodeDTO));
    }

    @PutMapping("/nodes/{id}")
    public ApiResponseDTO<ProcessNode> updateNode(
            @PathVariable Long id,
            @Valid @RequestBody ProcessConfigDTO.NodeConfig nodeDTO) {
        return ApiResponseDTO.success(processService.updateNode(id, nodeDTO));
    }

    @DeleteMapping("/nodes/{id}")
    public ApiResponseDTO<Void> deleteNode(@PathVariable Long id) {
        processService.deleteNode(id);
        return ApiResponseDTO.success(null);
    }

    @PostMapping("/instances")
    public ApiResponseDTO<ProcessInstance> startProcess(@RequestBody Map<String, Long> params) {
        return ApiResponseDTO.success(processService.startProcess(params.get("definitionId"), params.get("requirementId")));
    }

    @PostMapping("/instances/{id}/advance")
    public ApiResponseDTO<ProcessInstance> advanceNode(
            @PathVariable Long id,
            @RequestBody Map<String, String> params) {
        return ApiResponseDTO.success(processService.advanceNode(id, params.get("action")));
    }

    @GetMapping("/definitions/{id}/nodes")
    public ApiResponseDTO<List<ProcessNode>> getNodesByDefinitionId(@PathVariable Long id) {
        return ApiResponseDTO.success(processService.getNodesByDefinitionId(id));
    }
}
