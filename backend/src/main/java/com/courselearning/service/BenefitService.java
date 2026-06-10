package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.courselearning.entity.MemberBenefit;
import com.courselearning.entity.SysUser;
import com.courselearning.mapper.MemberBenefitMapper;
import com.courselearning.mapper.SysUserMapper;
import com.courselearning.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BenefitService {

    @Autowired
    private MemberBenefitMapper memberBenefitMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    public List<MemberBenefit> getBenefitList() {
        LambdaQueryWrapper<MemberBenefit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MemberBenefit::getStatus, 1)
                .orderByAsc(MemberBenefit::getSort);
        return memberBenefitMapper.selectList(wrapper);
    }

    public MemberBenefit getBenefitById(Long id) {
        return memberBenefitMapper.selectById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void createBenefit(MemberBenefit benefit) {
        benefit.setStatus(1);
        benefit.setCreatedAt(LocalDateTime.now());
        benefit.setUpdatedAt(LocalDateTime.now());
        memberBenefitMapper.insert(benefit);
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateBenefit(Long id, MemberBenefit benefit) {
        benefit.setId(id);
        benefit.setUpdatedAt(LocalDateTime.now());
        memberBenefitMapper.updateById(benefit);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteBenefit(Long id) {
        memberBenefitMapper.deleteById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateBenefitStatus(Long id, Integer status) {
        MemberBenefit benefit = new MemberBenefit();
        benefit.setId(id);
        benefit.setStatus(status);
        benefit.setUpdatedAt(LocalDateTime.now());
        memberBenefitMapper.updateById(benefit);
    }

    public Map<String, Object> getUserBenefits() {
        Long userId = SecurityUtils.getCurrentUserId();
        SysUser user = sysUserMapper.selectById(userId);

        Map<String, Object> result = new HashMap<>();

        boolean isMember = user.getMemberExpireTime() != null &&
                user.getMemberExpireTime().isAfter(LocalDateTime.now());
        result.put("isMember", isMember);
        result.put("memberExpireTime", user.getMemberExpireTime());

        List<Map<String, Object>> benefits = new ArrayList<>();
        List<MemberBenefit> allBenefits = getBenefitList();

        for (MemberBenefit benefit : allBenefits) {
            Map<String, Object> item = new HashMap<>();
            item.put("benefit", benefit);
            item.put("available", isMember);
            item.put("value", isMember ? benefit.getValue() : null);
            benefits.add(item);
        }

        result.put("benefits", benefits);

        Map<String, Object> memberInfo = new HashMap<>();
        memberInfo.put("remainingDays", isMember ?
                java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now().toLocalDate(),
                        user.getMemberExpireTime().toLocalDate()) : 0);
        result.put("memberInfo", memberInfo);

        return result;
    }
}
