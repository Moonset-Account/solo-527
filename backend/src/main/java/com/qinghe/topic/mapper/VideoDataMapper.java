package com.qinghe.topic.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qinghe.topic.entity.VideoData;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface VideoDataMapper extends BaseMapper<VideoData> {

    List<Map<String, Object>> statsByPlatform();

    List<Map<String, Object>> statsByCreator(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<Map<String, Object>> statsByDate(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<Map<String, Object>> statsTopicPerformance(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
