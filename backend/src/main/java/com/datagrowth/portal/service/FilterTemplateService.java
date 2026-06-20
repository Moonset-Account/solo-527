package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.FilterTemplate;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.repository.FilterTemplateRepository;
import com.datagrowth.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class FilterTemplateService {

    private final FilterTemplateRepository templateRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "filter:";

    public ApiResponse<Page<FilterTemplate>> getTemplateList(
        String pageCode, Boolean isPublic, Pageable pageable
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long userId = null;
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            userId = user.getId();
        }
        
        Page<FilterTemplate> result;
        
        if (pageCode != null && userId != null) {
            result = templateRepository.findByPageCodeAndUserOrPublic(pageCode, userId, pageable);
        } else if (userId != null) {
            result = templateRepository.findByUserIdOrIsPublicTrue(userId, pageable);
        } else if (Boolean.TRUE.equals(isPublic)) {
            result = templateRepository.findByIsPublicTrue(pageable);
        } else {
            result = templateRepository.findAll(pageable);
        }
        
        return ApiResponse.success(result);
    }

    public ApiResponse<List<FilterTemplate>> getMyTemplates(String pageCode) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof SysUser user)) {
            return ApiResponse.error("用户未登录");
        }
        
        String cacheKey = CACHE_PREFIX + "my:" + user.getId() + ":" + pageCode;
        @SuppressWarnings("unchecked")
        List<FilterTemplate> cached = (List<FilterTemplate>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        List<FilterTemplate> result = templateRepository.findByPageCodeAndUserId(pageCode, user.getId());
        redisTemplate.opsForValue().set(cacheKey, result, 10, TimeUnit.MINUTES);
        
        return ApiResponse.success(result);
    }

    public ApiResponse<FilterTemplate> getTemplateDetail(Long id) {
        return templateRepository.findById(id)
            .map(template -> {
                template.setUseCount(template.getUseCount() + 1);
                templateRepository.save(template);
                return ApiResponse.success(template);
            })
            .orElse(ApiResponse.error("筛选模板不存在"));
    }

    public ApiResponse<FilterTemplate> createTemplate(FilterTemplate template) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof SysUser user)) {
            return ApiResponse.error("用户未登录");
        }
        
        template.setUserId(user.getId());
        template.setUsername(user.getUsername());
        template.setUseCount(0);
        if (template.getIsPublic() == null) {
            template.setIsPublic(false);
        }
        
        FilterTemplate saved = templateRepository.save(template);
        clearCache(user.getId(), template.getPageCode());
        
        return ApiResponse.success("筛选模板已保存", saved);
    }

    public ApiResponse<FilterTemplate> updateTemplate(Long id, FilterTemplate template) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof SysUser user)) {
            return ApiResponse.error("用户未登录");
        }
        
        return templateRepository.findById(id)
            .map(existing -> {
                if (!existing.getUserId().equals(user.getId())) {
                    return ApiResponse.<FilterTemplate>error("无权修改此模板");
                }
                
                existing.setTemplateName(template.getTemplateName());
                existing.setFilterConditions(template.getFilterConditions());
                existing.setIsPublic(template.getIsPublic());
                existing.setSharedRoles(template.getSharedRoles());
                existing.setDescription(template.getDescription());
                existing.setUpdatedBy(user.getUsername());
                
                FilterTemplate saved = templateRepository.save(existing);
                clearCache(user.getId(), existing.getPageCode());
                
                return ApiResponse.success("筛选模板已更新", saved);
            })
            .orElse(ApiResponse.error("筛选模板不存在"));
    }

    public ApiResponse<FilterTemplate> renameTemplate(Long id, String newName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof SysUser user)) {
            return ApiResponse.error("用户未登录");
        }
        
        return templateRepository.findById(id)
            .map(existing -> {
                if (!existing.getUserId().equals(user.getId())) {
                    return ApiResponse.<FilterTemplate>error("无权重命名此模板");
                }
                
                existing.setTemplateName(newName);
                existing.setUpdatedBy(user.getUsername());
                
                FilterTemplate saved = templateRepository.save(existing);
                clearCache(user.getId(), existing.getPageCode());
                
                return ApiResponse.success("筛选模板已重命名", saved);
            })
            .orElse(ApiResponse.error("筛选模板不存在"));
    }

    public ApiResponse<Void> deleteTemplate(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof SysUser user)) {
            return ApiResponse.error("用户未登录");
        }
        
        return templateRepository.findById(id)
            .map(template -> {
                if (!template.getUserId().equals(user.getId())) {
                    return ApiResponse.<Void>error("无权删除此模板");
                }
                
                templateRepository.deleteById(id);
                clearCache(user.getId(), template.getPageCode());
                
                return ApiResponse.<Void>success("筛选模板已删除", null);
            })
            .orElse(ApiResponse.error("筛选模板不存在"));
    }

    public ApiResponse<Void> shareTemplate(Long id, List<String> roleCodes) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof SysUser user)) {
            return ApiResponse.error("用户未登录");
        }
        
        return templateRepository.findById(id)
            .map(existing -> {
                if (!existing.getUserId().equals(user.getId())) {
                    return ApiResponse.<Void>error("无权分享此模板");
                }
                
                existing.setIsPublic(true);
                existing.setSharedRoles(String.join(",", roleCodes));
                existing.setUpdatedBy(user.getUsername());
                
                templateRepository.save(existing);
                clearCache(user.getId(), existing.getPageCode());
                
                return ApiResponse.<Void>success("筛选模板已分享", null);
            })
            .orElse(ApiResponse.error("筛选模板不存在"));
    }

    public ApiResponse<Map<String, Object>> useTemplate(Long id) {
        return templateRepository.findById(id)
            .map(template -> {
                template.setUseCount(template.getUseCount() + 1);
                templateRepository.save(template);
                
                Map<String, Object> result = Map.of(
                    "id", template.getId(),
                    "templateName", template.getTemplateName(),
                    "filterConditions", template.getFilterConditions()
                );
                
                return ApiResponse.success(result);
            })
            .orElse(ApiResponse.error("筛选模板不存在"));
    }

    private void clearCache(Long userId, String pageCode) {
        redisTemplate.delete(CACHE_PREFIX + "my:" + userId + ":" + pageCode);
    }
}
