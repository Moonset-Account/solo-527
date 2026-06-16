package com.pm.workstation.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

    private Long definitionId;

    @NotBlank(message = "流程名称不能为空")
    private String name;

    private String description;

    @Valid
    private List<NodeConfig> nodes;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeConfig {

        @JsonAlias("name")
        @NotBlank(message = "节点名称不能为空")
        private String nodeName;

        @JsonAlias("order")
        @NotNull(message = "节点顺序不能为空")
        private Integer nodeOrder;

        private Long roleId;

        @JsonAlias("assignType")
        private String assigneeType;

        @JsonAlias("specificUserId")
        private Long assigneeId;

        @JsonAlias("autoReminder")
        private Boolean autoRemind;

        @JsonAlias("reminderHours")
        private Integer remindHours;
    }
}
