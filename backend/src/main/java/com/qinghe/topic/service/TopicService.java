package com.qinghe.topic.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.qinghe.topic.common.PageResult;
import com.qinghe.topic.dto.TopicQueryDTO;
import com.qinghe.topic.dto.TopicSaveDTO;
import com.qinghe.topic.entity.Topic;
import com.qinghe.topic.mapper.TopicMapper;
import cn.hutool.core.util.StrUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicMapper topicMapper;

    public PageResult<Topic> page(TopicQueryDTO query) {
        LambdaQueryWrapper<Topic> wrapper = new LambdaQueryWrapper<>();
        if (StrUtil.isNotBlank(query.getKeyword())) {
            wrapper.and(w -> w.like(Topic::getTitle, query.getKeyword())
                    .or().like(Topic::getDescription, query.getKeyword()));
        }
        if (query.getStatus() != null) {
            wrapper.eq(Topic::getStatus, query.getStatus());
        }
        if (query.getCreatorId() != null) {
            wrapper.eq(Topic::getCreatorId, query.getCreatorId());
        }
        if (StrUtil.isNotBlank(query.getStartDate())) {
            LocalDate start = LocalDate.parse(query.getStartDate(), DateTimeFormatter.ISO_DATE);
            wrapper.ge(Topic::getCreateTime, start.atStartOfDay());
        }
        if (StrUtil.isNotBlank(query.getEndDate())) {
            LocalDate end = LocalDate.parse(query.getEndDate(), DateTimeFormatter.ISO_DATE);
            wrapper.le(Topic::getCreateTime, end.atTime(23, 59, 59));
        }
        wrapper.orderByDesc(Topic::getCreateTime);
        IPage<Topic> page = topicMapper.selectPage(query.toPage(), wrapper);
        return PageResult.of(page);
    }

    public Topic getById(Long id) {
        return topicMapper.selectById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void save(TopicSaveDTO dto) {
        Topic topic = new Topic();
        BeanUtils.copyProperties(dto, topic);
        if (topic.getStatus() == null) {
            topic.setStatus(1);
        }
        if (dto.getId() == null) {
            topicMapper.insert(topic);
        } else {
            topicMapper.updateById(topic);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        Topic topic = new Topic();
        topic.setId(id);
        topic.setStatus(status);
        topicMapper.updateById(topic);
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        topicMapper.deleteById(id);
    }

    public Map<String, Object> getOverview() {
        Map<String, Object> result = new HashMap<>();
        List<Topic> all = topicMapper.selectList(null);
        long total = all.size();
        long pending = all.stream().filter(t -> t.getStatus() == 1).count();
        long processing = all.stream().filter(t -> t.getStatus() == 2).count();
        long completed = all.stream().filter(t -> t.getStatus() == 3).count();
        long abnormal = all.stream().filter(t -> t.getStatus() == 4).count();
        result.put("total", total);
        result.put("pending", pending);
        result.put("processing", processing);
        result.put("completed", completed);
        result.put("abnormal", abnormal);
        return result;
    }
}
