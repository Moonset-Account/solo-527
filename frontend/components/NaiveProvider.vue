import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import { defineComponent, h, provide } from 'vue'

export default defineComponent({
  name: 'NaiveProvider',
  setup(_, { slots }) {
    return () =>
      h(NConfigProvider, null, {
        default: () =>
          h(NMessageProvider, null, {
            default: () =>
              h(NDialogProvider, null, {
                default: () => slots.default?.(),
              }),
          }),
      })
  },
})
