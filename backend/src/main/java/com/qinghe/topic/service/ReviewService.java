package com.qinghe.topic.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.qinghe.topic.common.PageResult;
import com.qinghe.topic.dto.ReviewDTO;
import com.qinghe.topic.dto.ReviewQueryDTO;
import com.qinghe.topic.entity.ReviewRecord;
import com.qinghe.topic.enums.ReviewType;
import com.qinghe.topic.mapper.ReviewRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRecordMapper reviewRecordMapper;

    public PageResult<ReviewRecord> page(ReviewQueryDTO query) {
        LambdaQueryWrapper<ReviewRecord> wrapper = new LambdaQueryWrapper<>();
        if (query.getBusinessId() != null) {
            wrapper.eq(ReviewRecord::getBusinessId, query.getBusinessId());
        }
        if (query.getReviewType() != null) {
            wrapper.eq(ReviewRecord::getReviewType, query.getReviewType());
        }
        wrapper.orderByDesc(ReviewRecord::getCreateTime);
        wrapper.orderByDesc(ReviewRecord::getVersion);
        IPage<ReviewRecord> page = reviewRecordMapper.selectPage(query.toPage(), wrapper);
        return PageResult.of(page);
    }

    public List<ReviewRecord> listByBusiness(Long businessId, Integer reviewType) {
        LambdaQueryWrapper<ReviewRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReviewRecord::getBusinessId, businessId);
        if (reviewType != null) {
            wrapper.eq(ReviewRecord::getReviewType, reviewType);
        }
        wrapper.orderByAsc(ReviewRecord::getVersion);
        return reviewRecordMapper.selectList(wrapper);
    }

    @Transactional(rollbackFor = Exception.class)
    public void addRecord(ReviewDTO dto) {
        ReviewRecord record = new ReviewRecord();
        BeanUtils.copyProperties(dto, record);

        Integer version = getNextVersion(dto.getBusinessId(), dto.getReviewType());
        record.setVersion(version);

        if (dto.getReviewType() != null) {
            ReviewType type = ReviewType.values()[dto.getReviewType() - 1];
            record.setReviewTypeName(type.getDesc());
        }

        reviewRecordMapper.insert(record);
    }

    private Integer getNextVersion(Long businessId, Integer reviewType) {
        LambdaQueryWrapper<ReviewRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReviewRecord::getBusinessId, businessId);
        wrapper.eq(ReviewRecord::getReviewType, reviewType);
        wrapper.orderByDesc(ReviewRecord::getVersion);
        wrapper.last("LIMIT 1");
        ReviewRecord latest = reviewRecordMapper.selectOne(wrapper);
        return latest == null ? 1 : latest.getVersion() + 1;
    }

    public ReviewRecord getById(Long id) {
        return reviewRecordMapper.selectById(id);
    }
}
