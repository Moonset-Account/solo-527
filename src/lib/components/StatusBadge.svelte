<script lang="ts">
  export let label: string;
  export let value: string;
  export let variant:
    | 'default'
    | 'material'
    | 'subscription'
    | 'invoice'
    | 'priority'
    | 'todo'
    | 'exception'
    | 'order'
    | 'delivery'
    | 'alert' = 'default';

  const variantMap: Record<string, string> = {
    default: 'bg-navy-100 text-navy-700',
    material: '',
    subscription: '',
    invoice: '',
    priority: '',
    todo: '',
    exception: '',
    order: '',
    delivery: '',
    alert: ''
  };

  import {
    materialAuthClass,
    subscriptionStatusClass,
    invoiceCycleClass,
    priorityClass,
    todoStatusClass,
    exceptionStatusClass,
    orderStatusClass,
    deliveryStatusClass,
    alertStatusClass
  } from '$lib/utils';

  const dynamicClass = (v: string, val: string): string => {
    switch (v) {
      case 'material':
        return materialAuthClass[val] || variantMap.default;
      case 'subscription':
        return subscriptionStatusClass[val] || variantMap.default;
      case 'invoice':
        return invoiceCycleClass[val] || variantMap.default;
      case 'priority':
        return priorityClass[val] || variantMap.default;
      case 'todo':
        return todoStatusClass[val] || variantMap.default;
      case 'exception':
        return exceptionStatusClass[val] || variantMap.default;
      case 'order':
        return orderStatusClass[val] || variantMap.default;
      case 'delivery':
        return deliveryStatusClass[val] || variantMap.default;
      case 'alert':
        return alertStatusClass[val] || variantMap.default;
      default:
        return variantMap.default;
    }
  };

  $: cls = dynamicClass(variant, value);
</script>

<span class="badge {cls}" title={label}>
  {label}
</span>
