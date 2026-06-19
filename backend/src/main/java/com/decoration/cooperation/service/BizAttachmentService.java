package com.decoration.cooperation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.decoration.cooperation.entity.BizAttachment;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BizAttachmentService extends IService<BizAttachment> {

    BizAttachment uploadAttachment(String bizType, Long bizId, MultipartFile file, Long uploaderId, String uploaderName);

    List<BizAttachment> listByBiz(String bizType, Long bizId);
}
