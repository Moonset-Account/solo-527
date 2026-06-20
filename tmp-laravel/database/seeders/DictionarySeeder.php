<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Dictionary;
use App\Models\DictionaryItem;

class DictionarySeeder extends Seeder
{
    public function run(): void
    {
        $dictionaries = [
            [
                'code' => 'art_types',
                'name' => '画种类型',
                'items' => ['素描', '色彩', '速写', '设计'],
            ],
            [
                'code' => 'class_levels',
                'name' => '班级级别',
                'items' => ['初级', '中级', '高级', '冲刺'],
            ],
            [
                'code' => 'feedback_types',
                'name' => '反馈类型',
                'items' => ['表扬', '关注', '建议'],
            ],
            [
                'code' => 'booking_sources',
                'name' => '预约来源',
                'items' => ['线上', '线下', '转介绍', '自然到访'],
            ],
            [
                'code' => 'strategy_types',
                'name' => '策略类型',
                'items' => ['优惠', '活动', '课程调整'],
            ],
        ];

        foreach ($dictionaries as $dictData) {
            $dictionary = Dictionary::firstOrCreate(
                ['code' => $dictData['code']],
                ['name' => $dictData['name']]
            );

            foreach ($dictData['items'] as $index => $itemName) {
                DictionaryItem::firstOrCreate(
                    [
                        'dictionary_id' => $dictionary->id,
                        'value' => $itemName,
                    ],
                    [
                        'label' => $itemName,
                        'sort_order' => $index,
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
