package com.sales.email.controller;

import com.sales.email.common.PageResult;
import com.sales.email.common.Result;
import com.sales.email.entity.ForbiddenWord;
import com.sales.email.entity.ForbiddenWordHit;
import com.sales.email.service.ForbiddenWordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/forbidden-word")
@RequiredArgsConstructor
public class ForbiddenWordController {

    private final ForbiddenWordService forbiddenWordService;

    @GetMapping("/all-enabled")
    public Result<List<ForbiddenWord>> getAllEnabledWords() {
        return Result.success(forbiddenWordService.getAllEnabledWords());
    }

    @PostMapping("/check")
    public Result<List<ForbiddenWord>> checkContent(@RequestBody Map<String, String> body) {
        String content = body.get("content");
        return Result.success(forbiddenWordService.checkContent(content));
    }

    @GetMapping("/query")
    public Result<PageResult<ForbiddenWord>> queryWords(
            @RequestParam(required = false) Long pageNum,
            @RequestParam(required = false) Long pageSize,
            @RequestParam(required = false) String word,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) Integer enabled) {
        return Result.success(forbiddenWordService.queryWords(pageNum, pageSize, word, category, riskLevel, enabled));
    }

    @PostMapping
    public Result<ForbiddenWord> addWord(@RequestBody Map<String, Object> body) {
        ForbiddenWord word = new ForbiddenWord();
        word.setWord((String) body.get("word"));
        word.setCategory((String) body.get("category"));
        word.setRiskLevel((String) body.get("riskLevel"));
        word.setReplacement((String) body.get("replacement"));
        word.setSourceOrderNo((String) body.get("sourceOrderNo"));
        word.setOperatorRemark((String) body.get("operatorRemark"));
        Long operatorId = body.get("operatorId") != null ? Long.valueOf(body.get("operatorId").toString()) : null;
        String operatorName = (String) body.get("operatorName");
        return Result.success(forbiddenWordService.addWord(word, operatorId, operatorName));
    }

    @PutMapping
    public Result<ForbiddenWord> updateWord(@RequestBody ForbiddenWord word) {
        return Result.success(forbiddenWordService.updateWord(word, word.getOperatorId(), word.getOperatorName()));
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteWord(@PathVariable Long id,
                                    @RequestParam(required = false) Long operatorId,
                                    @RequestParam(required = false) String operatorName,
                                    @RequestParam(required = false) String sourceOrderNo,
                                    @RequestParam(required = false) String remark) {
        forbiddenWordService.deleteWord(id, operatorId, operatorName, sourceOrderNo, remark);
        return Result.success();
    }

    @GetMapping("/hits/query")
    public Result<PageResult<ForbiddenWordHit>> queryWordHits(
            @RequestParam(required = false) Long pageNum,
            @RequestParam(required = false) Long pageSize,
            @RequestParam(required = false) Long draftId,
            @RequestParam(required = false) String sourceOrderNo,
            @RequestParam(required = false) String word,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return Result.success(forbiddenWordService.queryWordHits(pageNum, pageSize, draftId, sourceOrderNo, word, startDate, endDate));
    }
}
