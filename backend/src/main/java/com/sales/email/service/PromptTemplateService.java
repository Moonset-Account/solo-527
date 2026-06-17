package com.sales.email.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sales.email.common.BusinessException;
import com.sales.email.entity.PromptTemplate;
import com.sales.email.entity.PromptVersion;
import com.sales.email.mapper.PromptTemplateMapper;
import com.sales.email.mapper.PromptVersionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromptTemplateService {

    private final PromptTemplateMapper templateMapper;
    private final PromptVersionMapper versionMapper;
    private final OperationLogService operationLogService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_KEY_PREFIX = "prompt:template:";

    public List<PromptTemplate> getAllTemplates() {
        LambdaQueryWrapper<PromptTemplate> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(PromptTemplate::getCreatedAt);
        return templateMapper.selectList(wrapper);
    }

    public List<PromptVersion> getTemplateVersions(Long templateId) {
        LambdaQueryWrapper<PromptVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PromptVersion::getTemplateId, templateId);
        wrapper.orderByDesc(PromptVersion::getVersion);
        return versionMapper.selectList(wrapper);
    }

    public PromptVersion getActiveVersion(Long templateId) {
        String cacheKey = CACHE_KEY_PREFIX + templateId + ":active";
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return (PromptVersion) cached;
            }
        } catch (Exception e) {
            log.warn("从Redis获取提示词版本缓存失败", e);
        }

        LambdaQueryWrapper<PromptVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PromptVersion::getTemplateId, templateId);
        wrapper.eq(PromptVersion::getStatus, "ACTIVE");
        wrapper.orderByDesc(PromptVersion::getVersion);
        wrapper.last("LIMIT 1");
        PromptVersion version = versionMapper.selectOne(wrapper);

        if (version != null) {
            try {
                redisTemplate.opsForValue().set(cacheKey, version, 30, TimeUnit.MINUTES);
            } catch (Exception e) {
                log.warn("缓存提示词版本失败", e);
            }
        }
        return version;
    }

    public PromptVersion getVersionById(Long versionId) {
        return versionMapper.selectById(versionId);
    }

    @Transactional
    public PromptTemplate addTemplate(PromptTemplate template, Long operatorId, String operatorName) {
        templateMapper.insert(template);
        operationLogService.log("ADD_PROMPT_TEMPLATE", "PROMPT_TEMPLATE", template.getId().toString(),
                template.getSceneType(), operatorId, operatorName, "新增提示词模板：" + template.getTemplateName());
        return template;
    }

    @Transactional
    public PromptVersion addVersion(PromptVersion version, Long operatorId, String operatorName) {
        LambdaQueryWrapper<PromptVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PromptVersion::getTemplateId, version.getTemplateId());
        wrapper.orderByDesc(PromptVersion::getVersion);
        wrapper.last("LIMIT 1");
        PromptVersion latest = versionMapper.selectOne(wrapper);
        int nextVersion = latest != null ? latest.getVersion() + 1 : 1;
        version.setVersion(nextVersion);
        version.setOperatorId(operatorId);
        version.setOperatorName(operatorName);
        versionMapper.insert(version);

        if ("ACTIVE".equals(version.getStatus())) {
            LambdaQueryWrapper<PromptVersion> updateWrapper = new LambdaQueryWrapper<>();
            updateWrapper.eq(PromptVersion::getTemplateId, version.getTemplateId());
            updateWrapper.eq(PromptVersion::getStatus, "ACTIVE");
            updateWrapper.ne(PromptVersion::getId, version.getId());
            List<PromptVersion> actives = versionMapper.selectList(updateWrapper);
            for (PromptVersion active : actives) {
                active.setStatus("DEPRECATED");
                versionMapper.updateById(active);
            }
        }

        clearTemplateCache(version.getTemplateId());
        operationLogService.log("ADD_PROMPT_VERSION", "PROMPT_VERSION", version.getId().toString(),
                version.getSourceOrderNo(), operatorId, operatorName,
                "新增提示词版本 v" + nextVersion + "，备注：" + (version.getOperatorRemark() != null ? version.getOperatorRemark() : ""));
        return version;
    }

    @Transactional
    public void updateVersionStatus(Long versionId, String status, Long operatorId, String operatorName, String sourceOrderNo, String remark) {
        PromptVersion version = versionMapper.selectById(versionId);
        if (version == null) {
            throw BusinessException.retryable("提示词版本不存在");
        }

        if ("ACTIVE".equals(status)) {
            LambdaQueryWrapper<PromptVersion> updateWrapper = new LambdaQueryWrapper<>();
            updateWrapper.eq(PromptVersion::getTemplateId, version.getTemplateId());
            updateWrapper.eq(PromptVersion::getStatus, "ACTIVE");
            updateWrapper.ne(PromptVersion::getId, versionId);
            List<PromptVersion> actives = versionMapper.selectList(updateWrapper);
            for (PromptVersion active : actives) {
                active.setStatus("DEPRECATED");
                versionMapper.updateById(active);
            }
        }

        version.setStatus(status);
        versionMapper.updateById(version);
        clearTemplateCache(version.getTemplateId());
        operationLogService.log("UPDATE_PROMPT_STATUS", "PROMPT_VERSION", versionId.toString(),
                sourceOrderNo, operatorId, operatorName,
                remark != null ? remark : "更新提示词版本状态为：" + status);
    }

    private void clearTemplateCache(Long templateId) {
        try {
            redisTemplate.delete(CACHE_KEY_PREFIX + templateId + ":active");
        } catch (Exception e) {
            log.warn("清除提示词缓存失败", e);
        }
    }
}
