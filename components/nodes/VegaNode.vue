<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <div class="title">{{node.name}}</div>
        <!-- Inputs-->
        <div class="node-body d-flex">
            <div class="inputs">
                <div class="control" v-for="(control, id) in controls()" v-control="control" :key="id"></div>
                <div class="input d-flex align-center" v-for="input in inputs()" :key="input.key">
                    <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
                    <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
                    <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
                </div>
            </div>
            <div ref="container"></div>
        </div>
    </div>
</template>
<script>
import VueRenderPlugin from 'rete-vue-render-plugin'

import * as d3 from "d3";
import * as vega from "vega";

export default{
    mixins: [VueRenderPlugin.mixin],
    components:{ Socket: VueRenderPlugin.Socket },
    methods: {
        draw(){
            const spec = vega.parse( this.node.data.spec );
            const view = new vega.View(spec,
            {
                renderer:  'canvas',
                container: this.$refs.container
            });
            view.runAsync();
        }
    },
    updated() { this.draw(); },
    mounted() { this.draw(); }
}
</script>