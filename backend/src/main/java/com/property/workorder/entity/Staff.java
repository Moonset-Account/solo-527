package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("staff")
public class Staff extends BaseEntity {
    private String staffNo;
    private String name;
    private String phone;
    private String role;
    private String department;
    private String position;
    private Integer status;
    private String remark;
}
