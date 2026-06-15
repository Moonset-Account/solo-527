package com.qinghe.topic.common;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;

@Data
public class PageQuery {
    private Long current = 1L;
    private Long size = 10L;

    public <T> IPage<T> toPage() {
        return new Page<>(current, size);
    }
}
