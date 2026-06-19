package com.decoration.cooperation.dto;

import com.decoration.cooperation.entity.BizCustomer;
import com.decoration.cooperation.entity.BizDecorationRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LeadCreateDTO {
    @NotBlank(message = "项目名称不能为空")
    private String projectName;
    private String source;
    private String sourceDetail;
    private String decorationType;
    private BigDecimal houseArea;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private String city;
    private String district;
    private String community;
    private LocalDate expectStartDate;
    @NotNull(message = "负责人不能为空")
    private Long ownerId;
    private Integer importance;
    private LocalDate predictDealDate;
    private Integer predictDealRate;
    private String remark;

    @Valid
    @NotNull(message = "客户信息不能为空")
    private BizCustomer customer;

    @Valid
    private BizDecorationRequirement requirement;
}
