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
            <canvas ref="container" :width="size" :height="size"></canvas>
            <svg class="absolute r-0" :width="size" :height="size">
                <g ref="x" :transform="`translate(0, ${size-offset})`"></g>
                <g ref="y" :transform="`translate(${offset}, 0)`"></g>
            </svg>
        </div>
    </div>
</template>
<script>
import VueRenderPlugin from 'rete-vue-render-plugin'
import G2 from '@antv/g2';

import * as d3 from "d3";

export default{
    mixins: [VueRenderPlugin.mixin],
    components:{ Socket: VueRenderPlugin.Socket },
    data(){
        return{
            size: 500,
            offset: 30
        }
    },
    methods:{
        makeScale(values){
            const isNum = isNaN(+values[0]);
            return isNum ? 
                d3.scalePoint().domain( values ) :
                d3.scaleLinear().domain( d3.extent(values) );
        },
        updateChart(){
            if(this.node.data.DATA){
                const x = [...new Set( this.node.data.DATA.map( d=>d.x ) )].sort();
                const y = [...new Set( this.node.data.DATA.map( d=>d.y ) )].sort();
                const s = [...new Set( this.node.data.DATA.map( d=>d.size ) )].sort();
                
                const scale = {
                    x: this.makeScale(x).range([this.offset, this.size-this.offset]),
                    y: this.makeScale(y).range([this.size-this.offset, this.offset]),
                    size: d3.scaleSqrt().domain(d3.extent(s)).range([0, 30])
                };
                
                d3.select( this.$refs.y ).call( d3.axisLeft( scale.y ) );
                d3.select( this.$refs.x ).call( d3.axisBottom( scale.x ) );

                this.context.clearRect(0, 0, this.size, this.size);
                this.context.save();
                
                if(this.node.data.type === 'point'){
                    this.node.data.DATA.forEach(d=>{
                        const radius = scale.size(d.size) || 6;
                        const X = scale.x(d.x);
                        const Y = scale.y(d.y);
                        this.context.beginPath();
                        this.context.moveTo(X + radius, Y);
                        this.context.arc(X, Y, radius, 0, 2 * Math.PI);
                        this.context.fillStyle = d.color || '#e3c000';
                        this.context.fill();
                        this.context.strokeStyle = '#000';
                        this.context.stroke();
                    });
                }
                if(this.node.data.type === 'line'){
                    const lines = d3.nest().key(d=>d.index).entries(this.node.data.DATA);
                    lines.forEach(d=>{
                        this.context.beginPath();
                        const data = d.values.sort( (a,b)=>a.x-b.x );
                        this.context.moveTo( scale.x(data[0].x), scale.y(data[0].y) );
                        data.forEach((d)=>{
                            this.context.lineTo(scale.x(d.x), scale.y(d.y));
                        });
                        this.context.lineWidth = 3;
                        console.log(d.key, this.node.data.colors);
                        this.context.strokeStyle = this.node.data.colors[d.key];
                        this.context.stroke();
                    });
                }

                this.context.restore();

            }
            
        }
    },
    updated(){
        this.updateChart();
    },
    mounted() {
        this.context = this.$refs.container.getContext('2d');
        this.updateChart();
    }
}
</script>