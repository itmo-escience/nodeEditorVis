<template>
    <LineChart
      :data='data.slice(size)'
    />
</template>
<script>
    import createG2 from 'g2-vue'

    const LineChart = createG2(chart => {
        chart.line().position('time*pm25').color('pm25').shape('spline').size(2)
        chart.render()
    })

    export default {
        props: ['size', 'data'],
        components: {
            LineChart
        }
    }
</script>