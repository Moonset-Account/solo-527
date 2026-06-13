<?php

namespace Database\Seeders;

use App\Models\ChurnReason;
use App\Models\OceanRule;
use App\Models\QuoteItem;
use App\Models\QuoteVersion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => '系统管理员',
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'phone' => '13800000000',
            ]
        );

        User::firstOrCreate(
            ['email' => 'operator1@example.com'],
            [
                'name' => '运营小李',
                'password' => Hash::make('123456'),
                'role' => 'operator',
                'phone' => '13800000001',
            ]
        );

        User::firstOrCreate(
            ['email' => 'operator2@example.com'],
            [
                'name' => '运营小王',
                'password' => Hash::make('123456'),
                'role' => 'operator',
                'phone' => '13800000002',
            ]
        );

        $quoteVersions = [
            [
                'version' => 'V1.0',
                'name' => '基础种植套餐',
                'description' => '面向普通需求患者的标准种植方案',
                'is_active' => true,
                'effective_date' => '2025-01-01',
                'items' => [
                    ['category' => '初诊检查', 'name' => '口腔全景片', 'price' => 200, 'unit' => '次'],
                    ['category' => '初诊检查', 'name' => 'CBCT三维影像', 'price' => 500, 'unit' => '次'],
                    ['category' => '种植体', 'name' => '韩国登腾种植体', 'price' => 4500, 'unit' => '颗'],
                    ['category' => '修复基台', 'name' => '标准基台', 'price' => 1500, 'unit' => '个'],
                    ['category' => '牙冠', 'name' => '氧化锆全瓷冠', 'price' => 2800, 'unit' => '颗'],
                    ['category' => '术后护理', 'name' => '消炎+复查套餐', 'price' => 500, 'unit' => '次'],
                ],
            ],
            [
                'version' => 'V2.0',
                'name' => '高端正畸隐形方案',
                'description' => '适合追求美观的成年正畸客户',
                'is_active' => true,
                'effective_date' => '2025-03-01',
                'items' => [
                    ['category' => '初诊', 'name' => '口扫+数字化建模', 'price' => 1200, 'unit' => '次'],
                    ['category' => '初诊', 'name' => '头颅侧位片测量', 'price' => 600, 'unit' => '次'],
                    ['category' => '方案设计', 'name' => 'AI模拟方案+专家审核', 'price' => 3000, 'unit' => '套'],
                    ['category' => '矫治器', 'name' => '隐适美标准系列(48副)', 'price' => 32000, 'unit' => '套'],
                    ['category' => '复诊', 'name' => '复诊监控(12次)', 'price' => 3600, 'unit' => '次'],
                    ['category' => '保持', 'name' => '透明保持器(上下)', 'price' => 1200, 'unit' => '副'],
                ],
            ],
            [
                'version' => 'V1.5',
                'name' => '儿童早期干预套餐',
                'description' => '6-12岁儿童颜面管理早期方案',
                'is_active' => true,
                'effective_date' => '2025-02-01',
                'items' => [
                    ['category' => '初诊', 'name' => '儿童颜面评估', 'price' => 500, 'unit' => '次'],
                    ['category' => '初诊', 'name' => '生长发育预测', 'price' => 800, 'unit' => '次'],
                    ['category' => '矫治', 'name' => 'MRC肌功能矫治器', 'price' => 6800, 'unit' => '套'],
                    ['category' => '矫治', 'name' => '罗慕咬合诱导器', 'price' => 15000, 'unit' => '套'],
                    ['category' => '复诊', 'name' => '阶段复查(8次)', 'price' => 2400, 'unit' => '次'],
                ],
            ],
            [
                'version' => 'V3.0',
                'name' => '美学修复综合方案',
                'description' => '贴面/美白/牙周联合方案',
                'is_active' => false,
                'effective_date' => '2024-09-01',
                'items' => [
                    ['category' => '检查', 'name' => 'DSD美学设计', 'price' => 1500, 'unit' => '次'],
                    ['category' => '修复', 'name' => 'Emax铸瓷贴面(16颗)', 'price' => 64000, 'unit' => '颗'],
                    ['category' => '美白', 'name' => '冷光美白2次', 'price' => 3800, 'unit' => '次'],
                    ['category' => '牙周', 'name' => '牙周深层洁治', 'price' => 2400, 'unit' => '全口'],
                ],
            ],
        ];

        foreach ($quoteVersions as $qv) {
            $version = QuoteVersion::updateOrCreate(
                ['version' => $qv['version']],
                collect($qv)->except('items')->toArray()
            );
            QuoteItem::where('quote_version_id', $version->id)->delete();
            foreach ($qv['items'] as $idx => $item) {
                $version->items()->create([...$item, 'sort_order' => $idx]);
            }
        }

        $oceanRules = [
            [
                'name' => '标准公海规则(日常)',
                'days_unassigned' => 7,
                'days_no_follow' => 15,
                'description' => '新建线索7天内必须分配责任人；分配后超过15天无跟进记录自动流入公海。',
                'is_active' => true,
            ],
            [
                'name' => '旺季快速规则',
                'days_unassigned' => 3,
                'days_no_follow' => 7,
                'description' => '适用于节假日、旺季营销活动期间，加速线索流转，避免冷却。',
                'is_active' => false,
            ],
            [
                'name' => '管理员兜底规则',
                'days_unassigned' => 14,
                'days_no_follow' => 30,
                'description' => '管理员及VIP客户线索专用，给予更长跟进周期。',
                'is_active' => false,
            ],
        ];

        foreach ($oceanRules as $rule) {
            OceanRule::updateOrCreate(['name' => $rule['name']], $rule);
        }

        $churnReasons = [
            ['name' => '价格过高', 'category' => '价格', 'description' => '客户认为整体报价超出心理预期', 'is_active' => true, 'sort_order' => 1],
            ['name' => '优惠活动未匹配', 'category' => '价格', 'description' => '希望等待更大优惠或对比竞品促销', 'is_active' => true, 'sort_order' => 2],
            ['name' => '付款方式受限', 'category' => '价格', 'description' => '无法分期/医保报销受限', 'is_active' => true, 'sort_order' => 3],
            ['name' => '不信任医生/方案', 'category' => '信任', 'description' => '对主治医生资历、案例数有疑虑', 'is_active' => true, 'sort_order' => 4],
            ['name' => '对比其他诊所', 'category' => '信任', 'description' => '多方对比后选择其他机构', 'is_active' => true, 'sort_order' => 5],
            ['name' => '服务体验差', 'category' => '服务', 'description' => '咨询/接待过程中体验不佳', 'is_active' => true, 'sort_order' => 6],
            ['name' => '沟通响应慢', 'category' => '服务', 'description' => '运营跟进不及时，客户流失', 'is_active' => true, 'sort_order' => 7],
            ['name' => '时间排期冲突', 'category' => '客观', 'description' => '客户时间/治疗周期无法匹配', 'is_active' => true, 'sort_order' => 8],
            ['name' => '距离/地理因素', 'category' => '客观', 'description' => '客户住得远，通勤不便', 'is_active' => true, 'sort_order' => 9],
            ['name' => '家人不同意', 'category' => '客观', 'description' => '决策人未达成一致', 'is_active' => true, 'sort_order' => 10],
            ['name' => '身体/健康原因', 'category' => '医疗', 'description' => '术前检查发现禁忌症或暂缓治疗', 'is_active' => true, 'sort_order' => 11],
            ['name' => '恐惧/犹豫', 'category' => '心理', 'description' => '对治疗过程恐惧，暂缓决策', 'is_active' => true, 'sort_order' => 12],
            ['name' => '号码无效/失联', 'category' => '无效线索', 'description' => '电话空号、微信不通过、长期失联', 'is_active' => true, 'sort_order' => 13],
            ['name' => '同行/刷单', 'category' => '无效线索', 'description' => '非真实客户，已核实为同行探价或测试', 'is_active' => true, 'sort_order' => 14],
            ['name' => '其他', 'category' => '其他', 'description' => '未在以上分类，请备注说明', 'is_active' => true, 'sort_order' => 99],
        ];

        foreach ($churnReasons as $cr) {
            ChurnReason::updateOrCreate(['name' => $cr['name']], $cr);
        }
    }
}
