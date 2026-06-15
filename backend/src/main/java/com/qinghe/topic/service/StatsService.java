package com.qinghe.topic.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qinghe.topic.dto.StatsQueryDTO;
import com.qinghe.topic.entity.VideoData;
import com.qinghe.topic.mapper.VideoDataMapper;
import cn.hutool.core.util.StrUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final VideoDataMapper videoDataMapper;

    public Map<String, Object> getDashboardStats(StatsQueryDTO query) {
        Map<String, Object> result = new HashMap<>();

        LocalDate startDate = null;
        LocalDate endDate = null;
        if (StrUtil.isNotBlank(query.getStartDate())) {
            startDate = LocalDate.parse(query.getStartDate(), DateTimeFormatter.ISO_DATE);
        }
        if (StrUtil.isNotBlank(query.getEndDate())) {
            endDate = LocalDate.parse(query.getEndDate(), DateTimeFormatter.ISO_DATE);
        }

        LambdaQueryWrapper<VideoData> wrapper = new LambdaQueryWrapper<>();
        if (startDate != null) {
            wrapper.ge(VideoData::getPublishDate, startDate);
        }
        if (endDate != null) {
            wrapper.le(VideoData::getPublishDate, endDate);
        }
        if (query.getCreatorId() != null) {
            wrapper.eq(VideoData::getCreatorId, query.getCreatorId());
        }
        List<VideoData> all = videoDataMapper.selectList(wrapper);

        long totalVideos = all.size();
        long totalViews = all.stream().mapToLong(VideoData::getViews).sum();
        long totalLikes = all.stream().mapToLong(VideoData::getLikes).sum();
        long totalComments = all.stream().mapToLong(VideoData::getComments).sum();
        long totalShares = all.stream().mapToLong(VideoData::getShares).sum();
        long totalConversions = all.stream().mapToLong(VideoData::getConversions).sum();
        BigDecimal totalAmount = all.stream()
                .map(VideoData::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgConversionRate = BigDecimal.ZERO;
        long totalClicks = all.stream().mapToLong(VideoData::getClicks).sum();
        if (totalClicks > 0) {
            avgConversionRate = BigDecimal.valueOf(totalConversions)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalClicks), 2, BigDecimal.ROUND_HALF_UP);
        }

        result.put("totalVideos", totalVideos);
        result.put("totalViews", totalViews);
        result.put("totalLikes", totalLikes);
        result.put("totalComments", totalComments);
        result.put("totalShares", totalShares);
        result.put("totalConversions", totalConversions);
        result.put("totalAmount", totalAmount);
        result.put("avgConversionRate", avgConversionRate);

        result.put("platformStats", videoDataMapper.statsByPlatform());
        result.put("creatorStats", videoDataMapper.statsByCreator(startDate, endDate));
        result.put("dateStats", videoDataMapper.statsByDate(startDate, endDate));
        result.put("topicPerformance", videoDataMapper.statsTopicPerformance(startDate, endDate));

        return result;
    }

    public Map<String, Object> getTodoStats() {
        Map<String, Object> result = new HashMap<>();
        result.put("topic", Map.of(
                "pending", 2L,
                "processing", 1L,
                "completed", 2L,
                "abnormal", 0L,
                "total", 5L
        ));
        result.put("script", Map.of(
                "pending", 1L,
                "processing", 1L,
                "completed", 2L,
                "abnormal", 0L,
                "total", 4L
        ));
        result.put("abnormal", Map.of(
                "pending", 1L,
                "processing", 1L,
                "completed", 1L,
                "total", 3L
        ));
        return result;
    }
}
