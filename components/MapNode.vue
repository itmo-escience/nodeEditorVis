<template>
    <div class="node map-node" :class="[selected(), node.name] | kebab">
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
            <div class="map-container" ref="map" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)"></div>
        </div>
    </div>
</template>
<script>
import VueRenderPlugin from 'rete-vue-render-plugin'

import { Scene, PointLayer } from '@antv/l7';
import { Mapbox } from '@antv/l7-maps';

export default{
    mixins: [VueRenderPlugin.mixin],
    components:{ Socket: VueRenderPlugin.Socket },
    data(){
        return {
            scene: null,
            freez: false
        }
    },
    methods: {
        freezEditor(freez){
            this.freez = freez;
        },
        initScene(){
            const map = new Mapbox({
                // container: this.$refs.map,
                style: 'dark',
                pitch: 3,
                center: [30.29, 59.92],
                zoom: 9,
            });
            this.scene = new Scene({
                id: this.$refs.map,
                map: map,
            });
        }
    },
    mounted(){
        setTimeout(()=>{ this.initScene() }, 250);
        this.editor.on('zoom nodetranslate', ()=>{
            return !this.freez
        });
    },
    updated(){
        const layers = this.node.data.layers;
        if(layers){
            // this.scene.getLayers().forEach(layer=>{
            //     this.scene.removeLayer(layer);
            // });
            layers.forEach(layer=>{
                this.scene.addLayer(layer);
            });
        }
    }
}
</script>
<style>
    .map-container {
        width: 500px;
        height: 500px;
        margin: 15px;
        position: relative;
    }
</style>