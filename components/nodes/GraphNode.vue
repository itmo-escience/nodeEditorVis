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
            <canvas ref="container" width="500" height="500" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)"></canvas>
            <!-- <svg ref="container" width="500" height="500">
                <line v-for="(l, i) in links" :key="i" stroke="#999" stroke-width="2" :x1="l.source.x" :y1="l.source.y" :x2="l.target.x" :y2="l.target.y"></line>
                <circle v-for="n in nodes" :key="n.id" fill="#000" r="5" :cx="n.x" :cy="n.y"></circle>
            </svg> -->
        </div>
    </div>
</template>
<script>
import VueRenderPlugin from 'rete-vue-render-plugin'
import * as d3 from "d3";

export default{
    mixins: [VueRenderPlugin.mixin],
    components:{ Socket: VueRenderPlugin.Socket },
    data(){
        return{
            freez: false,
            nodes: null,
            links: null,
            simulation: null,
            transform: d3.zoomIdentity
        }
    },
    methods:{
        freezEditor(freez){
            this.freez = freez;
        },
        zoom(){
            this.transform = d3.event.transform;
            this.updateGraph();
        },
        drawLink(d) {
            this.context.moveTo(d.source.x, d.source.y);
            this.context.lineTo(d.target.x, d.target.y);
        },
        drawNode(d) {
            this.context.moveTo(d.x + 3, d.y);
            this.context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
        },
        updateGraph(){
            const data = this.node.data;
            if(data.DATA){
                this.nodes = data.DATA.nodes;
                this.links = data.DATA.links;
                this.simulation = d3.forceSimulation(this.nodes)
                    .force("link", d3.forceLink(this.links).id(d => d.id))
                    .force("charge", d3.forceManyBody())
                    .force("center", d3.forceCenter(250, 250));

                this.simulation.on('tick', ()=>{
                    this.context.clearRect(0, 0, 500, 500);
                    this.context.save();
                    this.context.translate(this.transform.x, this.transform.y);
                    this.context.scale(this.transform.k, this.transform.k);

                    this.context.beginPath();
                    this.links.forEach(this.drawLink);
                    this.context.strokeStyle = "#aaa";
                    this.context.stroke();

                    this.context.beginPath();
                    this.nodes.forEach(this.drawNode);
                    this.context.fillStyle = '#e3c000';
                    this.context.fill();

                    this.context.restore();
                });
            }
        },
        dragsubject() {
            const x = this.transform.invertX(d3.event.x);
            const y = this.transform.invertY(d3.event.y);
            for (let i=0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                const dx = x - node.x;
                const dy = y - node.y;

                if (dx * dx + dy * dy < 3 * 3) {
                    node.x =  this.transform.applyX(node.x);
                    node.y = this.transform.applyY(node.y);
                    return node;
                }
            }
        },
        dragstarted() {
            if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
            d3.event.subject.fx = this.transform.invertX(d3.event.x);
            d3.event.subject.fy = this.transform.invertY(d3.event.y);
        },
        dragged() {
            d3.event.subject.fx = this.transform.invertX(d3.event.x);
            d3.event.subject.fy = this.transform.invertY(d3.event.y);
        },
        dragended() {
            if (!d3.event.active) this.simulation.alphaTarget(0);
            d3.event.subject.fx = null;
            d3.event.subject.fy = null;
        }
    },
    updated(){
        this.updateGraph();
    },
    mounted(){
        this.context = this.$refs.container.getContext("2d");
        this.updateGraph();

        d3.select(this.$refs.container)
            // .call(d3.drag().subject(this.dragsubject).on("start", this.dragstarted).on("drag", this.dragged).on("end", this.dragended))
            .call(d3.zoom().scaleExtent([1 / 10, 8])
            .on("zoom", this.zoom));

        this.editor.on('noderemove', node=>{
            if(node.id === this.node.id) this.freez = false;
        });
        this.editor.on('zoom nodetranslate', ()=> !this.freez );
    }
}
</script>