package com.pm.workstation.service.impl;

import com.pm.workstation.dto.ProcessConfigDTO;
import com.pm.workstation.entity.ProcessDefinition;
import com.pm.workstation.entity.ProcessInstance;
import com.pm.workstation.entity.ProcessInstanceNode;
import com.pm.workstation.entity.ProcessNode;
import com.pm.workstation.enums.AssigneeType;
import com.pm.workstation.enums.NodeStatus;
import com.pm.workstation.enums.ProcessStatus;
import com.pm.workstation.repository.ProcessDefinitionRepository;
import com.pm.workstation.repository.ProcessInstanceNodeRepository;
import com.pm.workstation.repository.ProcessInstanceRepository;
import com.pm.workstation.repository.ProcessNodeRepository;
import com.pm.workstation.service.ProcessService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProcessServiceImpl implements ProcessService {

    @Autowired
    private ProcessDefinitionRepository processDefinitionRepository;

    @Autowired
    private ProcessNodeRepository processNodeRepository;

    @Autowired
    private ProcessInstanceRepository processInstanceRepository;

    @Autowired
    private ProcessInstanceNodeRepository processInstanceNodeRepository;

    @Override
    public List<ProcessDefinition> listDefinitions() {
        return processDefinitionRepository.findAll();
    }

    @Override
    @Transactional
    public ProcessDefinition updateDefinition(Long id, ProcessConfigDTO dto) {
        ProcessDefinition definition = processDefinitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("流程定义不存在"));
        definition.setName(dto.getName());
        definition.setDescription(dto.getDescription());
        definition.setUpdatedAt(LocalDateTime.now());
        return processDefinitionRepository.save(definition);
    }

    @Override
    @Transactional
    public void deleteDefinition(Long id) {
        List<ProcessInstance> instances = processInstanceRepository.findByDefinitionId(id);
        for (ProcessInstance instance : instances) {
            processInstanceNodeRepository.deleteByInstanceId(instance.getId());
        }
        processInstanceRepository.deleteByDefinitionId(id);
        processNodeRepository.deleteByDefinitionId(id);
        processDefinitionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public ProcessDefinition createDefinition(ProcessConfigDTO dto) {
        ProcessDefinition definition = new ProcessDefinition();
        definition.setName(dto.getName());
        definition.setDescription(dto.getDescription());
        definition.setStatus(1);
        LocalDateTime now = LocalDateTime.now();
        definition.setCreatedAt(now);
        definition.setUpdatedAt(now);
        definition = processDefinitionRepository.save(definition);

        if (dto.getNodes() != null) {
            for (ProcessConfigDTO.NodeConfig nodeConfig : dto.getNodes()) {
                ProcessNode node = new ProcessNode();
                node.setDefinitionId(definition.getId());
                node.setNodeName(nodeConfig.getNodeName());
                node.setNodeOrder(nodeConfig.getNodeOrder());
                node.setRoleId(nodeConfig.getRoleId());
                node.setAssigneeType(nodeConfig.getAssigneeType() != null
                        ? AssigneeType.valueOf(nodeConfig.getAssigneeType()) : AssigneeType.ROLE);
                node.setAssigneeId(nodeConfig.getAssigneeId());
                node.setAutoRemind(nodeConfig.getAutoRemind() != null ? nodeConfig.getAutoRemind() : false);
                node.setRemindHours(nodeConfig.getRemindHours());
                node.setCreatedAt(now);
                processNodeRepository.save(node);
            }
        }

        return definition;
    }

    @Override
    @Transactional
    public ProcessNode addNode(Long definitionId, ProcessConfigDTO.NodeConfig nodeDTO) {
        ProcessNode node = new ProcessNode();
        node.setDefinitionId(definitionId);
        node.setNodeName(nodeDTO.getNodeName());
        node.setNodeOrder(nodeDTO.getNodeOrder());
        node.setRoleId(nodeDTO.getRoleId());
        node.setAssigneeType(nodeDTO.getAssigneeType() != null
                ? AssigneeType.valueOf(nodeDTO.getAssigneeType()) : AssigneeType.ROLE);
        node.setAssigneeId(nodeDTO.getAssigneeId());
        node.setAutoRemind(nodeDTO.getAutoRemind() != null ? nodeDTO.getAutoRemind() : false);
        node.setRemindHours(nodeDTO.getRemindHours());
        node.setCreatedAt(LocalDateTime.now());
        return processNodeRepository.save(node);
    }

    @Override
    @Transactional
    public ProcessNode updateNode(Long nodeId, ProcessConfigDTO.NodeConfig nodeDTO) {
        ProcessNode node = processNodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("流程节点不存在"));
        node.setNodeName(nodeDTO.getNodeName());
        node.setNodeOrder(nodeDTO.getNodeOrder());
        node.setRoleId(nodeDTO.getRoleId());
        if (nodeDTO.getAssigneeType() != null) {
            node.setAssigneeType(AssigneeType.valueOf(nodeDTO.getAssigneeType()));
        }
        node.setAssigneeId(nodeDTO.getAssigneeId());
        node.setAutoRemind(nodeDTO.getAutoRemind() != null ? nodeDTO.getAutoRemind() : node.getAutoRemind());
        node.setRemindHours(nodeDTO.getRemindHours());
        return processNodeRepository.save(node);
    }

    @Override
    @Transactional
    public void deleteNode(Long nodeId) {
        processNodeRepository.deleteById(nodeId);
    }

    @Override
    @Transactional
    public ProcessInstance startProcess(Long definitionId, Long requirementId) {
        List<ProcessNode> nodes = processNodeRepository.findByDefinitionIdOrderByNodeOrderAsc(definitionId);
        if (nodes.isEmpty()) {
            throw new RuntimeException("流程定义没有节点");
        }

        LocalDateTime now = LocalDateTime.now();
        ProcessInstance instance = new ProcessInstance();
        instance.setDefinitionId(definitionId);
        instance.setRequirementId(requirementId);
        instance.setCurrentNodeId(nodes.get(0).getId());
        instance.setStatus(ProcessStatus.IN_PROGRESS);
        instance.setCreatedAt(now);
        instance.setUpdatedAt(now);
        instance = processInstanceRepository.save(instance);

        for (ProcessNode processNode : nodes) {
            ProcessInstanceNode instanceNode = new ProcessInstanceNode();
            instanceNode.setInstanceId(instance.getId());
            instanceNode.setNodeId(processNode.getId());
            instanceNode.setAssigneeId(processNode.getAssigneeId());
            instanceNode.setStatus(NodeStatus.PENDING);
            instanceNode.setCreatedAt(now);
            processInstanceNodeRepository.save(instanceNode);
        }

        return instance;
    }

    @Override
    @Transactional
    public ProcessInstance advanceNode(Long instanceId, String action) {
        ProcessInstance instance = processInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("流程实例不存在"));
        List<ProcessNode> nodes = processNodeRepository.findByDefinitionIdOrderByNodeOrderAsc(instance.getDefinitionId());
        List<ProcessInstanceNode> instanceNodes = processInstanceNodeRepository.findByInstanceId(instanceId);

        ProcessInstanceNode currentNodeInstance = instanceNodes.stream()
                .filter(n -> n.getNodeId().equals(instance.getCurrentNodeId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("当前节点不存在"));

        LocalDateTime now = LocalDateTime.now();
        currentNodeInstance.setStatus("approve".equalsIgnoreCase(action) ? NodeStatus.APPROVED : NodeStatus.REJECTED);
        currentNodeInstance.setOperatedAt(now);
        processInstanceNodeRepository.save(currentNodeInstance);

        if ("approve".equalsIgnoreCase(action)) {
            int currentOrder = nodes.stream()
                    .filter(n -> n.getId().equals(instance.getCurrentNodeId()))
                    .map(ProcessNode::getNodeOrder)
                    .findFirst()
                    .orElse(0);

            ProcessNode nextNode = nodes.stream()
                    .filter(n -> n.getNodeOrder() > currentOrder)
                    .findFirst()
                    .orElse(null);

            if (nextNode != null) {
                instance.setCurrentNodeId(nextNode.getId());
                instance.setStatus(ProcessStatus.IN_PROGRESS);
            } else {
                instance.setStatus(ProcessStatus.COMPLETED);
            }
        } else {
            instance.setStatus(ProcessStatus.CANCELLED);
        }

        instance.setUpdatedAt(now);
        return processInstanceRepository.save(instance);
    }

    @Override
    public List<ProcessNode> getNodesByDefinitionId(Long definitionId) {
        return processNodeRepository.findByDefinitionIdOrderByNodeOrderAsc(definitionId);
    }
}
