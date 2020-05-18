<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <div class="title">{{node.name}}</div>
        <div class="d-flex space-between">
            <div class="">
                <div class="input d-flex align-center" v-for="input in inputs()" :key="input.key">
                    <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
                    <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
                    <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
                </div>
            </div>
            <div>
                <div class="output d-flex justify-end align-center" v-for="output in outputs()" :key="output.key">
                    <div class="output-title">{{output.name}}</div>
                    <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
                </div>
            </div>
        </div>
        <div class="control" v-for="control in controls()" :key="control.name" v-control="control"></div>
    </div>
</template>
<script>
    import VueRenderPlugin from 'rete-vue-render-plugin'
    export default{
        mixins: [VueRenderPlugin.mixin],
        components:{ Socket: VueRenderPlugin.Socket },
    }
</script>