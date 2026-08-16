<template>
  <div ref="container" class="chart-root" />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use, type ECharts, type EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{ option: EChartsCoreOption }>()
const container = ref<HTMLElement>()
let chart: ECharts | undefined
let resizeObserver: ResizeObserver | undefined

onMounted(async () => {
  await nextTick()
  if (!container.value) return
  chart = init(container.value)
  chart.setOption(props.option)
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(container.value)
})

watch(
  () => props.option,
  (option) => chart?.setOption(option, { notMerge: true }),
  { deep: true },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.chart-root {
  width: 100%;
  height: 100%;
  min-width: 0;
}
</style>
