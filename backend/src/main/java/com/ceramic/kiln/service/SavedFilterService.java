package com.ceramic.kiln.service;

import com.ceramic.kiln.entity.SavedFilter;
import com.ceramic.kiln.exception.BusinessException;
import com.ceramic.kiln.repository.SavedFilterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SavedFilterService {

    private final SavedFilterRepository savedFilterRepository;

    public List<SavedFilter> getFilters(Long userId, String pageName) {
        return savedFilterRepository.findByUserIdAndPageName(userId, pageName);
    }

    @Transactional
    public SavedFilter saveFilter(Long userId, String pageName, String filterName, 
                                   Map<String, Object> criteria, Boolean isDefault) {
        if (Boolean.TRUE.equals(isDefault)) {
            savedFilterRepository.findByUserIdAndPageNameAndIsDefaultTrue(userId, pageName)
                .ifPresent(f -> {
                    f.setIsDefault(false);
                    savedFilterRepository.save(f);
                });
        }

        SavedFilter filter = savedFilterRepository
            .findByUserIdAndPageNameAndFilterName(userId, pageName, filterName)
            .orElse(new SavedFilter());
        
        filter.setUserId(userId);
        filter.setPageName(pageName);
        filter.setFilterName(filterName);
        filter.setFilterCriteria(criteria);
        if (isDefault != null) {
            filter.setIsDefault(isDefault);
        }

        return savedFilterRepository.save(filter);
    }

    @Transactional
    public void deleteFilter(Long id, Long userId) {
        SavedFilter filter = savedFilterRepository.findById(id)
            .orElseThrow(() -> new BusinessException("筛选条件不存在"));
        
        if (!filter.getUserId().equals(userId)) {
            throw new BusinessException("无权删除他人的筛选条件");
        }
        
        savedFilterRepository.delete(filter);
    }

    public SavedFilter getDefaultFilter(Long userId, String pageName) {
        return savedFilterRepository.findByUserIdAndPageNameAndIsDefaultTrue(userId, pageName)
            .orElse(null);
    }
}
