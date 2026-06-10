package com.energy.dashboard.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("energy_data")
public class EnergyData {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("meter_id")
    private Long meterId;

    private BigDecimal value;

    private String unit;

    @TableField("data_type")
    private String dataType;

    @TableField("recorded_at")
    private LocalDateTime recordedAt;

    @TableField("created_at")
    private LocalDateTime createdAt;
}
