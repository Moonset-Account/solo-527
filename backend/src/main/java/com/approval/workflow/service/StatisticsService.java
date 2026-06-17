package com.approval.workflow.service;

import com.approval.workflow.dto.EfficiencyStatsDTO;
import com.approval.workflow.entity.NodeInstance;
import com.approval.workflow.entity.Requirement;
import com.approval.workflow.entity.User;
import com.approval.workflow.enums.NodeStatus;
import com.approval.workflow.enums.RequirementStatus;
import com.approval.workflow.repository.NodeInstanceRepository;
import com.approval.workflow.repository.RequirementRepository;
import com.approval.workflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatisticsService {

    private final RequirementRepository requirementRepository;
    private final NodeInstanceRepository nodeInstanceRepository;
    private final UserRepository userRepository;

    public StatisticsService(RequirementRepository requirementRepository,
                             NodeInstanceRepository nodeInstanceRepository,
                             UserRepository userRepository) {
        this.requirementRepository = requirementRepository;
        this.nodeInstanceRepository = nodeInstanceRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getDeptEfficiencyStats(Long deptId) {
        Map<String, Object> result = new HashMap<>();

        long totalCount = requirementRepository.count();
        long approvedCount = requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.APPROVED);
        long inProgressCount = requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.IN_PROGRESS);
        long pendingCount = requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.SUBMITTED);

        result.put("totalCount", totalCount);
        result.put("approvedCount", approvedCount);
        result.put("inProgressCount", inProgressCount);
        result.put("pendingCount", pendingCount);

        List<NodeInstance> nodes = nodeInstanceRepository.findByAssigneeDeptIdAndStatus(deptId, NodeStatus.APPROVED);
        double avgDuration = calculateAvgDuration(nodes);
        result.put("avgNodeDuration", avgDuration);

        long stuckCount = nodeInstanceRepository.findByStatusAndStuckTrue(NodeStatus.IN_PROGRESS)
                .stream()
                .filter(n -> n.getAssigneeDeptId() != null && n.getAssigneeDeptId().equals(deptId))
                .count();
        result.put("stuckCount", stuckCount);

        return result;
    }

    public List<EfficiencyStatsDTO> getDeptEfficiencyBatch(List<Long> deptIds) {
        List<EfficiencyStatsDTO> result = new ArrayList<>();

        for (Long deptId : deptIds) {
            EfficiencyStatsDTO dto = new EfficiencyStatsDTO();
            dto.setDeptId(deptId);

            long totalCount = requirementRepository.countByDeptIdAndStatus(deptId, null) +
                    requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.DRAFT) +
                    requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.SUBMITTED) +
                    requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.IN_PROGRESS) +
                    requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.APPROVED) +
                    requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.REJECTED) +
                    requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.MERGED) +
                    requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.CLOSED);
            dto.setTotalCount(totalCount);

            long approvedCount = requirementRepository.countByDeptIdAndStatus(deptId, RequirementStatus.APPROVED);
            dto.setApprovedCount(approvedCount);

            List<NodeInstance> approvedNodes = nodeInstanceRepository.findByAssigneeDeptIdAndStatus(deptId, NodeStatus.APPROVED);
            dto.setAvgNodeDuration(calculateAvgDuration(approvedNodes));

            long inProgressCount = nodeInstanceRepository.findByAssigneeDeptIdAndStatus(deptId, NodeStatus.IN_PROGRESS).size();
            dto.setInProgressCount(inProgressCount);

            long stuckCount = nodeInstanceRepository.findByStatusAndStuckTrue(NodeStatus.IN_PROGRESS)
                    .stream()
                    .filter(n -> n.getAssigneeDeptId() != null && n.getAssigneeDeptId().equals(deptId))
                    .count();
            dto.setStuckCount(stuckCount);

            result.add(dto);
        }

        return result;
    }

    public Map<String, Object> getUserEfficiencyStats(Long userId) {
        Map<String, Object> result = new HashMap<>();

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));
        result.put("userId", userId);
        result.put("realName", user.getRealName());

        long createdCount = requirementRepository.findByCreatorId(userId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        result.put("createdCount", createdCount);

        long assignedCount = requirementRepository.findByAssigneeId(userId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        result.put("assignedCount", assignedCount);

        List<NodeInstance> approvedNodes = nodeInstanceRepository.findByAssigneeIdAndStatus(userId, NodeStatus.APPROVED);
        result.put("approvedNodeCount", approvedNodes.size());
        result.put("avgNodeDuration", calculateAvgDuration(approvedNodes));

        List<NodeInstance> pendingNodes = nodeInstanceRepository.findByAssigneeIdAndStatus(userId, NodeStatus.IN_PROGRESS);
        result.put("pendingNodeCount", pendingNodes.size());

        return result;
    }

    private double calculateAvgDuration(List<NodeInstance> nodes) {
        if (nodes == null || nodes.isEmpty()) {
            return 0;
        }

        long totalMinutes = 0;
        int count = 0;

        for (NodeInstance node : nodes) {
            if (node.getStartTime() != null && node.getEndTime() != null) {
                Duration duration = Duration.between(node.getStartTime(), node.getEndTime());
                totalMinutes += duration.toMinutes();
                count++;
            }
        }

        return count > 0 ? (double) totalMinutes / count / 60 : 0;
    }

    public Map<String, Object> getOverallStats() {
        Map<String, Object> result = new HashMap<>();

        long totalRequirements = requirementRepository.count();
        result.put("totalRequirements", totalRequirements);

        Map<RequirementStatus, Long> statusCounts = new HashMap<>();
        for (RequirementStatus status : RequirementStatus.values()) {
            long count = requirementRepository.findByStatus(status, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
            statusCounts.put(status, count);
        }
        result.put("statusCounts", statusCounts);

        long totalNodes = nodeInstanceRepository.count();
        result.put("totalNodes", totalNodes);

        long stuckNodes = nodeInstanceRepository.findByStatusAndStuckTrue(NodeStatus.IN_PROGRESS).size();
        result.put("stuckNodes", stuckNodes);

        return result;
    }
}
