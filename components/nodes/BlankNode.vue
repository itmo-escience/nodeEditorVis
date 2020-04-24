<template>
    <div class="node" :class="[selected(), node.name] | kebab">

        <div class="d-flex space-between">
            <div>
                <div class="input d-flex" v-for="input in inputs()" :key="input.key">
                    <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
                    <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
                    <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
                </div>
            </div>
            <!-- Outputs-->
            <div>
                <div class="output d-flex" v-for="output in outputs()" :key="output.key">
                    <div class="fields-output-title">{{output.name}}</div>
                    <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
                </div>
            </div>
        </div>
    
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