package com.gym.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.path:/var/gym/uploads}")
    private String uploadPath;

    public String storeFile(MultipartFile file, String category) throws IOException {
        Path uploadDir = Paths.get(uploadPath, category);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String newFilename = UUID.randomUUID() + extension;
        Path targetPath = uploadDir.resolve(newFilename);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/" + category + "/" + newFilename;
    }

    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(uploadPath, filePath.replace("/uploads/", ""));
            Files.deleteIfExists(path);
        } catch (IOException e) {
        }
    }
}
