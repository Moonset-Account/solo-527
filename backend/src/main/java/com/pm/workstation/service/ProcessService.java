package com.pm.workstation.service;

import com.pm.workstation.dto.ProcessConfigDTO;
import com.pm.workstation.entity.ProcessDefinition;
import com.pm.workstation.entity.ProcessInstance;
import com.pm.workstation.entity.ProcessNode;
import java.util.List;

public interface ProcessService {

    ProcessDefinition createDefinition(ProcessConfigDTO dto);

    ProcessNode addNode(Long definitionId, ProcessConfigDTO.NodeConfig nodeDTO);

    ProcessNode updateNode(Long nodeId, ProcessConfigDTO.NodeConfig nodeDTO);

    void deleteNode(Long nodeId);

    ProcessInstance startProcess(Long definitionId, Long requirementId);

    ProcessInstance advanceNode(Long instanceId, String action);

    List<ProcessNode> getNodesByDefinitionId(Long definitionId);
}
