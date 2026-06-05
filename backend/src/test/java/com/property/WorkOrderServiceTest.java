package com.property;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.property.common.enums.WorkOrderPriorityEnum;
import com.property.common.enums.WorkOrderStatusEnum;
import com.property.entity.WorkOrder;
import com.property.entity.WorkOrderHistory;
import com.property.mapper.WorkOrderHistoryMapper;
import com.property.mapper.WorkOrderMapper;
import com.property.service.WorkOrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class WorkOrderServiceTest {

    @Autowired
    private WorkOrderService workOrderService;

    @Autowired
    private WorkOrderMapper workOrderMapper;

    @Autowired
    private WorkOrderHistoryMapper workOrderHistoryMapper;

    @Test
    void testUrgentOrderPriority() {
        WorkOrder order = new WorkOrder();
        order.setTitle("测试紧急工单");
        order.setDescription("测试紧急工单描述");
        order.setCategory("水电维修");
        order.setPriority(WorkOrderPriorityEnum.URGENT.getCode());
        order.setOwnerId(1L);
        order.setRoomId(1L);
        order.setContactPerson("测试业主");
        order.setContactPhone("13800000000");

        var result = workOrderService.createWorkOrder(order);
        assertTrue(result.getCode() == 200, "紧急工单创建成功");
        assertNotNull(result.getData());
        assertEquals(WorkOrderPriorityEnum.URGENT.getCode(), result.getData().getPriority());
    }

    @Test
    void testOrderWorkflow() {
        WorkOrder order = new WorkOrder();
        order.setTitle("测试流程工单");
        order.setDescription("测试工单流程");
        order.setCategory("水电维修");
        order.setPriority(WorkOrderPriorityEnum.NORMAL.getCode());
        order.setOwnerId(1L);
        order.setRoomId(1L);
        order.setContactPerson("测试业主");
        order.setContactPhone("13800000000");

        var createResult = workOrderService.createWorkOrder(order);
        Long orderId = createResult.getData().getId();
        assertEquals(WorkOrderStatusEnum.PENDING.getCode(), createResult.getData().getStatus());

        var approveResult = workOrderService.approveOrder(orderId, true, null, 3L);
        assertEquals(WorkOrderStatusEnum.APPROVED.getCode(), approveResult.getData().getStatus());
        assertNotNull(approveResult.getData().getAssigneeId());

        var startResult = workOrderService.startProcess(orderId);
        assertEquals(WorkOrderStatusEnum.PROCESSING.getCode(), startResult.getData().getStatus());

        var completeResult = workOrderService.completeOrder(orderId, "测试处理完成", null);
        assertEquals(WorkOrderStatusEnum.COMPLETED.getCode(), completeResult.getData().getStatus());

        List<WorkOrderHistory> history = workOrderHistoryMapper.selectList(
                new LambdaQueryWrapper<WorkOrderHistory>().eq(WorkOrderHistory::getWorkOrderId, orderId)
        );
        assertTrue(history.size() >= 4, "工单历史记录数量正确");
    }

    @Test
    void testCloseOrderWithoutPhoto() {
        WorkOrder order = workOrderMapper.selectOne(
                new LambdaQueryWrapper<WorkOrder>()
                        .eq(WorkOrder::getStatus, WorkOrderStatusEnum.COMPLETED.getCode())
                        .last("LIMIT 1")
        );

        if (order != null) {
            order.setHasPhoto(0);
            workOrderMapper.updateById(order);

            var result = workOrderService.closeOrder(order.getId());
            assertFalse(result.getCode() == 200, "没有照片时关闭工单应失败");
            assertTrue(result.getMessage().contains("照片"), "错误信息应包含照片提示");
        }
    }

    @Test
    void testSensitiveFieldFilter() {
        var page = workOrderService.getOrderPage(1, 10, null, null, null);
        assertNotNull(page.getRecords());

        for (WorkOrder order : page.getRecords()) {
            assertNull(order.getRejectReason(), "普通用户不应看到驳回原因");
        }
    }
}
