package com.emailgenerator.service;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.repository.BatchTaskRepository;
import com.emailgenerator.repository.CallLogRepository;
import com.emailgenerator.repository.EmailRecordRepository;
import com.emailgenerator.repository.RiskSampleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {

    private final BatchTaskRepository batchTaskRepository;
    private final EmailRecordRepository emailRecordRepository;
    private final CallLogRepository callLogRepository;
    private final RiskSampleRepository riskSampleRepository;

    public StatsService(BatchTaskRepository batchTaskRepository,
                        EmailRecordRepository emailRecordRepository,
                        CallLogRepository callLogRepository,
                        RiskSampleRepository riskSampleRepository) {
        this.batchTaskRepository = batchTaskRepository;
        this.emailRecordRepository = emailRecordRepository;
        this.callLogRepository = callLogRepository;
        this.riskSampleRepository = riskSampleRepository;
    }

    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new HashMap<>();

        long totalTasks = batchTaskRepository.count();
        long totalRecords = emailRecordRepository.count();
        long totalRisks = riskSampleRepository.count();
        long totalCalls = callLogRepository.count();

        overview.put("totalTasks", totalTasks);
        overview.put("totalRecords", totalRecords);
        overview.put("totalRisks", totalRisks);
        overview.put("totalCalls", totalCalls);

        return overview;
    }

    public Map<String, Object> getAccuracyStats(BaseQuery query) {
        Map<String, Object> result = new HashMap<>();

        LocalDateTime startTime = query.getStartTime() != null ? query.getStartTime()
            : LocalDateTime.now().minusDays(30);
        LocalDateTime endTime = query.getEndTime() != null ? query.getEndTime() : LocalDateTime.now();

        List<Map<String, Object>> byLegalOwner = getAccuracyByLegalOwner();
        List<Map<String, Object>> byDate = getAccuracyByDate(startTime, endTime);
        List<Map<String, Object>> byErrorReason = getAccuracyByErrorReason(startTime, endTime);

        result.put("byLegalOwner", byLegalOwner);
        result.put("byDate", byDate);
        result.put("byErrorReason", byErrorReason);

        return result;
    }

    private List<Map<String, Object>> getAccuracyByLegalOwner() {
        List<Object[]> results = emailRecordRepository.statsByLegalOwner();
        List<Map<String, Object>> list = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            String legalOwner = (String) row[0];
            long total = ((Number) row[1]).longValue();
            long success = ((Number) row[2]).longValue();
            long fail = ((Number) row[3]).longValue();
            long risk = ((Number) row[4]).longValue();

            item.put("legalOwner", legalOwner);
            item.put("totalCount", total);
            item.put("successCount", success);
            item.put("failCount", fail);
            item.put("riskCount", risk);
            item.put("accuracy", total > 0 ? (double) success / total * 100 : 0);
            list.add(item);
        }

        return list;
    }

    private List<Map<String, Object>> getAccuracyByDate(LocalDateTime startTime, LocalDateTime endTime) {
        List<Object[]> results = emailRecordRepository.statsByDateRange(startTime, endTime);
        List<Map<String, Object>> list = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("date", row[0] != null ? row[0].toString() : "");
            long total = ((Number) row[1]).longValue();
            long success = ((Number) row[2]).longValue();
            long fail = ((Number) row[3]).longValue();

            item.put("totalCount", total);
            item.put("successCount", success);
            item.put("failCount", fail);
            item.put("accuracy", total > 0 ? (double) success / total * 100 : 0);
            list.add(item);
        }

        return list;
    }

    private List<Map<String, Object>> getAccuracyByErrorReason(LocalDateTime startTime, LocalDateTime endTime) {
        List<Object[]> results = emailRecordRepository.errorStatsByDateRange(startTime, endTime);
        List<Map<String, Object>> list = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("errorReason", row[0]);
            item.put("count", ((Number) row[1]).longValue());
            list.add(item);
        }

        return list;
    }
}
