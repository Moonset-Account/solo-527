package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.FilterTemplate;
import com.datagrowth.portal.entity.SysRole;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.repository.FilterTemplateRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FilterTemplateService {

    private final FilterTemplateRepository templateRepository;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private SysUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            return user;
        }
        return null;
    }

    private Set<String> getCurrentUserRoleCodes() {
        SysUser user = getCurrentUser();
        if (user == null || user.getRoles() == null) {
            return new HashSet<>();
        }
        return user.getRoles().stream()
            .map(SysRole::getRoleCode)
            .collect(Collectors.toSet());
    }

    private boolean isAdmin() {
        return getCurrentUserRoleCodes().contains("ADMIN");
    }

    private boolean canModify(FilterTemplate tpl) {
        SysUser user = getCurrentUser();
        if (user == null) return false;
        if (isAdmin()) return true;
        if (tpl.getUserId() != null && tpl.getUserId().equals(user.getId())) return true;
        Set<String> myRoles = getCurrentUserRoleCodes();
        List<String> shared = tpl.getSharedRoles();
        if (shared != null) {
            for (String r : shared) {
                if (myRoles.contains(r)) return true;
            }
        }
        return false;
    }

    private boolean canUse(FilterTemplate tpl) {
        SysUser user = getCurrentUser();
        if (user == null) return false;
        if (Boolean.TRUE.equals(tpl.getIsPublic())) return true;
        if (isAdmin()) return true;
        if (tpl.getUserId() != null && tpl.getUserId().equals(user.getId())) return true;
        Set<String> myRoles = getCurrentUserRoleCodes();
        List<String> shared = tpl.getSharedRoles();
        if (shared != null) {
            for (String r : shared) {
                if (myRoles.contains(r)) return true;
            }
        }
        return false;
    }

    public ApiResponse<Page<FilterTemplate>> getTemplateList(String pageCode, Boolean isPublic, Pageable pageable) {
        SysUser user = getCurrentUser();
        Page<FilterTemplate> page;
        if (isAdmin()) {
            page = pageCode != null
                ? templateRepository.findByPageCode(pageCode, pageable)
                : templateRepository.findAll(pageable);
        } else {
            if (user == null) {
                return ApiResponse.success(Page.empty());
            }
            page = pageCode != null
                ? templateRepository.findByPageCode(pageCode, pageable)
                : templateRepository.findAll(pageable);
        }
        page.forEach(this::attachFilterConditionsMap);
        return ApiResponse.success(page);
    }

    public ApiResponse<List<FilterTemplate>> getMyTemplates(String pageCode) {
        SysUser user = getCurrentUser();
        if (user == null) {
            return ApiResponse.success(new ArrayList<>());
        }
        Set<String> myRoles = getCurrentUserRoleCodes();

        List<FilterTemplate> all = pageCode != null
            ? templateRepository.findByPageCodeOrderByUseCountDescCreatedAtDesc(pageCode)
            : templateRepository.findAllByOrderByUseCountDescCreatedAtDesc();

        List<FilterTemplate> result = new ArrayList<>();
        Set<Long> seen = new HashSet<>();

        for (FilterTemplate tpl : all) {
            if (seen.contains(tpl.getId())) continue;
            boolean matched = false;
            if (tpl.getUserId() != null && tpl.getUserId().equals(user.getId())) {
                matched = true;
            } else if (Boolean.TRUE.equals(tpl.getIsPublic())) {
                matched = true;
            } else {
                List<String> shared = tpl.getSharedRoles();
                if (shared != null) {
                    for (String r : shared) {
                        if (myRoles.contains(r)) {
                            matched = true;
                            break;
                        }
                    }
                }
            }
            if (matched) {
                seen.add(tpl.getId());
                attachFilterConditionsMap(tpl);
                result.add(tpl);
            }
        }
        return ApiResponse.success(result);
    }

    public ApiResponse<FilterTemplate> getTemplateDetail(Long id) {
        return templateRepository.findById(id)
            .filter(this::canUse)
            .map(tpl -> {
                attachFilterConditionsMap(tpl);
                return ApiResponse.success(tpl);
            })
            .orElse(ApiResponse.error("模板不存在或无权限"));
    }

    public ApiResponse<Map<String, Object>> useTemplate(Long id) {
        return templateRepository.findById(id)
            .filter(this::canUse)
            .map(tpl -> {
                tpl.setUseCount(tpl.getUseCount() == null ? 1 : tpl.getUseCount() + 1);
                templateRepository.save(tpl);
                Map<String, Object> conditions = parseConditions(tpl.getFilterConditions());
                return ApiResponse.success(conditions);
            })
            .orElse(ApiResponse.error("模板不存在或无权限"));
    }

    public ApiResponse<FilterTemplate> createTemplate(FilterTemplate template) {
        SysUser user = getCurrentUser();
        if (user == null) {
            return ApiResponse.error("未登录");
        }
        template.setId(null);
        template.setUserId(user.getId());
        template.setUsername(user.getUsername());
        template.setCreatedBy(user.getUsername());
        template.setUpdatedBy(user.getUsername());
        template.setUseCount(template.getUseCount() == null ? 0 : template.getUseCount());
        if (template.getIsPublic() == null) template.setIsPublic(false);
        if (template.getSharedRoles() == null) template.setSharedRoles(new ArrayList<>());

        if (template.getFilterConditions() == null || template.getFilterConditions().isEmpty()) {
            template.setFilterConditions("{}");
        } else if (!template.getFilterConditions().startsWith("{")) {
            try {
                String json = objectMapper.writeValueAsString(template.getFilterConditions());
                template.setFilterConditions(json);
            } catch (Exception ignore) {
                template.setFilterConditions("{}");
            }
        }

        FilterTemplate saved = templateRepository.save(template);
        attachFilterConditionsMap(saved);
        return ApiResponse.success(saved);
    }

    public ApiResponse<FilterTemplate> updateTemplate(Long id, FilterTemplate template) {
        return templateRepository.findById(id)
            .filter(this::canModify)
            .map(existing -> {
                existing.setTemplateName(template.getTemplateName());
                existing.setPageCode(template.getPageCode());
                if (template.getPageName() != null) existing.setPageName(template.getPageName());
                if (template.getDescription() != null) existing.setDescription(template.getDescription());
                if (template.getIsPublic() != null) existing.setIsPublic(template.getIsPublic());
                if (template.getSharedRoles() != null) existing.setSharedRoles(template.getSharedRoles());
                if (template.getFilterConditions() != null) {
                    if (template.getFilterConditions().startsWith("{")) {
                        existing.setFilterConditions(template.getFilterConditions());
                    } else {
                        try {
                            existing.setFilterConditions(objectMapper.writeValueAsString(template.getFilterConditions()));
                        } catch (Exception ignore) {}
                    }
                }
                SysUser user = getCurrentUser();
                if (user != null) existing.setUpdatedBy(user.getUsername());
                FilterTemplate saved = templateRepository.save(existing);
                attachFilterConditionsMap(saved);
                return ApiResponse.success(saved);
            })
            .orElse(ApiResponse.error("模板不存在或无权限"));
    }

    public ApiResponse<FilterTemplate> renameTemplate(Long id, String newName) {
        if (newName == null || newName.trim().isEmpty()) {
            return ApiResponse.error("名称不能为空");
        }
        return templateRepository.findById(id)
            .filter(this::canModify)
            .map(existing -> {
                existing.setTemplateName(newName.trim());
                SysUser user = getCurrentUser();
                if (user != null) existing.setUpdatedBy(user.getUsername());
                FilterTemplate saved = templateRepository.save(existing);
                attachFilterConditionsMap(saved);
                return ApiResponse.success(saved);
            })
            .orElse(ApiResponse.error("模板不存在或无权限"));
    }

    public ApiResponse<Void> deleteTemplate(Long id) {
        return templateRepository.findById(id)
            .filter(this::canModify)
            .map(existing -> {
                templateRepository.delete(existing);
                return ApiResponse.<Void>success(null);
            })
            .orElse(ApiResponse.error("模板不存在或无权限"));
    }

    @Transactional
    public ApiResponse<Void> shareTemplate(Long id, List<String> roleCodes) {
        return templateRepository.findById(id)
            .filter(this::canModify)
            .map(existing -> {
                existing.setSharedRoles(roleCodes == null ? new ArrayList<>() : new ArrayList<>(roleCodes));
                SysUser user = getCurrentUser();
                if (user != null) existing.setUpdatedBy(user.getUsername());
                templateRepository.save(existing);
                return ApiResponse.<Void>success(null);
            })
            .orElse(ApiResponse.error("模板不存在或无权限"));
    }

    private Map<String, Object> parseConditions(String json) {
        if (json == null || json.isEmpty()) {
            return new HashMap<>();
        }
        try {
            if (json.startsWith("{")) {
                return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            }
            return new HashMap<>();
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private void attachFilterConditionsMap(FilterTemplate tpl) {
        tpl.setFilterConditionsMap(parseConditions(tpl.getFilterConditions()));
    }
}
