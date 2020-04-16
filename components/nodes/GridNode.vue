<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <div class="title">{{node.name}}</div>
        <div class="d-flex">
            <div class="input d-flex fg-1" v-for="input in inputs()" :key="input.key">
                <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
                <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
                <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
            </div>
            <!-- Outputs-->
            <div class="output d-flex" v-for="output in outputs()" :key="output.key">
                <div class="fields-output-title">{{output.name}}</div>
                <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
            </div>
        </div>
        <div v-for="(control, i) in controls()" :key="i" class="d-flex control">
            <div class="fg-1 align-left mrr-20">{{ control.key }}</div>
            <div class="w-173 align-left" v-control="control"></div>
        </div>
    </div>
</template>
<script>
    import VueRenderPlugin from 'rete-vue-render-plugin'
    export default{
        mixins: [VueRenderPlugin.mixin],
        components:{ Socket: VueRenderPlugin.Socket },
        mounted(){
            console.log(this.controls())
        }
    }
</script>
<style>
    .node{
        background: rgba(110,136,255,0.8);
        border: 2px solid #4e58bf;
        min-width: 180px;
        height: auto;
    }
    .input-title{
        position: relative;
        top: 7px;
    }
    .fields-output-title{
        margin-left: auto;
        position: relative;
        top: 7px;
    }
    .d-flex{ display: flex; }
</style>