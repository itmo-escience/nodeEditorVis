<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <div class="title">{{node.name}}</div>
        <!-- Inputs-->
        <div class="node-body d-flex">
            <div class="inputs">
                <div class="control" v-for="(control, id) in controls()" v-control="control" :key="id"></div>
                <div class="input" v-for="input in inputs()" :key="input.key">
                    <div class="d-flex">
                        <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
                        <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
                        <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
                    </div>
                </div>
            </div>
            <div ref="container" class="chart-container"></div>
        </div>
    </div>
</template>
<script>
import VueRenderPlugin from 'rete-vue-render-plugin'
import G2 from '@antv/g2';

export default{
    mixins: [VueRenderPlugin.mixin],
    components:{ Socket: VueRenderPlugin.Socket },
    data(){
        return{
            chart: null
        }
    },
    methods:{
        updateChart(){
            const data = this.node.data;
            if(this.chart){
                this.chart.destroy()
                this.chart = null;
            };

            this.chart = new G2.Chart({
                container: this.$refs.container,
                width: 500, // data.width,
                height: 500 //data.height
            });
            if(data.DATA){
                this.chart.source(data.DATA);
                let chart;
                switch(data.type){
                    case 'area':
                        chart = this.chart.area();
                        break
                    case 'line':
                        chart = this.chart.line();
                        break
                    default:
                        chart = this.chart.point();
                        break
                }
                chart.position(`x*y`).shape(data.shape);
                
                if(data.color){
                    chart.color(data.color);
                }
            }

            this.chart.render();
        }
    },
    updated(){
        this.updateChart();
    },
    mounted() {
        this.updateChart();
    }
}
</script>
<style>
    .node{
        background: rgba(110,136,255,0.8);
        border: 2px solid #4e58bf;
        border-radius: 10px;
        min-width: 180px;
        height: auto;
        text-align: center;
    }
    .input-title{
        position: relative;
        top: 7px;
    }
    .title{
        font-size: 20px;
        color: #fff;
        margin: 20px;
    }
    .d-flex{
        display: flex;
    }
    .node-body{
        text-align: left;
    }
    .chart-container{
        background: #fff;
        margin: 20px;
    }
</style>