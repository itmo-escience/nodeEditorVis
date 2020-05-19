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
            context: null,
            canvas: null,
            transform: d3.zoomIdentity
        }
    },
    methods:{
        freezEditor(freez){
            this.freez = freez;
        },
        zoom(){
            this.transform = d3.event.transform;
            this.redraw();
        },
        drawLink(d) {
            this.context.moveTo(d.source.x, d.source.y);
            this.context.lineTo(d.target.x, d.target.y);
        },
        drawNode(d) {
            this.context.moveTo(d.x + 3, d.y);
            this.context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
        },
        redraw(){
            this.context.clearRect(0, 0, 500, 500);
            this.context.save();
            this.context.translate(this.transform.x, this.transform.y);
            this.context.scale(this.transform.k, this.transform.k);

            // this.context.beginPath();
            // this.links.forEach(this.drawLink);
            // this.context.strokeStyle = "#aaa";
            // this.context.stroke();

            this.context.beginPath();
            this.nodes.forEach(this.drawNode);
            this.context.fillStyle = '#e3c000';
            this.context.fill();

            this.context.restore();
        },
        updateGraph(){
            const data = this.node.data;
            this.nodes = data.GRAPH.nodes;
            this.links = data.GRAPH.links;

            this.simulation = d3.forceSimulation(this.nodes)
                .force('x', d3.forceX().x(d=>d.xpos).strength(d=>d.xstr))
                .force('y', d3.forceY().y(d=>d.ypos).strength(d=>d.ystr))
                .force('charge', d3.forceManyBody().strength(d=>d.cstr))
                .force('radial', d3.forceRadial(d=>d.rad, ...data.GRAPH.radialCenter).strength(d=>d.rstr));
                // .force("center", d3.forceCenter(250, 250));
                // .force("link", d3.forceLink(this.links).id(d => d.id))

            d3.select(this.canvas)
                .call(d3.drag().subject(this.dragsubject).on("start", this.dragstarted).on("drag", this.dragged).on("end", this.dragended))
                .call(d3.zoom().scaleExtent([1 / 10, 8])
                .on("zoom", this.zoom));
            
            this.simulation.on('tick', this.redraw);
        },
        getMousePosition() { 
            const rect = this.canvas.getBoundingClientRect();
            const event = d3.event.sourceEvent;
            let x = event.clientX - rect.left; 
            let y = event.clientY - rect.top; 
            return { x, y }
        },
        dragsubject() {
            const event = this.getMousePosition();
            const x = this.transform.invertX(event.x);
            const y = this.transform.invertY(event.y);
            for (let i=0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                const dx = x - node.x;
                const dy = y - node.y;
                if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
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
        // if(this.node.data.GRAPH){
        //     if(!this.nodes) this.updateGraph();
        // }else{
        //     this.nodes = null;
        //     this.links = null;
        // }
        if(this.node.data.GRAPH) this.updateGraph();
    },
    mounted(){
        this.canvas = this.$refs.container;
        this.context = this.canvas.getContext("2d");

        if(this.node.data.GRAPH) this.updateGraph();

        this.editor.on('noderemove', node=>{
            if(node.id === this.node.id) this.freez = false;
        });
        this.editor.on('zoom nodetranslate', ()=> !this.freez );
    }
}
</script>