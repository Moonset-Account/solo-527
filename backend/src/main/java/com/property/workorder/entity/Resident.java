package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("resident")
public class Resident extends BaseEntity {
    private String residentNo;
    private String name;
    private String phone;
    private String idCard;
    private String buildingNo;
    private String roomNo;
    private String email;
    private Integer status;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String remark;
}
