<template>
    <div class="node map-node" :class="[selected(), node.name] | kebab">
        <div class="d-flex align-center justify-center">
            <div class="title fg-9"><input type="textarea" v-model="name"/> ({{node.name}})</div>
            <div class="preview btn" :class="{ active: node.data.preview }" @click="preview">Preview</div>
        </div>
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
                <div class="add" @click="addLayer">Add</div>   
            </div>
            <div class="map-container" :class="{hidden: node.data.preview}" ref="map" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)"></div>
        </div>
    </div>
</template>
<script>
import VueRenderPlugin from 'rete-vue-render-plugin'

import { Scene } from '@antv/l7';
import { Mapbox } from '@antv/l7-maps';
import { PointLayer, LineLayer, PolygonLayer, HeatmapLayer } from '@antv/l7';

export default{
    mixins: [VueRenderPlugin.mixin],
    components:{ Socket: VueRenderPlugin.Socket },
    data(){
        return {
            scene: null,
            freez: false,
            name: this.node.data.name || (this.node.name + this.node.data.id)
        }
    },
    watch:{
        name(val){
            this.node.data.name = val;
            this.editor.trigger('process');
        }
    },
    methods: {
        preview(){
            this.node.data.preview = !this.node.data.preview,
            this.editor.trigger('process');
        },
        freezEditor(freez){
            this.freez = freez;
        },
        initScene(){
            const map = new Mapbox({
                style: 'dark',
                pitch: 3,
                center: [30.29, 59.92],
                zoom: 9,
            });
            this.scene = new Scene({
                id: this.$refs.map,
                map: map,
            });
        },
        async addLayer(){
            const component = this.editor.components.get('Map');
            const inputs = this.inputs();
            const mapNode = await component.createNode( { inputs: inputs, preview: this.node.data.preview, id: this.node.data.id, name: this.node.data.name } );
            mapNode.position = this.node.position;
            this.editor.addNode(mapNode);
            inputs.forEach((input, i)=>{
                const connection = input.connections[0];
                if(connection){
                    const output = connection.output;
                    this.editor.connect(output.node.outputs.get(output.key), mapNode.inputs.get( 'layer'+i ));
                }
            });
            this.editor.removeNode(this.node);
        },
        updateMap(){
            const options = { autoFit: true };
            if(this.node.data.update){
                const layers = this.node.data.layers;
                if(layers && this.scene){
                    this.scene.getLayers().forEach(layer=>{
                        this.scene.removeLayer(layer);
                    });
                    layers.forEach(l=>{
                        const layer = l.type === 'point' ? new PointLayer(options) : l.type === 'line' ? new LineLayer(options) : l.type === 'polygon' ? new PolygonLayer(options) : new HeatmapLayer(options);
                        layer.source(l.data, {...l.parse});
                        if(l.color) layer.color(...l.color);
                        if(l.shape) layer.shape(...l.shape);
                        if(l.size) layer.size(...l.size);
                        if(l.style) layer.style(...l.style);
                        this.scene.addLayer(layer)
                    });
                }
                this.node.data.update = false;
            }            
        }
    },
    mounted(){
        this.$nextTick(()=>{
            this.initScene();
            this.node.data.update = true;
            this.updateMap(); 
        });
        this.editor.on('zoom nodetranslate', ()=>{
            return !this.freez
        });
    },
    updated(){
        if(this.name.endsWith('undefined')) this.name = this.node.name + this.node.data.id;
        this.updateMap();
    }
}
</script>
<style>
    .preview.active{
        color:#e3c000;
        border-color: #e3c000 !important;
    }
    .node-body .map-container .l7-scene canvas{
        width: 500px !important;
        height: 500px !important;
    }
    .map-container {
        width: 500px;
        height: 500px;
        margin: 15px;
        position: relative;
    }
    .map-container.hidden{ 
        visibility: hidden;
        height: 50px;
    }

    .add{
        margin-left: 5px;
    }
    .add:after{
        content: url(~assets/plus.svg);
        position: relative;
        top: 5px; left: 5px;
    }
</style>