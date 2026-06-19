package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_customer")
public class BizCustomer extends BaseEntity {
    private String customerName;
    private String phone;
    private String wechat;
    private String address;
    private Integer gender;
    private Integer age;
    private String occupation;
    private String remark;
}
