package com.energy.dashboard.common;

import lombok.Data;

@Data
public class PageRequest {

    private int page = 1;
    private int pageSize = 10;
}
