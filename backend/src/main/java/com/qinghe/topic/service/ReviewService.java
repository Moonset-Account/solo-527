package com.qinghe.topic.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
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

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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
            ReviewType type = ReviewType.getByCode(dto.getReviewType());
            if (type != null) {
                record.setReviewTypeName(type.getDesc());
            }
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

    @Transactional(rollbackFor = Exception.class)
    public void recordChange(Long businessId, Integer reviewType,
                             Object beforeObj, Object afterObj,
                             String reviewOpinion, Integer reviewResult,
                             Long reviewerId, String reviewerName) {
        if (businessId == null || reviewType == null) {
            return;
        }
        String beforeJson = beforeObj == null ? null : JSONUtil.toJsonStr(beforeObj);
        String afterJson = afterObj == null ? null : JSONUtil.toJsonStr(afterObj);
        String diff = buildDiffDesc(beforeObj, afterObj);

        ReviewRecord record = new ReviewRecord();
        record.setBusinessId(businessId);
        record.setReviewType(reviewType);
        record.setBeforeContent(beforeJson);
        record.setAfterContent(afterJson);
        record.setDiffContent(diff);
        record.setReviewOpinion(reviewOpinion);
        record.setReviewResult(reviewResult);
        record.setReviewerId(reviewerId);
        record.setReviewerName(reviewerName);

        ReviewType type = ReviewType.getByCode(reviewType);
        if (type != null) {
            record.setReviewTypeName(type.getDesc());
        }
        record.setVersion(getNextVersion(businessId, reviewType));
        reviewRecordMapper.insert(record);
    }

    public String buildDiffDesc(Object beforeObj, Object afterObj) {
        if (beforeObj == null) {
            return "初始提交";
        }
        if (afterObj == null) {
            return "已删除";
        }
        if (beforeObj.getClass() != afterObj.getClass()) {
            return "对象类型不一致";
        }
        List<String> changes = new ArrayList<>();
        Field[] fields = beforeObj.getClass().getDeclaredFields();
        for (Field f : fields) {
            try {
                f.setAccessible(true);
                String name = f.getName();
                if ("createTime".equals(name) || "updateTime".equals(name)
                        || "deleted".equals(name) || "serialVersionUID".equals(name)) {
                    continue;
                }
                Object oldVal = f.get(beforeObj);
                Object newVal = f.get(afterObj);
                if (!Objects.equals(oldVal, newVal)) {
                    String oldStr = oldVal == null ? "空" : truncate(String.valueOf(oldVal));
                    String newStr = newVal == null ? "空" : truncate(String.valueOf(newVal));
                    changes.add(fieldLabel(name) + "：" + oldStr + " → " + newStr);
                }
            } catch (Exception ignored) {
            }
        }
        if (changes.isEmpty()) {
            return "无实质字段变更";
        }
        return StrUtil.join("；", changes);
    }

    private String truncate(String s) {
        if (s == null) return "";
        return s.length() > 30 ? s.substring(0, 30) + "..." : s;
    }

    private String fieldLabel(String name) {
        switch (name) {
            case "title": return "标题";
            case "description": return "描述";
            case "tags": return "标签";
            case "targetAudience": return "目标受众";
            case "contentDirection": return "内容方向";
            case "content": return "脚本内容";
            case "shootingRequirement": return "拍摄要求";
            case "materialTags": return "素材标签";
            case "duration": return "时长";
            case "status": return "状态";
            case "remark": return "备注";
            case "topicId": return "关联选题";
            case "topicTitle": return "选题标题";
            default: return name;
        }
    }
}
