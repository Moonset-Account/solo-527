<script lang="ts">
  import { getInitials } from '$lib/utils';

  export let name: string;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let className = '';

  const sizeClasses: Record<string, string> = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base'
  };
</script>

<div
  class={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-navy-500 to-navy-700 text-white font-medium ${sizeClasses[size]} ${className}`}
  title={name}
>
  {getInitials(name)}
</div>
