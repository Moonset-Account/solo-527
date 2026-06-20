<script lang="ts">
  import { cn } from '$utils/format';

  let {
    label,
    name,
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    error = '',
    required = false,
    disabled = false,
    options = [],
    helpText = ''
  } = $props<{
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    value?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    options?: { value: string; label: string }[];
    helpText?: string;
  }>();
</script>

<div class="space-y-1.5">
  <label for={name} class="block text-sm font-medium text-gray-700">
    {label}
    {#if required}
      <span class="text-danger-500 ml-0.5">*</span>
    {/if}
  </label>

  {#if type === 'textarea'}
    <textarea
      {name}
      {placeholder}
      {disabled}
      bind:value
      rows={4}
      class={cn(
        'w-full px-3 py-2 text-sm border rounded-lg transition-colors resize-none',
        'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none',
        error ? 'border-danger-300 bg-danger-50' : 'border-gray-300',
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
      )}
    ></textarea>
  {:else if type === 'select'}
    <select
      {name}
      {disabled}
      bind:value
      class={cn(
        'w-full px-3 py-2 text-sm border rounded-lg transition-colors appearance-none bg-white',
        'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none',
        error ? 'border-danger-300 bg-danger-50' : 'border-gray-300',
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
      )}
    >
      <option value="" disabled>{placeholder || '请选择'}</option>
      {#each options as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  {:else}
    <input
      {name}
      {type}
      {placeholder}
      {disabled}
      bind:value
      class={cn(
        'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
        'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none',
        error ? 'border-danger-300 bg-danger-50' : 'border-gray-300',
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
      )}
    />
  {/if}

  {#if helpText && !error}
    <p class="text-xs text-gray-500">{helpText}</p>
  {/if}
  {#if error}
    <p class="text-xs text-danger-600">{error}</p>
  {/if}
</div>
