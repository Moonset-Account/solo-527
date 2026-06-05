package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;


@Data
@TableName("owner")
public class Owner {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String idCard;

    private String contactAddress;

    private String emergencyContact;

    private String emergencyPhone;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;

    @TableField(exist = false)
    private String realName;

    @TableField(exist = false)
    private String phone;

    @TableField(exist = false)
    private String email;
}
