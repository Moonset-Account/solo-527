package com.decoration.cooperation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.decoration.cooperation.dto.FollowRecordCreateDTO;
import com.decoration.cooperation.entity.BizFollowRecord;
import com.decoration.cooperation.entity.BizLead;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.exception.BusinessException;
import com.decoration.cooperation.mapper.BizFollowRecordMapper;
import com.decoration.cooperation.mapper.BizLeadMapper;
import com.decoration.cooperation.mapper.SysUserMapper;
import com.decoration.cooperation.service.BizFollowRecordService;
import com.decoration.cooperation.vo.TimelineItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BizFollowRecordServiceImpl extends ServiceImpl<BizFollowRecordMapper, BizFollowRecord> implements BizFollowRecordService {

    private final SysUserMapper sysUserMapper;
    private final BizLeadMapper bizLeadMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BizFollowRecord createFollow(FollowRecordCreateDTO dto) {
        BizFollowRecord record = new BizFollowRecord();
        record.setLeadId(dto.getLeadId());
        record.setContractId(dto.getContractId());
        record.setFollowType(dto.getFollowType());
        record.setFollowStage(dto.getFollowStage());
        record.setSourceReference(dto.getSourceReference());
        record.setContractReference(dto.getContractReference());
        record.setContent(dto.getContent());
        record.setNextFollowTime(dto.getNextFollowTime());
        record.setProcessDuration(dto.getProcessDuration());
        record.setAttachmentIds(dto.getAttachmentIds());
        save(record);

        if (dto.getLeadId() != null) {
            BizLead lead = bizLeadMapper.selectById(dto.getLeadId());
            if (lead != null) {
                lead.setLastFollowTime(LocalDateTime.now());
                lead.setNextFollowTime(dto.getNextFollowTime());
                if (dto.getFollowStage() != null) {
                    lead.setFollowStage(dto.getFollowStage());
                }
                bizLeadMapper.updateById(lead);
            }
        }

        return record;
    }

    @Override
    public List<BizFollowRecord> listByLeadId(Long leadId) {
        if (leadId == null) {
            throw new BusinessException("线索ID不能为空");
        }
        LambdaQueryWrapper<BizFollowRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BizFollowRecord::getLeadId, leadId);
        wrapper.orderByDesc(BizFollowRecord::getCreateTime);
        return list(wrapper);
    }

    @Override
    public List<TimelineItemVO> getTimeline(Long leadId, Long contractId) {
        LambdaQueryWrapper<BizFollowRecord> wrapper = new LambdaQueryWrapper<>();
        if (leadId != null) {
            wrapper.eq(BizFollowRecord::getLeadId, leadId);
        }
        if (contractId != null) {
            wrapper.eq(BizFollowRecord::getContractId, contractId);
        }
        wrapper.orderByDesc(BizFollowRecord::getCreateTime);
        List<BizFollowRecord> records = list(wrapper);

        List<TimelineItemVO> timeline = new ArrayList<>();
        for (BizFollowRecord record : records) {
            TimelineItemVO item = new TimelineItemVO();
            item.setId(record.getId());
            item.setType(record.getFollowType());
            item.setTitle(record.getFollowType());
            item.setContent(record.getContent());
            item.setOperatorId(record.getFollowerId());
            item.setOperatorName(record.getFollowerName());
            item.setCreateTime(record.getCreateTime());
            item.setProcessDuration(record.getProcessDuration());
            item.setContractReference(record.getContractReference());
            item.setStageReference(record.getFollowStage());
            item.setSourceReference(record.getSourceReference());

            if (record.getFollowerId() != null && record.getFollowerName() == null) {
                SysUser user = sysUserMapper.selectById(record.getFollowerId());
                if (user != null) {
                    item.setOperatorName(user.getRealName());
                }
            }

            String color = getColorByType(record.getFollowType());
            item.setColor(color);
            item.setTypeName(getTypeNameByType(record.getFollowType()));

            timeline.add(item);
        }
        return timeline;
    }

    private String getColorByType(String type) {
        if (type == null) {
            return "#1890ff";
        }
        return switch (type) {
            case "PHONE" -> "#52c41a";
            case "VISIT" -> "#faad14";
            case "MEASURE" -> "#722ed1";
            case "QUOTE" -> "#eb2f96";
            case "SIGN" -> "#13c2c2";
            default -> "#1890ff";
        };
    }

    private String getTypeNameByType(String type) {
        if (type == null) {
            return "跟进";
        }
        return switch (type) {
            case "PHONE" -> "电话跟进";
            case "VISIT" -> "上门拜访";
            case "MEASURE" -> "量房";
            case "QUOTE" -> "报价";
            case "SIGN" -> "签约";
            default -> "跟进";
        };
    }
}
