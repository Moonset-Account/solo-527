'use client';

import { useState } from 'react';
import { PLATFORM_LABELS, PLATFORM_METRICS } from '@/lib/types';

export default function MetricsInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        指标口径
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
            <h4 className="font-semibold text-gray-800 mb-3">平台指标口径说明</h4>
            <p className="text-xs text-gray-500 mb-4">
              不同平台的指标定义存在差异，数据对比时请注意区分，不可直接跨平台求和。
            </p>
            <div className="space-y-3">
              {Object.entries(PLATFORM_LABELS).map(([platform, label]) => {
                const metrics = PLATFORM_METRICS[platform as keyof typeof PLATFORM_METRICS];
                return (
                  <div key={platform} className="text-sm">
                    <div className="font-medium text-gray-700">{label}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      核心指标: <span className="text-gray-700">{metrics.primary === 'reads' ? '阅读量' : '播放量'}</span>
                      {metrics.secondary && (
                        <span className="ml-2">
                          参考指标: <span className="text-gray-700">{metrics.secondary === 'reads' ? '阅读量' : metrics.secondary === 'plays' ? '完播量' : '浏览量'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                <strong>注意：</strong>互动率 = (点赞 + 转发 + 评论) / 曝光量 × 100%
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
