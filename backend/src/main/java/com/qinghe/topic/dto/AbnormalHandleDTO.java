package com.qinghe.topic.dto;

import lombok.Data;

@Data
public class AbnormalHandleDTO {
    private Long id;
    private String conclusion;
    private Long handlerId;
    private String handlerName;
}
