package com.decoration.crm.service.impl;

import com.decoration.crm.entity.LeadAttachment;
import com.decoration.crm.exception.BusinessException;
import com.decoration.crm.mapper.LeadAttachmentMapper;
import com.decoration.crm.security.UserDetailsImpl;
import com.decoration.crm.service.LeadAttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class LeadAttachmentServiceImpl implements LeadAttachmentService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Autowired
    private LeadAttachmentMapper leadAttachmentMapper;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }

    @Override
    public List<LeadAttachment> getByLeadId(Long leadId) {
        return leadAttachmentMapper.selectByLeadId(leadId);
    }

    @Override
    public LeadAttachment getById(Long id) {
        return leadAttachmentMapper.selectById(id);
    }

    @Override
    public LeadAttachment upload(MultipartFile file, Long leadId, String category) {
        if (file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "unknown_file";
        }

        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String ext = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx >= 0) {
            ext = originalFilename.substring(dotIdx);
        }
        String storedName = UUID.randomUUID().toString().replace("-", "") + ext;

        Path dirPath = Paths.get(uploadDir, datePath);
        try {
            Files.createDirectories(dirPath);
        } catch (IOException e) {
            throw new BusinessException("创建上传目录失败: " + e.getMessage());
        }

        Path filePath = dirPath.resolve(storedName);
        try {
            file.transferTo(filePath.toFile());
        } catch (IOException e) {
            throw new BusinessException("文件保存失败: " + e.getMessage());
        }

        String relativePath = datePath + "/" + storedName;
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        LeadAttachment attachment = new LeadAttachment();
        attachment.setLeadId(leadId);
        attachment.setFileName(originalFilename);
        attachment.setFilePath(relativePath);
        attachment.setFileSize(file.getSize());
        attachment.setFileType(contentType);
        attachment.setCategory(category);
        attachment.setUploadedBy(getCurrentUserId());
        leadAttachmentMapper.insert(attachment);

        Long id = attachment.getId();
        return leadAttachmentMapper.selectByLeadId(leadId).stream()
                .filter(a -> a.getId().equals(id))
                .findFirst()
                .orElse(attachment);
    }

    @Override
    public void delete(Long id) {
        leadAttachmentMapper.deleteById(id);
    }
}
