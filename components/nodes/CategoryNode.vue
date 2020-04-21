<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <!--- hide title <div class="title">{{node.name}}</div> -->
        <div class="input d-flex" v-for="input in inputs()" :key="input.key">
            <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
            <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
            <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
        </div>
        <!-- Outputs-->
        <div class="output d-flex" v-for="output in outputs()" :key="output.key">
            <div class="fields-output-title">{{output.name}}</div>
            <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
        </div>

        <div v-if="node.data.values" class="d-flex mrr-20 mrl-20">
            <div class="values">
                <div class="value" v-for="(value, i) in node.data.values" v-if="opened || i < 10" :key="i">
                    {{ value ? (value.length > 15 ? value.toString().slice(0,15)+'...' : value.toString().slice(0,15)) : 'Null'  }}
                </div>
            </div>
            <div>
                <div class="color-control" v-for="(control, i) in controls()" v-if="opened || i < 10" v-control="control" :key="i"></div>
            </div>
        </div>
        <div v-if="node.data.values && node.data.values.length > 10" class="arrow" @click="toggle" :class="{up: opened, down: !opened}"></div>
    </div>
</template>
<script>
    import VueRenderPlugin from 'rete-vue-render-plugin'
    export default{
        mixins: [VueRenderPlugin.mixin],
        components:{ Socket: VueRenderPlugin.Socket },
        data(){ return { opened: true } },
        methods: {
            toggle(){
                this.opened = !this.opened;
            }
        }
    }
</script>
<style>
    .arrow.up:after{ content: url(~assets/arrow-up.svg); }
    .arrow.down:after{ content: url(~assets/arrow-down.svg); }
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
    .d-flex{
        display: flex;
    }
    .values{
        max-width: 150px;
        text-align: left;
    }
    .value{
        height: 20px;
    }
    .color-control{
        margin-left: 20px;
        height: 20px;
    }
</style>