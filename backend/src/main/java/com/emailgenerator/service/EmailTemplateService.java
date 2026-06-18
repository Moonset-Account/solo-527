package com.emailgenerator.service;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.dto.EmailTemplateDTO;
import com.emailgenerator.entity.EmailTemplate;
import com.emailgenerator.entity.EmailTemplateVersion;
import com.emailgenerator.repository.EmailTemplateRepository;
import com.emailgenerator.repository.EmailTemplateVersionRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class EmailTemplateService {

    private final EmailTemplateRepository templateRepository;
    private final EmailTemplateVersionRepository versionRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public EmailTemplateService(EmailTemplateRepository templateRepository,
                                EmailTemplateVersionRepository versionRepository,
                                RedisTemplate<String, Object> redisTemplate) {
        this.templateRepository = templateRepository;
        this.versionRepository = versionRepository;
        this.redisTemplate = redisTemplate;
    }

    private static final String CACHE_PREFIX = "email:template:";

    public PageResult<EmailTemplate> list(BaseQuery query) {
        Pageable pageable = PageRequest.of(
            query.getPageNum() - 1,
            query.getPageSize(),
            Sort.by(Sort.Direction.DESC, "createTime")
        );

        Specification<EmailTemplate> spec = buildSpecification(query);
        Page<EmailTemplate> page = templateRepository.findAll(spec, pageable);

        return new PageResult<>(
            page.getTotalElements(),
            page.getContent(),
            query.getPageNum(),
            query.getPageSize()
        );
    }

    private Specification<EmailTemplate> buildSpecification(BaseQuery query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("name"), "%" + query.getKeyword() + "%"));
            }
            if (query.getStatus() != null && !query.getStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), query.getStatus()));
            }
            if (query.getOwner() != null && !query.getOwner().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("owner"), query.getOwner()));
            }
            if (query.getSource() != null && !query.getSource().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("source"), query.getSource()));
            }
            if (query.getLegalOwner() != null && !query.getLegalOwner().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("legalOwner"), query.getLegalOwner()));
            }
            if (query.getStartTime() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createTime"), query.getStartTime()));
            }
            if (query.getEndTime() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createTime"), query.getEndTime()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public EmailTemplate getById(Long id) {
        String cacheKey = CACHE_PREFIX + id;
        EmailTemplate template = (EmailTemplate) redisTemplate.opsForValue().get(cacheKey);
        if (template != null) {
            return template;
        }

        template = templateRepository.findById(id).orElse(null);
        if (template != null) {
            redisTemplate.opsForValue().set(cacheKey, template, 1, TimeUnit.HOURS);
        }
        return template;
    }

    @Transactional
    public EmailTemplate create(EmailTemplateDTO dto, String operator) {
        EmailTemplate template = new EmailTemplate();
        BeanUtils.copyProperties(dto, template);
        template.setVersion(1);
        template.setStatus("DRAFT");
        template.setCreateBy(operator);
        template.setUpdateBy(operator);
        template = templateRepository.save(template);

        saveVersion(template, "初始版本", operator);
        return template;
    }

    @Transactional
    public EmailTemplate update(EmailTemplateDTO dto, String operator) {
        EmailTemplate template = templateRepository.findById(dto.getId())
            .orElseThrow(() -> new RuntimeException("模板不存在"));

        String changeLog = dto.getChangeLog() != null ? dto.getChangeLog() : "更新内容";
        saveVersion(template, changeLog, operator);

        template.setName(dto.getName());
        template.setDescription(dto.getDescription());
        template.setSubject(dto.getSubject());
        template.setContent(dto.getContent());
        template.setCategory(dto.getCategory());
        template.setSource(dto.getSource());
        template.setOwner(dto.getOwner());
        template.setLegalOwner(dto.getLegalOwner());
        template.setStatus(dto.getStatus() != null ? dto.getStatus() : template.getStatus());
        template.setVersion(template.getVersion() + 1);
        template.setUpdateBy(operator);

        template = templateRepository.save(template);

        String cacheKey = CACHE_PREFIX + template.getId();
        redisTemplate.delete(cacheKey);

        return template;
    }

    private void saveVersion(EmailTemplate template, String changeLog, String operator) {
        EmailTemplateVersion version = new EmailTemplateVersion();
        version.setTemplateId(template.getId());
        version.setVersion(template.getVersion());
        version.setName(template.getName());
        version.setSubject(template.getSubject());
        version.setContent(template.getContent());
        version.setChangeLog(changeLog);
        version.setCreateBy(operator);
        versionRepository.save(version);
    }

    @Transactional
    public void delete(Long id) {
        templateRepository.deleteById(id);
        String cacheKey = CACHE_PREFIX + id;
        redisTemplate.delete(cacheKey);
    }

    public List<EmailTemplateVersion> listVersions(Long templateId) {
        return versionRepository.findByTemplateIdOrderByVersionDesc(templateId);
    }

    public EmailTemplateVersion getVersion(Long templateId, Integer version) {
        return versionRepository.findByTemplateIdAndVersion(templateId, version);
    }

    @Transactional
    public EmailTemplate revertToVersion(Long templateId, Integer version, String operator) {
        EmailTemplateVersion templateVersion = versionRepository.findByTemplateIdAndVersion(templateId, version);
        if (templateVersion == null) {
            throw new RuntimeException("版本不存在");
        }

        EmailTemplate template = templateRepository.findById(templateId)
            .orElseThrow(() -> new RuntimeException("模板不存在"));

        saveVersion(template, "回滚到版本" + version, operator);

        template.setName(templateVersion.getName());
        template.setSubject(templateVersion.getSubject());
        template.setContent(templateVersion.getContent());
        template.setVersion(template.getVersion() + 1);
        template.setUpdateBy(operator);

        template = templateRepository.save(template);

        String cacheKey = CACHE_PREFIX + template.getId();
        redisTemplate.delete(cacheKey);

        return template;
    }
}
