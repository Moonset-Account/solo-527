package com.rider.analyzer.config;

import com.rider.analyzer.entity.*;
import com.rider.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final RiderRepository riderRepository;
    private final StationRepository stationRepository;
    private final StationInventoryRepository stationInventoryRepository;
    private final DeliveryOrderRepository deliveryOrderRepository;
    private final SignRecordRepository signRecordRepository;
    private final ExceptionRecordRepository exceptionRecordRepository;
    private final TimelinessNodeRepository timelinessNodeRepository;
    private final SettlementRecordRepository settlementRecordRepository;
    private final OperationLogRepository operationLogRepository;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (stationRepository.count() > 0) return;

            Station s1 = new Station();
            s1.setName("朝阳站点");
            s1.setAddress("朝阳区建国路88号");
            s1.setLng(new BigDecimal("116.4551"));
            s1.setLat(new BigDecimal("39.9042"));
            s1 = stationRepository.save(s1);

            Station s2 = new Station();
            s2.setName("海淀站点");
            s2.setAddress("海淀区中关村大街1号");
            s2.setLng(new BigDecimal("116.3176"));
            s2.setLat(new BigDecimal("39.9847"));
            s2 = stationRepository.save(s2);

            Station s3 = new Station();
            s3.setName("丰台站点");
            s3.setAddress("丰台区丰台路5号");
            s3.setLng(new BigDecimal("116.2869"));
            s3.setLat(new BigDecimal("39.8578"));
            stationRepository.save(s3);

            Rider r1 = new Rider();
            r1.setName("骑手张伟");
            r1.setPhone("13800138001");
            r1.setStatus("ONLINE");
            r1.setStationId(s1.getId());
            riderRepository.save(r1);

            Rider r2 = new Rider();
            r2.setName("骑手李娜");
            r2.setPhone("13800138002");
            r2.setStatus("ONLINE");
            r2.setStationId(s2.getId());
            riderRepository.save(r2);

            Rider r3 = new Rider();
            r3.setName("骑手王强");
            r3.setPhone("13800138003");
            r3.setStatus("OFFLINE");
            r3.setStationId(s1.getId());
            riderRepository.save(r3);

            String[] skus = {"SKU-001", "SKU-002", "SKU-003", "SKU-004", "SKU-005"};
            String[] skuNames = {"有机牛奶", "新鲜鸡蛋", "精选牛排", "时令水果", "冷冻水饺"};
            for (Station s : stationRepository.findAll()) {
                for (int i = 0; i < skus.length; i++) {
                    StationInventory inv = new StationInventory();
                    inv.setStationId(s.getId());
                    inv.setSkuCode(skus[i]);
                    inv.setSkuName(skuNames[i]);
                    inv.setQuantity(50 + (int)(Math.random() * 150));
                    stationInventoryRepository.save(inv);
                }
            }

            String[] statuses = {"PENDING", "ACCEPTED", "PICKED_UP", "DELIVERING", "SIGNED", "EXCEPTION"};
            String[] receivers = {"张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑十一", "王十二"};
            String[] addresses = {
                "朝阳区建国路1号院", "海淀区中关村2号楼", "丰台区丰台路3号",
                "东城区王府井4号", "西城区金融街5号", "朝阳区三里屯6号",
                "海淀区五道口7号", "丰台区丽泽8号", "东城区东直门9号", "西城区西单10号"
            };

            LocalDateTime baseTime = LocalDateTime.now().minusDays(3);
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyMMddHHmmss");

            for (int i = 0; i < 20; i++) {
                DeliveryOrder order = new DeliveryOrder();
                order.setOrderNo("ORD-" + baseTime.plusHours(i).format(fmt) + String.format("%03d", i));
                order.setStationId(i % 2 == 0 ? s1.getId() : s2.getId());
                order.setReceiverName(receivers[i % receivers.length]);
                order.setReceiverPhone("139" + String.format("%08d", 10000000 + i));
                order.setReceiverAddress(addresses[i % addresses.length]);
                order.setStatus(statuses[i % statuses.length]);
                order.setPromiseTime(baseTime.plusHours(i).plusMinutes(90));
                order.setCreateTime(baseTime.plusHours(i));

                if (order.getStatus().equals("PENDING")) {
                    order.setRiderId(null);
                } else {
                    order.setRiderId(i % 2 == 0 ? r1.getId() : r2.getId());
                }

                if (!order.getStatus().equals("PENDING")) {
                    order.setAcceptTime(baseTime.plusHours(i).plusMinutes(3));
                }
                if ("PICKED_UP".equals(order.getStatus()) || "DELIVERING".equals(order.getStatus())
                        || "SIGNED".equals(order.getStatus()) || "EXCEPTION".equals(order.getStatus())) {
                    order.setPickupTime(baseTime.plusHours(i).plusMinutes(20));
                }
                if ("DELIVERING".equals(order.getStatus()) || "SIGNED".equals(order.getStatus()) || "EXCEPTION".equals(order.getStatus())) {
                    order.setDeliverTime(baseTime.plusHours(i).plusMinutes(45));
                }
                if ("SIGNED".equals(order.getStatus())) {
                    order.setSignTime(baseTime.plusHours(i).plusMinutes(75));
                }

                deliveryOrderRepository.save(order);

                String[] nodeTypes = {"ACCEPT", "PICKUP", "DELIVER", "SIGN"};
                for (int j = 0; j < nodeTypes.length; j++) {
                    TimelinessNode node = new TimelinessNode();
                    node.setOrderId(order.getId());
                    node.setNodeType(nodeTypes[j]);
                    node.setPlanTime(baseTime.plusHours(i).plusMinutes(5 + j * 25));

                    boolean isTimeout = (i + j) % 5 == 0 && !"PENDING".equals(order.getStatus());
                    int extraMin = isTimeout ? 15 + (int)(Math.random() * 30) : 0;

                    LocalDateTime actual = baseTime.plusHours(i).plusMinutes(3 + j * 20 + extraMin);
                    if (j == 0 && "PENDING".equals(order.getStatus())) {
                        continue;
                    }
                    if (j >= 1 && "ACCEPTED".equals(order.getStatus())) {
                        continue;
                    }
                    if (j >= 2 && "PICKED_UP".equals(order.getStatus())) {
                        continue;
                    }
                    if (j >= 3 && "DELIVERING".equals(order.getStatus())) {
                        continue;
                    }
                    if (j >= 3 && "EXCEPTION".equals(order.getStatus())) {
                        continue;
                    }

                    node.setActualTime(actual);
                    node.setIsTimeout(isTimeout ? 1 : 0);
                    node.setTimeoutMinutes(isTimeout ? extraMin : 0);
                    timelinessNodeRepository.save(node);
                }

                if ("SIGNED".equals(order.getStatus())) {
                    SignRecord sr = new SignRecord();
                    sr.setOrderId(order.getId());
                    sr.setExpectedQty(10);
                    int actual = 10 - (i % 3 == 0 ? 1 : 0);
                    sr.setActualQty(actual);
                    sr.setDiffQty(actual - 10);
                    if (actual < 10) {
                        sr.setDiffReason(i % 2 == 0 ? "配送途中破损" : "数量不足");
                    }
                    sr.setSignType("NORMAL");
                    signRecordRepository.save(sr);

                    SettlementRecord settle = new SettlementRecord();
                    settle.setOrderId(order.getId());
                    settle.setRiderId(order.getRiderId());
                    settle.setAmount(BigDecimal.valueOf(8.5 + (i % 5) * 0.5));
                    settle.setStatus("CONFIRMED");
                    settle.setAccuracyFlag(i % 10 == 0 ? 0 : 1);
                    settlementRecordRepository.save(settle);
                }
            }

            String[] excTypes = {"TEMPERATURE", "DELAY", "DAMAGE", "OTHER"};
            String[] excDescs = {
                "冷链配送温度超标2度", "配送延迟30分钟", "商品外包装破损",
                "客户拒收", "冷冻品温度异常升高", "地址不详无法配送"
            };

            for (int i = 0; i < 8; i++) {
                ExceptionRecord exc = new ExceptionRecord();
                exc.setOrderId(1L + i * 2);
                exc.setType(excTypes[i % excTypes.length]);
                exc.setDescription(excDescs[i % excDescs.length]);
                exc.setStatus(i % 2 == 0 ? "RESOLVED" : "PENDING");
                exc.setCreateTime(baseTime.plusHours(i * 6));

                if ("RESOLVED".equals(exc.getStatus())) {
                    exc.setHandlerName(i % 2 == 0 ? "张主管" : "李主管");
                    exc.setHandleDurationMin(15 + i * 5);
                    if ("TEMPERATURE".equals(exc.getType())) {
                        exc.setTempAnomalyReason("冷链箱密封不严");
                    } else {
                        exc.setTempAnomalyReason("不适用");
                    }
                    exc.setResolveTime(baseTime.plusHours(i * 6).plusMinutes(exc.getHandleDurationMin()));
                }
                exceptionRecordRepository.save(exc);
            }
        };
    }
}
