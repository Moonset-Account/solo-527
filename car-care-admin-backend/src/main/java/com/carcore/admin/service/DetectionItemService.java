package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.entity.DetectionItem;
import com.carcore.admin.repository.DetectionItemRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DetectionItemService {

    private final DetectionItemRepository detectionItemRepository;

    public DetectionItemService(DetectionItemRepository detectionItemRepository) {
        this.detectionItemRepository = detectionItemRepository;
    }

    @Cacheable(value = "detectionItem", key = "#id", unless = "#result == null")
    public DetectionItem getById(Long id) {
        return detectionItemRepository.findById(id)
                .orElseThrow(() -> new BusinessException("检测项目不存在"));
    }

    @Cacheable(value = "detectionItem", key = "#itemCode", unless = "#result == null")
    public DetectionItem getByItemCode(String itemCode) {
        return detectionItemRepository.findByItemCode(itemCode)
                .orElseThrow(() -> new BusinessException("检测项目不存在"));
    }

    @Cacheable(value = "detectionItem", key = "'category:' + #category", unless = "#result == null || #result.size() == 0")
    public List<DetectionItem> getByCategory(String category) {
        return detectionItemRepository.findByItemCategory(category);
    }

    @Cacheable(value = "detectionItem", key = "'enabled'", unless = "#result == null || #result.size() == 0")
    public List<DetectionItem> getEnabledItems() {
        return detectionItemRepository.findByStatus(1);
    }

    public PageResult<DetectionItem> page(String keyword, String category, Integer status, int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<DetectionItem> page = detectionItemRepository.findByConditions(keyword, category, status, pageable);
        return PageResult.of(page.getContent(), page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    @CacheEvict(value = "detectionItem", allEntries = true)
    public DetectionItem create(DetectionItem item) {
        if (detectionItemRepository.findByItemCode(item.getItemCode()).isPresent()) {
            throw new BusinessException("项目编码已存在");
        }
        item.setStatus(1);
        return detectionItemRepository.save(item);
    }

    @Transactional
    @CacheEvict(value = "detectionItem", allEntries = true)
    public DetectionItem update(DetectionItem item) {
        DetectionItem existing = getById(item.getId());
        existing.setItemName(item.getItemName());
        existing.setItemCategory(item.getItemCategory());
        existing.setStandard(item.getStandard());
        existing.setUnitPrice(item.getUnitPrice());
        existing.setDuration(item.getDuration());
        existing.setDescription(item.getDescription());
        return detectionItemRepository.save(existing);
    }

    @Transactional
    @CacheEvict(value = "detectionItem", allEntries = true)
    public void delete(Long id) {
        DetectionItem item = getById(id);
        item.setStatus(0);
        detectionItemRepository.save(item);
    }

    @Transactional
    @CacheEvict(value = "detectionItem", allEntries = true)
    public void toggleStatus(Long id) {
        DetectionItem item = getById(id);
        item.setStatus(item.getStatus() == 1 ? 0 : 1);
        detectionItemRepository.save(item);
    }
}
