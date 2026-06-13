import { create, NButton, NInput, NCard, NLayout, NLayoutHeader, NLayoutSider,
  NLayoutContent, NMenu, NDataTable, NForm, NFormItem, NSelect, NDatePicker,
  NTag, NModal, NMessageProvider, NDialogProvider, NSpin, NEmpty, NDescriptions,
  NDescriptionsItem, NTabs, NTabPane, NUpload, NUploadDragger, NIcon, NText,
  NPagination, NDrawer, NDrawerContent, NDivider, NBadge, NPopconfirm,
  NDropdown, NAvatar, NSpace, NGrid, NGridItem, NStatistic, NProgress,
  NTooltip, NAlert, NResult, NPageHeader, NBreadcrumb, NBreadcrumbItem,
  NList, NListItem, NThing, NTimeline, NTimelineItem, NRate, NSlider,
  NInputNumber, NCheckbox, NRadio, NRadioGroup, NSwitch, NTree
} from 'naive-ui'
import { defineNuxtPlugin } from '#app'

const naive = create({
  components: [
    NButton, NInput, NCard, NLayout, NLayoutHeader, NLayoutSider,
    NLayoutContent, NMenu, NDataTable, NForm, NFormItem, NSelect, NDatePicker,
    NTag, NModal, NMessageProvider, NDialogProvider, NSpin, NEmpty, NDescriptions,
    NDescriptionsItem, NTabs, NTabPane, NUpload, NUploadDragger, NIcon, NText,
    NPagination, NDrawer, NDrawerContent, NDivider, NBadge, NPopconfirm,
    NDropdown, NAvatar, NSpace, NGrid, NGridItem, NStatistic, NProgress,
    NTooltip, NAlert, NResult, NPageHeader, NBreadcrumb, NBreadcrumbItem,
    NList, NListItem, NThing, NTimeline, NTimelineItem, NRate, NSlider,
    NInputNumber, NCheckbox, NRadio, NRadioGroup, NSwitch, NTree
  ]
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(naive)
})
