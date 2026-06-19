package com.decoration.cooperation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.decoration.cooperation.entity.BizAttachment;
import com.decoration.cooperation.exception.BusinessException;
import com.decoration.cooperation.mapper.BizAttachmentMapper;
import com.decoration.cooperation.service.BizAttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BizAttachmentServiceImpl extends ServiceImpl<BizAttachmentMapper, BizAttachment> implements BizAttachmentService {

    @Value("${upload.path:uploads}")
    private String uploadPath;

    @Override
    public BizAttachment uploadAttachment(String bizType, Long bizId, MultipartFile file, Long uploaderId, String uploaderName) {
        if (file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }

        String originalFilename = file.getOriginalFilename();
        String fileType = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
                : "";

        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String relativePath = dateStr + "/" + UUID.randomUUID().toString().replace("-", "")
                + (originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "");

        File targetFile = new File(uploadPath + "/" + relativePath);
        if (!targetFile.getParentFile().exists()) {
            targetFile.getParentFile().mkdirs();
        }

        try {
            file.transferTo(targetFile);
        } catch (IOException e) {
            throw new BusinessException("文件上传失败");
        }

        BizAttachment attachment = new BizAttachment();
        attachment.setBizType(bizType);
        attachment.setBizId(bizId);
        attachment.setFileName(originalFilename);
        attachment.setFilePath(relativePath);
        attachment.setFileSize(file.getSize());
        attachment.setFileType(fileType);
        attachment.setUploaderId(uploaderId);
        attachment.setUploaderName(uploaderName);
        save(attachment);

        return attachment;
    }

    @Override
    public List<BizAttachment> listByBiz(String bizType, Long bizId) {
        LambdaQueryWrapper<BizAttachment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BizAttachment::getBizType, bizType);
        wrapper.eq(BizAttachment::getBizId, bizId);
        wrapper.orderByDesc(BizAttachment::getCreateTime);
        return list(wrapper);
    }
}
