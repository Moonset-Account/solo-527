package com.approval.workflow.service;

import com.approval.workflow.dto.RequirementQueryDTO;
import com.approval.workflow.entity.NodeInstance;
import com.approval.workflow.entity.Requirement;
import com.approval.workflow.entity.User;
import com.approval.workflow.entity.WorkflowNode;
import com.approval.workflow.enums.NodeStatus;
import com.approval.workflow.enums.OperationType;
import com.approval.workflow.enums.RequirementStatus;
import com.approval.workflow.enums.RoleType;
import com.approval.workflow.repository.NodeInstanceRepository;
import com.approval.workflow.repository.RequirementRepository;
import com.approval.workflow.repository.UserRepository;
import com.approval.workflow.repository.WorkflowNodeRepository;
import com.approval.workflow.util.SecurityUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RequirementService {

    private final RequirementRepository requirementRepository;
    private final NodeInstanceRepository nodeInstanceRepository;
    private final WorkflowNodeRepository workflowNodeRepository;
    private final UserRepository userRepository;
    private final OperationLogService operationLogService;

    public RequirementService(RequirementRepository requirementRepository,
                              NodeInstanceRepository nodeInstanceRepository,
                              WorkflowNodeRepository workflowNodeRepository,
                              UserRepository userRepository,
                              OperationLogService operationLogService) {
        this.requirementRepository = requirementRepository;
        this.nodeInstanceRepository = nodeInstanceRepository;
        this.workflowNodeRepository = workflowNodeRepository;
        this.userRepository = userRepository;
        this.operationLogService = operationLogService;
    }

    @Transactional
    public Requirement createRequirement(Requirement requirement) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        requirement.setCreatorId(currentUserId);
        requirement.setStatus(RequirementStatus.DRAFT);

        User user = userRepository.findById(currentUserId).orElseThrow(() -> new RuntimeException("用户不存在"));
        if (requirement.getDeptId() == null) {
            requirement.setDeptId(user.getDeptId());
        }

        Requirement saved = requirementRepository.save(requirement);

        operationLogService.log(OperationType.CREATE, saved.getId(), "创建需求：" + saved.getTitle());

        return saved;
    }

    @Transactional
    public Requirement submitRequirement(Long id, Long workflowId) {
        Requirement requirement = getRequirementById(id);
        checkPermission(requirement);

        if (requirement.getStatus() != RequirementStatus.DRAFT) {
            throw new RuntimeException("只有草稿状态的需求才能提交");
        }

        requirement.setStatus(RequirementStatus.SUBMITTED);
        requirement.setWorkflowId(workflowId);
        Requirement saved = requirementRepository.save(requirement);

        initWorkflowNodes(saved, workflowId);

        operationLogService.log(OperationType.SUBMIT, saved.getId(),
                "提交审批", RequirementStatus.DRAFT.name(), RequirementStatus.SUBMITTED.name(), null);

        startNextNode(saved.getId());

        return saved;
    }

    private void initWorkflowNodes(Requirement requirement, Long workflowId) {
        List<WorkflowNode> nodes = workflowNodeRepository.findByWorkflowIdOrderByNodeOrder(workflowId);
        for (WorkflowNode nodeDef : nodes) {
            NodeInstance nodeInstance = new NodeInstance();
            nodeInstance.setRequirementId(requirement.getId());
            nodeInstance.setNodeDefId(nodeDef.getId());
            nodeInstance.setNodeName(nodeDef.getNodeName());
            nodeInstance.setNodeOrder(nodeDef.getNodeOrder());
            nodeInstance.setStatus(NodeStatus.PENDING);
            nodeInstance.setAssigneeDeptId(nodeDef.getAssigneeDeptId());
            nodeInstance.setAssigneeUserId(nodeDef.getAssigneeUserId());

            if (nodeDef.getAssigneeUserId() != null) {
                nodeInstance.setAssigneeId(nodeDef.getAssigneeUserId());
            } else if (nodeDef.getAssigneeDeptId() != null) {
                List<User> managers = userRepository.findByDeptIdAndRole(nodeDef.getAssigneeDeptId(), RoleType.DEPT_MANAGER);
                if (!managers.isEmpty()) {
                    nodeInstance.setAssigneeId(managers.get(0).getId());
                }
            }

            nodeInstanceRepository.save(nodeInstance);
        }
    }

    @Transactional
    public void startNextNode(Long requirementId) {
        List<NodeInstance> nodes = nodeInstanceRepository.findByRequirementIdOrderByNodeOrder(requirementId);

        for (NodeInstance node : nodes) {
            if (node.getStatus() == NodeStatus.PENDING) {
                node.setStatus(NodeStatus.IN_PROGRESS);
                node.setStartTime(LocalDateTime.now());
                if (node.getDueTime() == null && node.getStartTime() != null) {
                    WorkflowNode nodeDef = workflowNodeRepository.findById(node.getNodeDefId()).orElse(null);
                    if (nodeDef != null) {
                        node.setDueTime(node.getStartTime().plusDays(nodeDef.getDaysLimit()));
                    }
                }
                nodeInstanceRepository.save(node);

                operationLogService.log(OperationType.SUBMIT, requirementId, node.getId(),
                        "节点开始：" + node.getNodeName());
                break;
            }
        }

        boolean allApproved = nodes.stream()
                .allMatch(n -> n.getStatus() == NodeStatus.APPROVED || n.getStatus() == NodeStatus.SKIPPED);
        if (allApproved && !nodes.isEmpty()) {
            Requirement requirement = getRequirementById(requirementId);
            requirement.setStatus(RequirementStatus.APPROVED);
            requirement.setActualDate(java.time.LocalDate.now());
            requirementRepository.save(requirement);

            operationLogService.log(OperationType.APPROVE, requirementId,
                    "审批完成", RequirementStatus.IN_PROGRESS.name(), RequirementStatus.APPROVED.name(), null);
        }
    }

    @Transactional
    public NodeInstance approveNode(Long nodeId, String comment) {
        NodeInstance node = nodeInstanceRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("节点不存在"));

        checkNodePermission(node);

        if (node.getStatus() != NodeStatus.IN_PROGRESS) {
            throw new RuntimeException("只有进行中的节点才能审批");
        }

        node.setStatus(NodeStatus.APPROVED);
        node.setEndTime(LocalDateTime.now());
        node.setComment(comment);
        NodeInstance saved = nodeInstanceRepository.save(node);

        operationLogService.log(OperationType.APPROVE, node.getRequirementId(), nodeId,
                "节点通过：" + node.getNodeName(),
                NodeStatus.IN_PROGRESS.name(), NodeStatus.APPROVED.name(), comment);

        Requirement requirement = getRequirementById(node.getRequirementId());
        if (requirement.getStatus() == RequirementStatus.SUBMITTED) {
            requirement.setStatus(RequirementStatus.IN_PROGRESS);
            requirementRepository.save(requirement);
        }

        startNextNode(node.getRequirementId());

        return saved;
    }

    @Transactional
    public NodeInstance rejectNode(Long nodeId, String comment) {
        NodeInstance node = nodeInstanceRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("节点不存在"));

        checkNodePermission(node);

        if (node.getStatus() != NodeStatus.IN_PROGRESS) {
            throw new RuntimeException("只有进行中的节点才能审批");
        }

        node.setStatus(NodeStatus.REJECTED);
        node.setEndTime(LocalDateTime.now());
        node.setComment(comment);
        NodeInstance saved = nodeInstanceRepository.save(node);

        Requirement requirement = getRequirementById(node.getRequirementId());
        requirement.setStatus(RequirementStatus.REJECTED);
        requirementRepository.save(requirement);

        operationLogService.log(OperationType.REJECT, node.getRequirementId(), nodeId,
                "节点驳回：" + node.getNodeName(),
                NodeStatus.IN_PROGRESS.name(), NodeStatus.REJECTED.name(), comment);

        return saved;
    }

    @Transactional
    public NodeInstance markNodeStuck(Long nodeId, String reason) {
        NodeInstance node = nodeInstanceRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("节点不存在"));

        node.setStuck(true);
        nodeInstanceRepository.save(node);

        operationLogService.log(OperationType.STUCK, node.getRequirementId(), nodeId,
                "节点标记卡住：" + node.getNodeName() + "，原因：" + reason);

        return node;
    }

    @Transactional
    public Requirement assignAssignee(Long id, Long assigneeId) {
        Requirement requirement = getRequirementById(id);
        checkManagePermission(requirement);

        User assignee = userRepository.findById(assigneeId).orElseThrow(() -> new RuntimeException("负责人不存在"));

        requirement.setAssigneeId(assigneeId);
        Requirement saved = requirementRepository.save(requirement);

        operationLogService.log(OperationType.ASSIGN, saved.getId(),
                "分配负责人：" + assignee.getRealName());

        return saved;
    }

    @Transactional
    public Requirement mergeRequirement(Long sourceId, Long targetId) {
        Requirement source = getRequirementById(sourceId);
        Requirement target = getRequirementById(targetId);

        checkManagePermission(source);

        if (source.getStatus() == RequirementStatus.MERGED) {
            throw new RuntimeException("该需求已被合并");
        }

        source.setStatus(RequirementStatus.MERGED);
        source.setMergedToId(targetId);
        Requirement saved = requirementRepository.save(source);

        operationLogService.log(OperationType.MERGE, sourceId,
                "合并到需求：" + target.getTitle() + "(ID:" + targetId + ")",
                source.getStatus().name(), RequirementStatus.MERGED.name(), null);

        operationLogService.log(OperationType.MERGE, targetId,
                "合并入需求：" + source.getTitle() + "(ID:" + sourceId + ")");

        return saved;
    }

    @Transactional
    public Requirement closeRequirement(Long id, String remark) {
        Requirement requirement = getRequirementById(id);
        checkManagePermission(requirement);

        String beforeStatus = requirement.getStatus().name();
        requirement.setStatus(RequirementStatus.CLOSED);
        Requirement saved = requirementRepository.save(requirement);

        operationLogService.log(OperationType.CLOSE, saved.getId(),
                "关闭需求", beforeStatus, RequirementStatus.CLOSED.name(), remark);

        return saved;
    }

    public Requirement getRequirementById(Long id) {
        return requirementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("需求不存在"));
    }

    public Page<Requirement> searchRequirements(RequirementQueryDTO query, Pageable pageable) {
        Specification<Requirement> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(query.getKeyword())) {
                Predicate titleLike = criteriaBuilder.like(root.get("title"), "%" + query.getKeyword() + "%");
                Predicate descLike = criteriaBuilder.like(root.get("description"), "%" + query.getKeyword() + "%");
                predicates.add(criteriaBuilder.or(titleLike, descLike));
            }

            if (query.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), query.getStatus()));
            }

            if (query.getDeptId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("deptId"), query.getDeptId()));
            }

            if (query.getCreatorId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("creatorId"), query.getCreatorId()));
            }

            if (query.getAssigneeId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("assigneeId"), query.getAssigneeId()));
            }

            if (query.getPriority() != null) {
                predicates.add(criteriaBuilder.equal(root.get("priority"), query.getPriority()));
            }

            if (StringUtils.hasText(query.getCategory())) {
                predicates.add(criteriaBuilder.equal(root.get("category"), query.getCategory()));
            }

            if (query.getStartDate() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), query.getStartDate()));
            }

            if (query.getEndDate() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), query.getEndDate()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return requirementRepository.findAll(spec, pageable);
    }

    public List<Requirement> getRequirementsByIds(List<Long> ids) {
        return requirementRepository.findByIdIn(ids);
    }

    public List<Requirement> getDuplicateRequirements(Long id) {
        Requirement req = getRequirementById(id);
        List<Requirement> all = requirementRepository.findAllByDeptId(req.getDeptId());
        return all.stream()
                .filter(r -> !r.getId().equals(id) && r.getStatus() != RequirementStatus.MERGED
                        && r.getStatus() != RequirementStatus.CLOSED)
                .filter(r -> {
                    if (r.getTitle() == null || req.getTitle() == null) return false;
                    double similarity = calculateSimilarity(req.getTitle(), r.getTitle());
                    return similarity > 0.6;
                })
                .limit(10)
                .toList();
    }

    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0;
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        int matches = 0;
        for (char c : s1.toCharArray()) {
            if (s2.indexOf(c) >= 0) {
                matches++;
            }
        }
        return (double) matches / Math.max(s1.length(), s2.length());
    }

    public List<NodeInstance> getNodeInstances(Long requirementId) {
        return nodeInstanceRepository.findByRequirementIdOrderByNodeOrder(requirementId);
    }

    private void checkPermission(Requirement requirement) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        String role = SecurityUtil.getCurrentUserRole();

        if (RoleType.ADMIN.name().equals(role)) {
            return;
        }

        if (requirement.getCreatorId().equals(currentUserId)) {
            return;
        }

        throw new RuntimeException("无权限操作该需求");
    }

    private void checkManagePermission(Requirement requirement) {
        String role = SecurityUtil.getCurrentUserRole();

        if (RoleType.ADMIN.name().equals(role)) {
            return;
        }

        if (RoleType.DEPT_MANAGER.name().equals(role)) {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            User currentUser = userRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && currentUser.getDeptId().equals(requirement.getDeptId())) {
                return;
            }
        }

        throw new RuntimeException("无权限管理该需求");
    }

    private void checkNodePermission(NodeInstance node) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        String role = SecurityUtil.getCurrentUserRole();

        if (RoleType.ADMIN.name().equals(role)) {
            return;
        }

        if (node.getAssigneeId() != null && node.getAssigneeId().equals(currentUserId)) {
            return;
        }

        if (RoleType.DEPT_MANAGER.name().equals(role) && node.getAssigneeDeptId() != null) {
            User currentUser = userRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && currentUser.getDeptId().equals(node.getAssigneeDeptId())) {
                return;
            }
        }

        throw new RuntimeException("无权限审批该节点");
    }

    public Requirement updateRequirement(Long id, Requirement requirement) {
        Requirement existing = getRequirementById(id);
        checkPermission(existing);

        if (existing.getStatus() != RequirementStatus.DRAFT) {
            throw new RuntimeException("只有草稿状态的需求才能编辑");
        }

        if (requirement.getTitle() != null) {
            existing.setTitle(requirement.getTitle());
        }
        if (requirement.getDescription() != null) {
            existing.setDescription(requirement.getDescription());
        }
        if (requirement.getCategory() != null) {
            existing.setCategory(requirement.getCategory());
        }
        if (requirement.getPriority() != null) {
            existing.setPriority(requirement.getPriority());
        }
        if (requirement.getExpectedDate() != null) {
            existing.setExpectedDate(requirement.getExpectedDate());
        }
        if (requirement.getTags() != null) {
            existing.setTags(requirement.getTags());
        }

        Requirement saved = requirementRepository.save(existing);

        operationLogService.log(OperationType.UPDATE, saved.getId(), "更新需求信息");

        return saved;
    }
}
