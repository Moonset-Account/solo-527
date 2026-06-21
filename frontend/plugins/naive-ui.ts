import { defineNuxtPlugin } from '#app'
import { setup } from '@css-render/vue3-ssr'
import {
  create,
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NDialogProvider,
  NMessageProvider,
  NModal,
  NSpace,
  NTag,
  NPageHeader,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutSider,
  NMenu,
  NDropdown,
  NAvatar,
  NIcon,
  NGrid,
  NGridItem,
  NStatistic,
  NProgress,
  NTable,
  NPagination,
  NPopconfirm,
  NDrawer,
  NDrawerContent,
  NDescriptions,
  NDescriptionsItem,
  NText,
  NH1,
  NH2,
  NH3,
  NDivider,
  NUpload,
  NUploadDragger,
  NSpin,
  NEmpty,
  NAlert,
  NBadge,
  NCascader,
  NCheckbox,
  NColorPicker,
  NTimePicker,
  NSwitch,
  NSlider,
  NRate,
  NTransfer,
  NTree,
  NTabs,
  NTabPane,
  NList,
  NListItem,
  NScrollbar,
  NSteps,
  NStep,
  NTimeline,
  NTimelineItem,
  NCalendar,
  NCarousel,
  NCollapse,
  NCollapseItem
} from 'naive-ui'

const naive = create({
  components: [
    NButton,
    NCard,
    NDataTable,
    NForm,
    NFormItem,
    NInput,
    NInputNumber,
    NSelect,
    NDatePicker,
    NDialogProvider,
    NMessageProvider,
    NModal,
    NSpace,
    NTag,
    NPageHeader,
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NLayoutSider,
    NMenu,
    NDropdown,
    NAvatar,
    NIcon,
    NGrid,
    NGridItem,
    NStatistic,
    NProgress,
    NTable,
    NPagination,
    NPopconfirm,
    NDrawer,
    NDrawerContent,
    NDescriptions,
    NDescriptionsItem,
    NText,
    NH1,
    NH2,
    NH3,
    NDivider,
    NUpload,
    NUploadDragger,
    NSpin,
    NEmpty,
    NAlert,
    NBadge,
    NCascader,
    NCheckbox,
    NColorPicker,
    NTimePicker,
    NSwitch,
    NSlider,
    NRate,
    NTransfer,
    NTree,
    NTabs,
    NTabPane,
    NList,
    NListItem,
    NScrollbar,
    NSteps,
    NStep,
    NTimeline,
    NTimelineItem,
    NCalendar,
    NCarousel,
    NCollapse,
    NCollapseItem
  ]
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(naive)

  if (process.server) {
    const { collect } = setup(nuxtApp.vueApp)
    const originalRenderMeta = nuxtApp.ssrContext?.renderMeta
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.renderMeta = () => {
        if (!originalRenderMeta) {
          return {
            headTags: collect()
          }
        }
        const originalMeta = originalRenderMeta()
        return {
          ...originalMeta,
          headTags: [originalMeta.headTags, collect()].join('\n')
        }
      }
    }
  }
})
