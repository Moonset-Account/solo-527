package com.property.controller;

import com.property.common.Result;
import com.property.entity.Attachment;
import com.property.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/files")
public class FileController {

    @Autowired
    private FileService fileService;

    @PostMapping("/upload")
    public Result<Attachment> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam String bizType,
            @RequestParam Long bizId) {
        return fileService.uploadFile(file, bizType, bizId);
    }

    @GetMapping
    public Result<List<Attachment>> getAttachments(
            @RequestParam String bizType,
            @RequestParam Long bizId) {
        return Result.success(fileService.getAttachments(bizType, bizId));
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteAttachment(@PathVariable Long id) {
        return fileService.deleteAttachment(id);
    }
}
