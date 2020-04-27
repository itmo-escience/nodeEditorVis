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
                width: 500,
                height: 500
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
                chart.position(`x*y`).shape(...data.shape);
                
                if(data.color) chart.color(...data.color);
                if(data.size) chart.size(...data.size);
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
    .input-title{
        position: relative;
        top: 7px;
    }
    .title{
        font-size: 20px;
        color: #fff;
        margin: 20px;
    }
    .node-body{
        text-align: left;
    }
    .chart-container{
        background: #d5d6d6;
        margin: 20px;
    }
</style>