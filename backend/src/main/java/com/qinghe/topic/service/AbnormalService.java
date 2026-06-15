package com.qinghe.topic.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.qinghe.topic.common.PageResult;
import com.qinghe.topic.dto.AbnormalHandleDTO;
import com.qinghe.topic.dto.AbnormalQueryDTO;
import com.qinghe.topic.dto.AbnormalSaveDTO;
import com.qinghe.topic.entity.AbnormalRecord;
import com.qinghe.topic.enums.AbnormalType;
import com.qinghe.topic.mapper.AbnormalRecordMapper;
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
public class AbnormalService {

    private final AbnormalRecordMapper abnormalRecordMapper;

    public PageResult<AbnormalRecord> page(AbnormalQueryDTO query) {
        LambdaQueryWrapper<AbnormalRecord> wrapper = new LambdaQueryWrapper<>();
        if (StrUtil.isNotBlank(query.getKeyword())) {
            wrapper.and(w -> w.like(AbnormalRecord::getTitle, query.getKeyword())
                    .or().like(AbnormalRecord::getDescription, query.getKeyword()));
        }
        if (query.getAbnormalType() != null) {
            wrapper.eq(AbnormalRecord::getAbnormalType, query.getAbnormalType());
        }
        if (query.getStatus() != null) {
            wrapper.eq(AbnormalRecord::getStatus, query.getStatus());
        }
        if (query.getHandlerId() != null) {
            wrapper.eq(AbnormalRecord::getHandlerId, query.getHandlerId());
        }
        if (StrUtil.isNotBlank(query.getStartDate())) {
            LocalDate start = LocalDate.parse(query.getStartDate(), DateTimeFormatter.ISO_DATE);
            wrapper.ge(AbnormalRecord::getCreateTime, start.atStartOfDay());
        }
        if (StrUtil.isNotBlank(query.getEndDate())) {
            LocalDate end = LocalDate.parse(query.getEndDate(), DateTimeFormatter.ISO_DATE);
            wrapper.le(AbnormalRecord::getCreateTime, end.atTime(23, 59, 59));
        }
        wrapper.orderByDesc(AbnormalRecord::getCreateTime);
        IPage<AbnormalRecord> page = abnormalRecordMapper.selectPage(query.toPage(), wrapper);
        return PageResult.of(page);
    }

    public AbnormalRecord getById(Long id) {
        return abnormalRecordMapper.selectById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void save(AbnormalSaveDTO dto) {
        AbnormalRecord record = new AbnormalRecord();
        BeanUtils.copyProperties(dto, record);
        if (dto.getAbnormalType() != null) {
            AbnormalType type = AbnormalType.getByCode(dto.getAbnormalType());
            if (type != null) {
                record.setAbnormalTypeName(type.getDesc());
            }
        }
        if (record.getStatus() == null) {
            record.setStatus(1);
        }
        abnormalRecordMapper.insert(record);
    }

    @Transactional(rollbackFor = Exception.class)
    public void handle(AbnormalHandleDTO dto) {
        AbnormalRecord record = new AbnormalRecord();
        record.setId(dto.getId());
        record.setConclusion(dto.getConclusion());
        record.setHandlerId(dto.getHandlerId());
        record.setHandlerName(dto.getHandlerName());
        record.setHandleTime(LocalDateTime.now());
        record.setStatus(3);
        abnormalRecordMapper.updateById(record);
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        AbnormalRecord record = new AbnormalRecord();
        record.setId(id);
        record.setStatus(status);
        abnormalRecordMapper.updateById(record);
    }

    public Map<String, Object> getOverview() {
        Map<String, Object> result = new HashMap<>();
        List<AbnormalRecord> all = abnormalRecordMapper.selectList(null);
        long total = all.size();
        long pending = all.stream().filter(t -> t.getStatus() == 1).count();
        long processing = all.stream().filter(t -> t.getStatus() == 2).count();
        long completed = all.stream().filter(t -> t.getStatus() == 3).count();

        Map<Integer, Long> typeCount = new HashMap<>();
        for (AbnormalRecord r : all) {
            typeCount.merge(r.getAbnormalType(), 1L, Long::sum);
        }
        result.put("total", total);
        result.put("pending", pending);
        result.put("processing", processing);
        result.put("completed", completed);
        result.put("typeCount", typeCount);
        return result;
    }
}
