package com.rider.analyzer.service;

import com.rider.analyzer.dto.TimelinessAnalysisDTO;
import com.rider.analyzer.entity.TimelinessNode;
import com.rider.analyzer.repository.TimelinessNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimelinessAnalysisService {

    private final TimelinessNodeRepository timelinessNodeRepository;

    public List<TimelinessAnalysisDTO> analyzeTimeoutNodes(LocalDateTime start, LocalDateTime end) {
        List<TimelinessNode> timeoutNodes = timelinessNodeRepository
                .findByIsTimeoutAndCreateTimeBetween(1, start, end);

        Map<String, List<TimelinessNode>> grouped = timeoutNodes.stream()
                .collect(Collectors.groupingBy(TimelinessNode::getNodeType));

        List<TimelinessAnalysisDTO> result = new ArrayList<>();
        for (Map.Entry<String, List<TimelinessNode>> entry : grouped.entrySet()) {
            TimelinessAnalysisDTO dto = new TimelinessAnalysisDTO();
            dto.setNodeType(entry.getKey());
            List<TimelinessNode> nodes = entry.getValue();
            dto.setTimeoutCount((long) nodes.size());

            double avg = nodes.stream()
                    .mapToInt(TimelinessNode::getTimeoutMinutes)
                    .average()
                    .orElse(0.0);
            dto.setAvgTimeoutMinutes(avg);

            long totalOfSameType = timelinessNodeRepository
                    .findByNodeTypeAndIsTimeout(entry.getKey(), 0).size()
                    + nodes.size();
            if (totalOfSameType > 0) {
                dto.setTimeoutRate(BigDecimal.valueOf(nodes.size())
                        .divide(BigDecimal.valueOf(totalOfSameType), 4, RoundingMode.HALF_UP));
            } else {
                dto.setTimeoutRate(BigDecimal.ZERO);
            }
            result.add(dto);
        }
        return result;
    }

    public List<TimelinessNode> getFulfillmentData(LocalDateTime start, LocalDateTime end) {
        return timelinessNodeRepository.findByIsTimeoutAndCreateTimeBetween(0, start, end);
    }

    public List<TimelinessAnalysisDTO> getNodeStats() {
        String[] nodeTypes = {"ACCEPT", "PICKUP", "DELIVER", "SIGN"};
        List<TimelinessAnalysisDTO> result = new ArrayList<>();
        for (String nodeType : nodeTypes) {
            List<TimelinessNode> timeoutNodes = timelinessNodeRepository
                    .findByNodeTypeAndIsTimeout(nodeType, 1);
            List<TimelinessNode> normalNodes = timelinessNodeRepository
                    .findByNodeTypeAndIsTimeout(nodeType, 0);

            TimelinessAnalysisDTO dto = new TimelinessAnalysisDTO();
            dto.setNodeType(nodeType);
            dto.setTimeoutCount((long) timeoutNodes.size());

            double avg = timeoutNodes.stream()
                    .mapToInt(TimelinessNode::getTimeoutMinutes)
                    .average()
                    .orElse(0.0);
            dto.setAvgTimeoutMinutes(avg);

            long total = timeoutNodes.size() + normalNodes.size();
            if (total > 0) {
                dto.setTimeoutRate(BigDecimal.valueOf(timeoutNodes.size())
                        .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP));
            } else {
                dto.setTimeoutRate(BigDecimal.ZERO);
            }
            result.add(dto);
        }
        return result;
    }
}
