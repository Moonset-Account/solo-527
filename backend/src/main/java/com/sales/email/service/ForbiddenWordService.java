package com.sales.email.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sales.email.common.BusinessException;
import com.sales.email.common.PageResult;
import com.sales.email.entity.ForbiddenWord;
import com.sales.email.entity.ForbiddenWordHit;
import com.sales.email.mapper.ForbiddenWordHitMapper;
import com.sales.email.mapper.ForbiddenWordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForbiddenWordService {

    private final ForbiddenWordMapper forbiddenWordMapper;
    private final ForbiddenWordHitMapper forbiddenWordHitMapper;
    private final OperationLogService operationLogService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_KEY = "forbidden_words:all";

    @SuppressWarnings("unchecked")
    public List<ForbiddenWord> getAllEnabledWords() {
        try {
            Object cached = redisTemplate.opsForValue().get(CACHE_KEY);
            if (cached != null) {
                return (List<ForbiddenWord>) cached;
            }
        } catch (Exception e) {
            log.warn("从Redis获取禁用词缓存失败", e);
        }

        LambdaQueryWrapper<ForbiddenWord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ForbiddenWord::getEnabled, 1);
        List<ForbiddenWord> words = forbiddenWordMapper.selectList(wrapper);

        try {
            redisTemplate.opsForValue().set(CACHE_KEY, words, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("缓存禁用词失败", e);
        }

        return words;
    }

    public List<ForbiddenWord> checkContent(String content) {
        List<ForbiddenWord> result = new ArrayList<>();
        if (content == null || content.isEmpty()) {
            return result;
        }
        List<ForbiddenWord> allWords = getAllEnabledWords();
        for (ForbiddenWord word : allWords) {
            if (content.contains(word.getWord())) {
                result.add(word);
            }
        }
        return result;
    }

    public PageResult<ForbiddenWord> queryWords(Long pageNum, Long pageSize, String word,
                                                 String category, String riskLevel, Integer enabled) {
        Page<ForbiddenWord> page = new Page<>(pageNum != null ? pageNum : 1, pageSize != null ? pageSize : 10);
        LambdaQueryWrapper<ForbiddenWord> wrapper = new LambdaQueryWrapper<>();

        if (word != null && !word.isEmpty()) {
            wrapper.like(ForbiddenWord::getWord, word);
        }
        if (category != null && !category.isEmpty()) {
            wrapper.eq(ForbiddenWord::getCategory, category);
        }
        if (riskLevel != null && !riskLevel.isEmpty()) {
            wrapper.eq(ForbiddenWord::getRiskLevel, riskLevel);
        }
        if (enabled != null) {
            wrapper.eq(ForbiddenWord::getEnabled, enabled);
        }
        wrapper.orderByDesc(ForbiddenWord::getCreatedAt);

        Page<ForbiddenWord> result = forbiddenWordMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), pageNum, pageSize);
    }

    @Transactional
    public ForbiddenWord addWord(ForbiddenWord word, Long operatorId, String operatorName) {
        LambdaQueryWrapper<ForbiddenWord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ForbiddenWord::getWord, word.getWord());
        if (forbiddenWordMapper.selectCount(wrapper) > 0) {
            throw BusinessException.retryable("该禁用词已存在");
        }
        word.setEnabled(1);
        word.setOperatorId(operatorId);
        word.setOperatorName(operatorName);
        forbiddenWordMapper.insert(word);
        clearCache();
        operationLogService.log("ADD_FORBIDDEN_WORD", "FORBIDDEN_WORD", word.getId().toString(),
                word.getSourceOrderNo(), operatorId, operatorName, "新增禁用词：" + word.getWord());
        return word;
    }

    @Transactional
    public ForbiddenWord updateWord(ForbiddenWord word, Long operatorId, String operatorName) {
        ForbiddenWord exists = forbiddenWordMapper.selectById(word.getId());
        if (exists == null) {
            throw BusinessException.retryable("禁用词不存在，请刷新后重试");
        }
        word.setOperatorId(operatorId);
        word.setOperatorName(operatorName);
        forbiddenWordMapper.updateById(word);
        clearCache();
        operationLogService.log("UPDATE_FORBIDDEN_WORD", "FORBIDDEN_WORD", word.getId().toString(),
                word.getSourceOrderNo(), operatorId, operatorName, "更新禁用词：" + word.getWord());
        return word;
    }

    @Transactional
    public void deleteWord(Long id, Long operatorId, String operatorName, String sourceOrderNo, String remark) {
        ForbiddenWord word = forbiddenWordMapper.selectById(id);
        if (word == null) {
            throw BusinessException.retryable("禁用词不存在，请刷新后重试");
        }
        forbiddenWordMapper.deleteById(id);
        clearCache();
        operationLogService.log("DELETE_FORBIDDEN_WORD", "FORBIDDEN_WORD", id.toString(),
                sourceOrderNo, operatorId, operatorName, remark != null ? remark : "删除禁用词：" + word.getWord());
    }

    public PageResult<ForbiddenWordHit> queryWordHits(Long pageNum, Long pageSize, Long draftId,
                                                       String sourceOrderNo, String word,
                                                       String startDate, String endDate) {
        Page<ForbiddenWordHit> page = new Page<>(pageNum != null ? pageNum : 1, pageSize != null ? pageSize : 10);
        LambdaQueryWrapper<ForbiddenWordHit> wrapper = new LambdaQueryWrapper<>();

        if (draftId != null) {
            wrapper.eq(ForbiddenWordHit::getDraftId, draftId);
        }
        if (sourceOrderNo != null && !sourceOrderNo.isEmpty()) {
            wrapper.like(ForbiddenWordHit::getSourceOrderNo, sourceOrderNo);
        }
        if (word != null && !word.isEmpty()) {
            wrapper.like(ForbiddenWordHit::getWord, word);
        }
        if (startDate != null) {
            wrapper.ge(ForbiddenWordHit::getCreatedAt, startDate + " 00:00:00");
        }
        if (endDate != null) {
            wrapper.le(ForbiddenWordHit::getCreatedAt, endDate + " 23:59:59");
        }
        wrapper.orderByDesc(ForbiddenWordHit::getCreatedAt);

        Page<ForbiddenWordHit> result = forbiddenWordHitMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), pageNum, pageSize);
    }

    public List<ForbiddenWordHit> getHitsByDraftId(Long draftId) {
        LambdaQueryWrapper<ForbiddenWordHit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ForbiddenWordHit::getDraftId, draftId);
        wrapper.orderByDesc(ForbiddenWordHit::getCreatedAt);
        return forbiddenWordHitMapper.selectList(wrapper);
    }

    private void clearCache() {
        try {
            redisTemplate.delete(CACHE_KEY);
        } catch (Exception e) {
            log.warn("清除禁用词缓存失败", e);
        }
    }
}
