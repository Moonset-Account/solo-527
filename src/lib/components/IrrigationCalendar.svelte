<script lang="ts">
  import { filteredValves, filteredIrrigationEvents, greenhouses } from '$lib/stores/appStore';
  import { VALVE_STATUS_LABELS } from '$lib/data/dictionary';
  import { Droplets, Clock, Calendar, Zap } from 'lucide-svelte';
  import dayjs from 'dayjs';
  import { onMount } from 'svelte';

  let selectedDate = dayjs();
  let currentMonth = dayjs();

  function getGreenhouseName(ghId: string) {
    return $greenhouses.find((g) => g.id === ghId)?.name || ghId;
  }

  function getEventsForDate(date: dayjs.Dayjs) {
    const start = date.startOf('day').toISOString();
    const end = date.endOf('day').toISOString();
    return $filteredIrrigationEvents.filter((e) => {
      const t = new Date(e.startTime).getTime();
      return t >= new Date(start).getTime() && t <= new Date(end).getTime();
    });
  }

  function getTotalWaterForDate(date: dayjs.Dayjs) {
    return getEventsForDate(date).reduce((sum, e) => sum + e.waterVolume, 0);
  }

  function hasEvents(date: dayjs.Dayjs) {
    return getEventsForDate(date).length > 0;
  }

  function isToday(date: dayjs.Dayjs) {
    return date.isSame(dayjs(), 'day');
  }

  function isSelected(date: dayjs.Dayjs) {
    return date.isSame(selectedDate, 'day');
  }

  function isCurrentMonth(date: dayjs.Dayjs) {
    return date.isSame(currentMonth, 'month');
  }

  function generateCalendarDays() {
    const start = currentMonth.startOf('month').startOf('week');
    const end = currentMonth.endOf('month').endOf('week');
    const days = [];
    let current = start;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }

    return days;
  }

  $: calendarDays = generateCalendarDays();
  $: selectedEvents = getEventsForDate(selectedDate);
  $: selectedTotalWater = getTotalWaterForDate(selectedDate);
  $: openValves = $filteredValves.filter((v) => v.status === 'open');
  $: faultyValves = $filteredValves.filter((v) => v.status === 'fault');

  function prevMonth() {
    currentMonth = currentMonth.subtract(1, 'month');
  }

  function nextMonth() {
    currentMonth = currentMonth.add(1, 'month');
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
</script>

<div class="panel h-full flex flex-col">
  <div class="panel-header">
    <div class="flex items-center gap-2">
      <Calendar size={18} class="text-gh-info" />
      <span class="panel-title">灌溉日历</span>
    </div>
    <div class="flex items-center gap-1">
      <button class="p-1 hover:bg-gh-border rounded" onclick={prevMonth} aria-label="上一月">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="text-sm font-medium px-2">{currentMonth.format('YYYY年 MM月')}</span>
      <button class="p-1 hover:bg-gh-border rounded" onclick={nextMonth} aria-label="下一月">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-hidden flex flex-col">
    <div class="px-3 py-2 border-b border-gh-border/50 flex items-center justify-between">
      <div class="flex items-center gap-4 text-xs">
        <span class="flex items-center gap-1">
          <span class="status-online"></span>
          运行中 {openValves.length}
        </span>
        <span class="flex items-center gap-1">
          <span class="status-offline"></span>
          故障 {faultyValves.length}
        </span>
      </div>
      <div class="text-xs text-gh-muted">
        今日已灌溉: {getTotalWaterForDate(dayjs()).toFixed(0)}L
      </div>
    </div>

    <div class="flex-1 grid grid-cols-2 gap-3 p-3">
      <div class="bg-gh-bg/50 rounded border border-gh-border p-2">
        <div class="grid grid-cols-7 gap-1 text-xs mb-2">
          {#each weekDays as day}
            <div class="text-center text-gh-muted py-1">{day}</div>
          {/each}
        </div>
        <div class="grid grid-cols-7 gap-1">
          {#each calendarDays as day}
            <button
              class="aspect-square flex flex-col items-center justify-center text-xs rounded transition-colors hover:bg-gh-border/50"
              class:bg-gh-primary={isSelected(day)}
              class:text-white={isSelected(day)}
              class:text-gh-muted={!isCurrentMonth(day)}
              class:font-bold={isToday(day)}
              onclick={() => (selectedDate = day)}
            >
              <span>{day.format('D')}</span>
              {#if hasEvents(day)}
                <span class="w-1 h-1 rounded-full bg-gh-info mt-0.5"></span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="bg-gh-bg/50 rounded border border-gh-border p-3 overflow-auto">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium">{selectedDate.format('MM月DD日')} 灌溉事件</span>
          <span class="text-xs text-gh-info">{selectedTotalWater.toFixed(0)}L</span>
        </div>

        {#if selectedEvents.length > 0}
          <div class="space-y-2">
            {#each selectedEvents as event (event.id)}
              <div class="p-2 bg-gh-panel rounded border border-gh-border">
                <div class="flex items-center gap-2 mb-1">
                  <Clock size={12} class="text-gh-info" />
                  <span class="text-xs font-medium">
                    {dayjs(event.startTime).format('HH:mm')} - {dayjs(event.endTime).format('HH:mm')}
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs text-gh-muted">
                  <span>{$filteredValves.find((v) => v.id === event.valveId)?.name || event.valveId}</span>
                  <span>{event.waterVolume.toFixed(0)}L · {event.reason}</span>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center text-gh-muted text-xs py-8">
            当天无灌溉事件
          </div>
        {/if}
      </div>
    </div>

    <div class="px-3 py-2 border-t border-gh-border/50">
      <div class="text-xs text-gh-muted mb-2">阀门状态总览</div>
      <div class="grid grid-cols-4 gap-2">
        {#each $filteredValves.slice(0, 8) as valve}
          <div class="p-2 bg-gh-bg/50 rounded border border-gh-border text-center">
            <div class="text-xs font-medium truncate">{valve.name}</div>
            <div
              class={`text-xs mt-1 ${valve.status === 'open'
                ? 'text-gh-success'
                : valve.status === 'fault'
                  ? 'text-gh-danger'
                  : 'text-gh-muted'}`}
            >
              {VALVE_STATUS_LABELS[valve.status]}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
