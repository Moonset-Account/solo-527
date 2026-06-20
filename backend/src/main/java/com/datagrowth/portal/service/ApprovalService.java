package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.ApprovalRequest;
import com.datagrowth.portal.repository.ApprovalRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository approvalRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "approval:";

    public ApiResponse<Page<ApprovalRequest>> getApprovalList(
        Long userId, Long approverId, String status, Pageable pageable
    ) {
        Page<ApprovalRequest> result;
        
        if (status != null && userId != null) {
            result = approvalRepository.findByStatusAndUserId(status, userId, pageable);
        } else if (userId != null) {
            result = approvalRepository.findByUserId(userId, pageable);
        } else if (approverId != null) {
            result = approvalRepository.findByApproverId(approverId, pageable);
        } else if (status != null) {
            result = approvalRepository.findByStatus(status, pageable);
        } else {
            result = approvalRepository.findAll(pageable);
        }
        
        return ApiResponse.success(result);
    }

    public ApiResponse<ApprovalRequest> getApprovalDetail(Long id) {
        return approvalRepository.findById(id)
            .map(ApiResponse::success)
            .orElse(ApiResponse.error("审批申请不存在"));
    }

    public ApiResponse<ApprovalRequest> createApproval(ApprovalRequest request) {
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        ApprovalRequest saved = approvalRepository.save(request);
        clearCache();
        return ApiResponse.success("审批申请已提交", saved);
    }

    public ApiResponse<ApprovalRequest> approve(Long id, Long approverId, String comment) {
        return approvalRepository.findById(id)
            .map(request -> {
                request.setStatus("APPROVED");
                request.setApproverId(approverId);
                request.setApprovalComment(comment);
                request.setApprovedAt(LocalDateTime.now());
                ApprovalRequest saved = approvalRepository.save(request);
                clearCache();
                return ApiResponse.success("审批已通过", saved);
            })
            .orElse(ApiResponse.error("审批申请不存在"));
    }

    public ApiResponse<ApprovalRequest> reject(Long id, Long approverId, String comment) {
        return approvalRepository.findById(id)
            .map(request -> {
                request.setStatus("REJECTED");
                request.setApproverId(approverId);
                request.setApprovalComment(comment);
                request.setApprovedAt(LocalDateTime.now());
                ApprovalRequest saved = approvalRepository.save(request);
                clearCache();
                return ApiResponse.success("审批已拒绝", saved);
            })
            .orElse(ApiResponse.error("审批申请不存在"));
    }

    public ApiResponse<Map<String, Object>> getApprovalStats() {
        String cacheKey = CACHE_PREFIX + "stats";
        @SuppressWarnings("unchecked")
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", approvalRepository.countByStatus("PENDING"));
        stats.put("approved", approvalRepository.countByStatus("APPROVED"));
        stats.put("rejected", approvalRepository.countByStatus("REJECTED"));
        
        redisTemplate.opsForValue().set(cacheKey, stats, 5, TimeUnit.MINUTES);
        
        return ApiResponse.success(stats);
    }

    private void clearCache() {
        redisTemplate.delete(CACHE_PREFIX + "stats");
    }
}
