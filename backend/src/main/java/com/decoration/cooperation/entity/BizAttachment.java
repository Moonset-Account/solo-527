package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_attachment")
public class BizAttachment extends BaseEntity {
    private String bizType;
    private Long bizId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String fileType;
    private Long uploaderId;
    private String uploaderName;
    private String remark;
}
