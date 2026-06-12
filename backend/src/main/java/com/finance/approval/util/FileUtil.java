package com.finance.approval.util;

import com.finance.approval.config.FileStorageConfig;
import com.finance.approval.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FileUtil {

    private final FileStorageConfig fileStorageConfig;

    public String uploadFile(MultipartFile file) {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            if (fileName.contains("..")) {
                throw new BusinessException("文件名包含无效路径序列");
            }

            validateFileExtension(fileName);
            validateFileSize(file.getSize());

            Path uploadPath = Paths.get(fileStorageConfig.getUploadPath()).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String newFileName = UUID.randomUUID().toString() + "_" + fileName;
            Path targetLocation = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new BusinessException("文件存储失败 " + fileName + "，请重试！");
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = Paths.get(fileStorageConfig.getUploadPath()).toAbsolutePath().normalize().resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new BusinessException("文件未找到 " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new BusinessException("文件未找到 " + fileName);
        }
    }

    public boolean deleteFile(String fileName) {
        try {
            Path filePath = Paths.get(fileStorageConfig.getUploadPath()).toAbsolutePath().normalize().resolve(fileName).normalize();
            return Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new BusinessException("文件删除失败 " + fileName);
        }
    }

    private void validateFileExtension(String fileName) {
        String fileExtension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
        String[] allowedExtensions = fileStorageConfig.getAllowedExtensions().split(",");
        if (!Arrays.asList(allowedExtensions).contains(fileExtension)) {
            throw new BusinessException("不支持的文件类型，支持的类型：" + fileStorageConfig.getAllowedExtensions());
        }
    }

    private void validateFileSize(long fileSize) {
        if (fileSize > fileStorageConfig.getMaxFileSize()) {
            throw new BusinessException("文件大小超过限制，最大支持：" + (fileStorageConfig.getMaxFileSize() / 1024 / 1024) + "MB");
        }
    }
}
