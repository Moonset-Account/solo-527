<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                ] : null,
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'leadStatuses' => [
                ['value' => 'new', 'label' => '新线索'],
                ['value' => 'contacted', 'label' => '已联系'],
                ['value' => 'consulting', 'label' => '咨询中'],
                ['value' => 'quoted', 'label' => '已报价'],
                ['value' => 'contract_pending', 'label' => '合同待确认'],
                ['value' => 'signed', 'label' => '已签约'],
                ['value' => 'treatment', 'label' => '治疗中'],
                ['value' => 'completed', 'label' => '已完成'],
                ['value' => 'lost', 'label' => '已流失'],
                ['value' => 'ocean', 'label' => '公海'],
            ],
            'leadSources' => [
                ['value' => 'douyin', 'label' => '抖音'],
                ['value' => 'xiaohongshu', 'label' => '小红书'],
                ['value' => 'wechat', 'label' => '微信朋友圈'],
                ['value' => 'baidu', 'label' => '百度推广'],
                ['value' => 'meituan', 'label' => '美团'],
                ['value' => 'recommend', 'label' => '老客转介绍'],
                ['value' => 'offline', 'label' => '线下到店'],
                ['value' => 'other', 'label' => '其他'],
            ],
            'leadQualities' => [
                ['value' => 'A', 'label' => 'A级 - 高意向'],
                ['value' => 'B', 'label' => 'B级 - 中意向'],
                ['value' => 'C', 'label' => 'C级 - 低意向'],
                ['value' => 'D', 'label' => 'D级 - 无效'],
            ],
            'responseNodeTypes' => [
                ['value' => 'first_contact', 'label' => '首次联系'],
                ['value' => 'consultation', 'label' => '咨询沟通'],
                ['value' => 'quote_sent', 'label' => '发送报价'],
                ['value' => 'follow_up', 'label' => '后续跟进'],
                ['value' => 'contract_sent', 'label' => '发送合同'],
                ['value' => 'contract_signed', 'label' => '合同签署'],
                ['value' => 'treatment_arranged', 'label' => '安排治疗'],
                ['value' => 'lost', 'label' => '确认流失'],
            ],
        ]);
    }
}
