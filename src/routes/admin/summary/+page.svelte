<script lang="ts">
  import { Send, RefreshCw, Mail, MessageSquare, Calendar, FileText, Clock, CheckCircle, XCircle } from 'lucide-svelte';
  import { getLatestSummary, getPushRecords } from '$server/services/summary';
  import type { DailySummary, PushRecord } from '$types';
  import { formatDate, statusLabel, channelLabel } from '$utils';

  export let data: {
    summary: DailySummary | undefined;
    pushRecords: PushRecord[];
  };

  let isEditing = false;
  let editedContent = '';
  let generating = false;

  $: summary = data.summary;
  
  function startEdit() {
    if (summary) {
      editedContent = summary.content;
      isEditing = true;
    }
  }

  async function handleGenerate() {
    generating = true;
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
      });
      if (res.ok) {
        const newSummary = await res.json();
        data.summary = newSummary;
      }
    } catch (e) {
      console.error('Generate failed:', e);
    } finally {
      generating = false;
    }
  }

  async function handlePush(channel: string) {
    if (!summary) return;
    
    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: summary.id,
          channel,
          recipients: ['zhangsan@example.com', 'lisi@example.com']
        })
      });
      if (res.ok) {
        const record = await res.json();
        data.pushRecords.unshift(record);
      }
    } catch (e) {
      console.error('Push failed:', e);
    }
  }
</script>

<svelte:head>
  <title>摘要推送 - 后台管理</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">摘要推送</h1>
      <p class="mt-1 text-sm text-slate-500">生成日报摘要并配置推送渠道</p>
    </div>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4 text-slate-500" />
        <input type="date" class="input w-40" value={summary?.date} />
      </div>
      <button 
        class="btn-secondary"
        on:click={handleGenerate}
        disabled={generating}
      >
        <span class="mr-1.5 inline-flex" class:animate-spin={generating}>
          <RefreshCw class="w-4 h-4" />
        </span>
        生成摘要
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-slate-900 flex items-center gap-2">
            <FileText class="w-5 h-5 text-primary-500" />
            日报摘要
          </h3>
          <div class="flex items-center gap-2">
            {#if summary}
              <span class={`badge ${summary.status === 'published' ? 'badge-success' : 'badge-slate'}`}>
                {summary.status === 'published' ? '已发布' : '草稿'}
              </span>
              {#if isEditing}
                <button class="text-sm text-primary-600 hover:text-primary-700">保存</button>
                <button class="text-sm text-slate-500 hover:text-slate-700" on:click={() => isEditing = false}>取消</button>
              {:else}
                <button class="text-sm text-primary-600 hover:text-primary-700" on:click={startEdit}>编辑</button>
              {/if}
            {/if}
          </div>
        </div>

        {#if summary}
          <div class="space-y-4">
            {#if isEditing}
              <textarea 
                bind:value={editedContent}
                class="input w-full min-h-48 resize-none"
              ></textarea>
            {:else}
              <p class="text-slate-700 leading-relaxed whitespace-pre-line">{summary.content}</p>
            {/if}

            {#if summary.highlights && summary.highlights.length > 0}
              <div class="pt-4 border-t border-slate-100">
                <p class="text-sm font-medium text-accent-700 mb-2">亮点</p>
                <ul class="space-y-1">
                  {#each summary.highlights as highlight}
                    <li class="text-sm text-slate-600 flex items-start gap-2">
                      <span class="text-accent-500 mt-1">•</span>
                      {highlight}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if summary.lows && summary.lows.length > 0}
              <div class="pt-4 border-t border-slate-100">
                <p class="text-sm font-medium text-danger-700 mb-2">关注点</p>
                <ul class="space-y-1">
                  {#each summary.lows as low}
                    <li class="text-sm text-slate-600 flex items-start gap-2">
                      <span class="text-danger-500 mt-1">•</span>
                      {low}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>生成时间：{formatDate(summary.generatedAt, 'yyyy-MM-dd HH:mm')}</span>
              <span>生成方式：{summary.generatedBy === 'system' ? '自动生成' : summary.generatedBy}</span>
            </div>
          </div>
        {:else}
          <div class="text-center py-12">
            <FileText class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-slate-500">今日暂无摘要</p>
            <button class="btn-primary mt-4" on:click={handleGenerate}>
              <RefreshCw class="w-4 h-4 mr-1.5" />
              生成今日摘要
            </button>
          </div>
        {/if}
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Send class="w-5 h-5 text-primary-500" />
          推送记录
        </h3>

        <div class="space-y-3">
          {#each data.pushRecords as record}
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-white rounded-lg">
                  {#if record.channel === 'email'}
                    <Mail class="w-5 h-5 text-primary-500" />
                  {:else}
                    <MessageSquare class="w-5 h-5 text-accent-500" />
                  {/if}
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-900">{channelLabel(record.channel)}</p>
                  <p class="text-xs text-slate-500">
                    {record.recipients.slice(0, 2).join('、')}
                    {#if record.recipients.length > 2} 等 {record.recipients.length} 人{/if}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span 
                  class="flex items-center gap-1 text-xs"
                  class:text-accent-600={record.status === 'sent'}
                  class:text-danger-600={record.status === 'failed'}
                  class:text-slate-500={record.status === 'pending'}
                >
                  {#if record.status === 'sent'}
                    <CheckCircle class="w-4 h-4" />
                  {:else if record.status === 'failed'}
                    <XCircle class="w-4 h-4" />
                  {:else}
                    <Clock class="w-4 h-4" />
                  {/if}
                  {statusLabel(record.status)}
                </span>
                {#if record.sentAt}
                  <span class="text-xs text-slate-400">{formatDate(record.sentAt, 'HH:mm')}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="card p-5">
        <h3 class="font-semibold text-slate-900 mb-4">推送渠道</h3>
        
        <div class="space-y-3">
          <button 
            class="w-full p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left flex items-center gap-3"
            on:click={() => handlePush('email')}
          >
            <div class="p-2 bg-primary-100 rounded-lg">
              <Mail class="w-5 h-5 text-primary-600" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-900">邮件推送</p>
              <p class="text-xs text-slate-500">发送到指定邮箱</p>
            </div>
            <Send class="w-4 h-4 text-slate-400" />
          </button>

          <button 
            class="w-full p-4 border border-slate-200 rounded-lg hover:border-accent-300 hover:bg-accent-50/50 transition-all text-left flex items-center gap-3"
            on:click={() => handlePush('wework')}
          >
            <div class="p-2 bg-accent-100 rounded-lg">
              <MessageSquare class="w-5 h-5 text-accent-600" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-900">企业微信</p>
              <p class="text-xs text-slate-500">推送到企业微信群</p>
            </div>
            <Send class="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-slate-900 mb-4">推送配置</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-sm text-slate-600 mb-1 block">推送时间</label>
            <input type="time" class="input" value="09:00" />
          </div>
          <div>
            <label class="text-sm text-slate-600 mb-1 block">接收人</label>
            <textarea 
              class="input min-h-20 resize-none text-sm"
              placeholder="邮箱地址，多个用逗号分隔"
            >zhangsan@example.com, lisi@example.com</textarea>
          </div>
          <button class="w-full btn-primary">
            保存配置
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
