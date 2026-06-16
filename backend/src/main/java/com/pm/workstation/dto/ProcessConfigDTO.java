package com.pm.workstation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProcessConfigDTO {

    @NotNull(message = "流程定义ID不能为空")
    private Long definitionId;

    @NotBlank(message = "流程名称不能为空")
    private String name;

    private String description;

    @NotEmpty(message = "流程节点不能为空")
    @Valid
    private List<NodeConfig> nodes;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeConfig {

        @NotBlank(message = "节点名称不能为空")
        private String nodeName;

        @NotNull(message = "节点顺序不能为空")
        private Integer nodeOrder;

        private Long roleId;

        private String assigneeType;

        private Long assigneeId;

        private Boolean autoRemind;

        private Integer remindHours;
    }
}
