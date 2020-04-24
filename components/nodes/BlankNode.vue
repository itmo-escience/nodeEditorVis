<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <div v-for="(control, i) in controls()" :key="i" v-control="control"></div>
    </div>
</template>
<script>
    import VueRenderPlugin from 'rete-vue-render-plugin'
    export default{
        mixins: [VueRenderPlugin.mixin],
        components:{ Socket: VueRenderPlugin.Socket },
    }
</script>