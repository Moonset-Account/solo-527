package com.property.service;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.property.common.Result;
import com.property.common.UserContext;
import com.property.entity.Attachment;
import com.property.mapper.AttachmentMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class FileService {

    @Value("${file.upload.path}")
    private String uploadPath;

    @Value("${file.upload.url-prefix}")
    private String urlPrefix;

    @Autowired
    private AttachmentMapper attachmentMapper;

    public Result<Attachment> uploadFile(MultipartFile file, String bizType, Long bizId) {
        if (file == null || file.isEmpty()) {
            return Result.validateError("请选择要上传的文件");
        }

        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String fileName = IdUtil.simpleUUID() + fileExtension;

        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String relativePath = bizType.toLowerCase() + "/" + datePath;

        File targetDir = new File(uploadPath + "/" + relativePath);
        if (!targetDir.exists()) {
            targetDir.mkdirs();
        }

        Path targetPath = Paths.get(targetDir.getAbsolutePath(), fileName);
        try {
            Files.copy(file.getInputStream(), targetPath);
        } catch (IOException e) {
            log.error("文件上传失败", e);
            return Result.error("文件上传失败：" + e.getMessage());
        }

        String fileType = getFileType(fileExtension);
        String fileUrl = urlPrefix + "/" + relativePath + "/" + fileName;
        String filePath = relativePath + "/" + fileName;

        Attachment attachment = new Attachment();
        attachment.setBizType(bizType);
        attachment.setBizId(bizId);
        attachment.setFileName(fileName);
        attachment.setOriginalName(originalFilename);
        attachment.setFilePath(filePath);
        attachment.setFileUrl(fileUrl);
        attachment.setFileSize(file.getSize());
        attachment.setFileType(fileType);
        attachment.setMimeType(file.getContentType());
        attachment.setUploaderId(UserContext.getUserId());

        attachmentMapper.insert(attachment);

        log.info("文件上传成功: fileName={}, bizType={}, bizId={}", originalFilename, bizType, bizId);

        return Result.success("上传成功", attachment);
    }

    public List<Attachment> getAttachments(String bizType, Long bizId) {
        return attachmentMapper.selectList(
                new LambdaQueryWrapper<Attachment>()
                        .eq(Attachment::getBizType, bizType)
                        .eq(Attachment::getBizId, bizId)
                        .orderByAsc(Attachment::getCreatedAt)
        );
    }

    public Result<Void> deleteAttachment(Long id) {
        Attachment attachment = attachmentMapper.selectById(id);
        if (attachment == null) {
            return Result.validateError("附件不存在");
        }

        Long currentUserId = UserContext.getUserId();
        if (!attachment.getUploaderId().equals(currentUserId)) {
            return Result.forbidden("无权限删除该附件");
        }

        File file = new File(uploadPath + "/" + attachment.getFilePath());
        if (file.exists()) {
            file.delete();
        }

        attachmentMapper.deleteById(id);

        log.info("附件删除成功: id={}", id);

        return Result.success();
    }

    private String getFileExtension(String filename) {
        if (StrUtil.isBlank(filename)) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex).toLowerCase();
        }
        return "";
    }

    private String getFileType(String extension) {
        String ext = extension.toLowerCase();
        if (ext.matches("\\.(jpg|jpeg|png|gif|bmp|webp)")) {
            return "image";
        } else if (ext.matches("\\.(mp4|avi|mov|wmv|flv)")) {
            return "video";
        } else if (ext.matches("\\.(doc|docx|pdf|xls|xlsx|ppt|pptx|txt)")) {
            return "doc";
        }
        return "other";
    }
}
