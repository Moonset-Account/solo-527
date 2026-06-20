package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.decoration.crm.handler.PostgreSqlEnumTypeHandler;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName(value = "sys_user", autoResultMap = true)
public class SysUser {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String realName;
    private String email;
    private String phone;
    @TableField(typeHandler = PostgreSqlEnumTypeHandler.class)
    private String role;
    private String department;
    private Boolean status;
    private String avatar;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    @TableLogic
    private LocalDateTime deletedAt;
}
