package com.gym.controller;

import com.gym.common.response.Result;
import com.gym.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @Value("${app.upload.path:/var/gym/uploads}")
    private String uploadPath;

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "general") String category) {
        try {
            String filePath = fileStorageService.storeFile(file, category);
            Map<String, String> result = new HashMap<>();
            result.put("url", filePath);
            result.put("filename", file.getOriginalFilename());
            return Result.success(result);
        } catch (IOException e) {
            return Result.error("文件上传失败: " + e.getMessage());
        }
    }

    @GetMapping("/uploads/{category}/{filename}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String category,
            @PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadPath, category, filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
