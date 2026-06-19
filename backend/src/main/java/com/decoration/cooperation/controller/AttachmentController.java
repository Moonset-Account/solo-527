package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.entity.BizAttachment;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.service.BizAttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final BizAttachmentService bizAttachmentService;

    @PostMapping("/upload")
    public Result<BizAttachment> upload(
            @RequestParam String bizType,
            @RequestParam Long bizId,
            @RequestParam("file") MultipartFile file) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = null;
        String userName = null;
        if (authentication != null && authentication.getPrincipal() instanceof SysUser user) {
            userId = user.getId();
            userName = user.getRealName();
        }
        return Result.success(bizAttachmentService.uploadAttachment(bizType, bizId, file, userId, userName));
    }

    @GetMapping
    public Result<List<BizAttachment>> list(
            @RequestParam String bizType,
            @RequestParam Long bizId) {
        return Result.success(bizAttachmentService.listByBiz(bizType, bizId));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        bizAttachmentService.removeById(id);
        return Result.success();
    }
}
