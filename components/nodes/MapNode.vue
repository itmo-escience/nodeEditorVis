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
            <div class="map-container" :class="{hidden: node.data.preview}" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
                <div class="mapbox" ref="map"></div>
                <canvas class="deck-canvas" ref="canvas"></canvas>
            </div>
        </div>
    </div>
</template>
<script>
import VueRenderPlugin from 'rete-vue-render-plugin'

import { Deck } from "@deck.gl/core";
import mapboxgl from "mapbox-gl";
import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';
import { HeatmapLayer, HexagonLayer, GridLayer } from '@deck.gl/aggregation-layers';

import {scaleLinear, min, max} from "d3"

export default{
    mixins: [VueRenderPlugin.mixin],
    components:{ Socket: VueRenderPlugin.Socket },
    data(){
        return {
            deck: null,
            viewState: {
                latitude: 59.92,
                longitude: 30.29,
                zoom: 8,
                pitch: 0,
                bearing: 0
            },
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
        async addLayer(){
            const component = this.editor.components.get('Map');
            const inputs = this.inputs();
            const ins = this.inputs().map(input=>input.key).slice(1).concat(['layer'+this.inputs().length])
            const mapNode = await component.createNode( { inputs: ins, preview: this.node.data.preview, id: this.node.data.id, name: this.node.data.name } );

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
        strToRGBA(rgba){
            return rgba.replace(')','').split('(').slice(1)[0].split(',').map((d,i)=>i===3?+d*250:+d);
        },
        updateMap(){
            if(this.node.data.update){
                const layers = this.node.data.layers;
                if(layers){
                    const ls = [];
                    layers.forEach(l=>{
                        const getColor = d => this.strToRGBA(l.color || d.properties.color);
                        const getRadius = d => l.radius || d.properties.radius;
                        const getWidth = d => l.width || d.properties.width;
                        const getHeight = d => l.height || d.properties.height;
                        const getWeight = d => l.weight || d.properties.weight;

                        let layer;
                        switch(l.type){
                            case 'hexagon':
                                const settings = {
                                    data: l.data.features,
                                    getPosition: d => d.geometry.coordinates,
                                    extruded: l.extruded,
                                    elevationScale: 1,
                                    elevationRange: l.elevationRange,
                                    colorRange: l.colorRange.map(d=>this.strToRGBA(d)),
                                    getElevationWeight: d => d.properties.elevation || 1,
                                    getColorWeight: d => d.properties.color || 1 
                                };
                                layer = l.grid_type === 'hexagon' ? new HexagonLayer(settings) : new GridLayer(settings); 
                                break
                            case 'heatmap':
                                layer = new HeatmapLayer({
                                    data: l.data.features,
                                    getPosition: d => d.geometry.coordinates,
                                    getWeight: getWeight,
                                    radiusPixels: l.radius || 30,
                                    intensity: l.intensity || 1,
                                    threshold: l.threshold || .2,
                                    colorRange: l.colorRange ? l.colorRange.map(d=>this.strToRGBA(d)) : [[160, 160, 180, 250], [10, 100, 100, 250]]
                                });
                                break
                            case 'arc':
                                layer = new ArcLayer({
                                    data: l.data.features,
                                    getSourcePosition: d => d.geometry.coordinates[0],
                                    getTargetPosition: d => d.geometry.coordinates[ d.geometry.coordinates.length -1 ],
                                    getSourceColor: getColor,
                                    getTargetColor: getColor,
                                    getWidth: getWidth,
                                });
                                break
                            default:
                                layer = new GeoJsonLayer({
                                    data: l.data,
                                    pickable: true,
                                    stroked: false,
                                    filled: true,
                                    extruded: !!l.extruded,
                                    lineWidthScale: 20,
                                    lineWidthMinPixels: 2,
                                    getFillColor: getColor,
                                    getLineColor: getColor,
                                    getRadius: getRadius,
                                    getLineWidth: 1,
                                    getElevation: getHeight,
                                });
                        }
                        
                        ls.push(layer);
                    });
                    this.deck.setProps({ layers: ls });
                }
                this.node.data.update = false;
            } 

        }
    },
    mounted(){
        this.$nextTick(()=>{
            const map = new mapboxgl.Map({
                accessToken: 'pk.eyJ1Ijoia2FwYzNkIiwiYSI6ImNpbGpodG82czAwMmlubmtxamdsOHF0a3AifQ.xCbMUsy_a_0A9cd4GvjXKQ',
                container: this.$refs.map,
                interactive: false,
                style: 'mapbox://styles/mapbox/dark-v9',
                center: [this.viewState.longitude, this.viewState.latitude],
                zoom: this.viewState.zoom,
                pitch: this.viewState.pitch,
                bearing: this.viewState.bearing,
            });
            this.deck = new Deck({
                canvas: this.$refs.canvas,
                width: 500,
                height: 500,
                initialViewState: this.viewState,
                controller: true,
                onViewStateChange: ({ viewState }) => {
                    map.jumpTo({
                        center: [viewState.longitude, viewState.latitude],
                        zoom: viewState.zoom,
                        bearing: viewState.bearing,
                        pitch: viewState.pitch,
                    });
                }
            });

            this.node.data.update = true;
            this.updateMap();
        });

        this.editor.on('noderemove', node=>{
            if(node.id === this.node.id) this.freez = false;
        });
        this.editor.on('zoom nodetranslate', ()=> !this.freez );        
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
    .map-container {
        position: relative;
        width: 500px;
        height: 500px;
        margin: 15px;
    }
    .map-container.hidden{ 
        visibility: hidden;
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