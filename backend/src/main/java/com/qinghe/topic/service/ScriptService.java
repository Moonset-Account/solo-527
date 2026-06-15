package com.qinghe.topic.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.qinghe.topic.common.PageResult;
import com.qinghe.topic.dto.ScriptQueryDTO;
import com.qinghe.topic.dto.ScriptSaveDTO;
import com.qinghe.topic.entity.Script;
import com.qinghe.topic.entity.Topic;
import com.qinghe.topic.enums.ReviewType;
import com.qinghe.topic.mapper.ScriptMapper;
import com.qinghe.topic.mapper.TopicMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ScriptService {

    private final ScriptMapper scriptMapper;
    private final TopicMapper topicMapper;
    private final ReviewService reviewService;

    public PageResult<Script> page(ScriptQueryDTO query) {
        LambdaQueryWrapper<Script> wrapper = new LambdaQueryWrapper<>();
        if (StrUtil.isNotBlank(query.getKeyword())) {
            wrapper.and(w -> w.like(Script::getTitle, query.getKeyword())
                    .or().like(Script::getContent, query.getKeyword()));
        }
        if (query.getStatus() != null) {
            wrapper.eq(Script::getStatus, query.getStatus());
        }
        if (query.getTopicId() != null) {
            wrapper.eq(Script::getTopicId, query.getTopicId());
        }
        if (query.getCreatorId() != null) {
            wrapper.eq(Script::getCreatorId, query.getCreatorId());
        }
        if (StrUtil.isNotBlank(query.getStartDate())) {
            LocalDate start = LocalDate.parse(query.getStartDate(), DateTimeFormatter.ISO_DATE);
            wrapper.ge(Script::getCreateTime, start.atStartOfDay());
        }
        if (StrUtil.isNotBlank(query.getEndDate())) {
            LocalDate end = LocalDate.parse(query.getEndDate(), DateTimeFormatter.ISO_DATE);
            wrapper.le(Script::getCreateTime, end.atTime(23, 59, 59));
        }
        wrapper.orderByDesc(Script::getCreateTime);
        IPage<Script> page = scriptMapper.selectPage(query.toPage(), wrapper);
        return PageResult.of(page);
    }

    public Script getById(Long id) {
        return scriptMapper.selectById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void save(ScriptSaveDTO dto) {
        Script script = new Script();
        BeanUtils.copyProperties(dto, script);
        if (dto.getTopicId() != null && StrUtil.isBlank(dto.getTopicTitle())) {
            Topic topic = topicMapper.selectById(dto.getTopicId());
            if (topic != null) {
                script.setTopicTitle(topic.getTitle());
            }
        }
        if (script.getStatus() == null) {
            script.setStatus(1);
        }
        if (dto.getId() == null) {
            scriptMapper.insert(script);
            reviewService.recordChange(
                    script.getId(),
                    ReviewType.SCRIPT.getCode(),
                    null,
                    script,
                    dto.getReviewOpinion(),
                    dto.getReviewResult(),
                    dto.getReviewerId(),
                    dto.getReviewerName()
            );
            if (StrUtil.isNotBlank(script.getMaterialTags())) {
                reviewService.recordChange(
                        script.getId(),
                        ReviewType.MATERIAL.getCode(),
                        null,
                        Map.of("materialTags", script.getMaterialTags()),
                        dto.getReviewOpinion(),
                        dto.getReviewResult(),
                        dto.getReviewerId(),
                        dto.getReviewerName()
                );
            }
        } else {
            Script before = scriptMapper.selectById(dto.getId());
            scriptMapper.updateById(script);
            Script after = scriptMapper.selectById(dto.getId());
            reviewService.recordChange(
                    dto.getId(),
                    ReviewType.SCRIPT.getCode(),
                    before,
                    after,
                    dto.getReviewOpinion(),
                    dto.getReviewResult(),
                    dto.getReviewerId(),
                    dto.getReviewerName()
            );
            if (!Objects.equals(before.getMaterialTags(), after.getMaterialTags())) {
                reviewService.recordChange(
                        dto.getId(),
                        ReviewType.MATERIAL.getCode(),
                        Map.of("materialTags", before.getMaterialTags()),
                        Map.of("materialTags", after.getMaterialTags()),
                        dto.getReviewOpinion(),
                        dto.getReviewResult(),
                        dto.getReviewerId(),
                        dto.getReviewerName()
                );
            }
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        Script before = scriptMapper.selectById(id);
        Script script = new Script();
        script.setId(id);
        script.setStatus(status);
        scriptMapper.updateById(script);
        Script after = scriptMapper.selectById(id);
        reviewService.recordChange(
                id,
                ReviewType.SCRIPT.getCode(),
                before,
                after,
                "状态变更",
                null,
                null,
                null
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Script before = scriptMapper.selectById(id);
        scriptMapper.deleteById(id);
        reviewService.recordChange(
                id,
                ReviewType.SCRIPT.getCode(),
                before,
                null,
                "脚本已删除",
                null,
                null,
                null
        );
    }

    public Map<String, Object> getOverview() {
        Map<String, Object> result = new HashMap<>();
        List<Script> all = scriptMapper.selectList(null);
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

    public List<Script> listByTopicId(Long topicId) {
        LambdaQueryWrapper<Script> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Script::getTopicId, topicId);
        wrapper.orderByDesc(Script::getCreateTime);
        return scriptMapper.selectList(wrapper);
    }
}
