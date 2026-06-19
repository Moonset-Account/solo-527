package com.decoration.cooperation.vo;

import com.decoration.cooperation.entity.BizCustomer;
import com.decoration.cooperation.entity.BizDecorationRequirement;
import com.decoration.cooperation.entity.BizHouseMeasure;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class LeadDetailVO {
    private Long id;
    private String leadNo;
    private String source;
    private String sourceDetail;
    private String projectName;
    private String decorationType;
    private java.math.BigDecimal houseArea;
    private java.math.BigDecimal budgetMin;
    private java.math.BigDecimal budgetMax;
    private String city;
    private String district;
    private String community;
    private LocalDate expectStartDate;
    private Long ownerId;
    private String ownerName;
    private String status;
    private String statusName;
    private String followStage;
    private String followStageName;
    private Integer importance;
    private Integer conflictFlag;
    private String conflictWithIds;
    private LocalDate predictDealDate;
    private Integer predictDealRate;
    private String remark;
    private LocalDateTime assignTime;
    private LocalDateTime lastFollowTime;
    private LocalDateTime nextFollowTime;
    private LocalDateTime createTime;

    private BizCustomer customer;
    private BizDecorationRequirement requirement;
    private BizHouseMeasure measure;
    private List<TimelineItemVO> timeline;
}
