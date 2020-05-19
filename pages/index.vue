<template>
  <div>
    <div id="save" :class="{'active': msg, 'red': errorMsg}">{{ msg }}</div>

    <div v-if="showMenu" class="context-menu" :style="{left: menu[0]+'px', top: menu[1]+'px'}">
      <input type="textarea" ref="search" class="search" v-model="searched"/>
      <div v-for="(component, index) in components" :key="index" class="context-menu-item" :class="{'has-children': component.children}" 
        @click="createNode(component)" @mouseover="openSideMenu(component, true)" @mouseout="openSideMenu(component, false)">
        <div v-if="component.children" class="context-menu child" :class="{hidden: hoveredComp != component.name}">
          <div v-for="child in component.children" :key="child.name" class="context-menu-item" @click="createNode(child)">{{ child.name }}</div>
        </div>
        {{ component.name }}
      </div>
    </div>

    <div id="load" class="d-flex">
      <div class="btn mrr-20 save cursor-pointer" @click="saveEditor"></div>
      <label for="upload" class="btn mrr-20 upload cursor-pointer"></label>
      <input id="upload" class="file-input" type="file" accept="application/json" @change="load($event)"/>
      <a class="btn mrr-20 download cursor-pointer" :href="href" :download="download"></a>
    </div>
    <div id='editor'></div>
    <div id='preview' :class="{hidden: preview.length === 0 }">
      <div class="d-flex">
        <div v-for="(p, index) in preview" :key="index" class="preview-item fg-1" :class="{selected: index === selectedId}" @click="select(index)">{{ p.name }}</div>
      </div>
      <div class="container-preview">
          <div class="mapbox" ref="map"></div>
          <canvas class="deck-canvas" ref="canvas"></canvas>
      </div> 
    </div>
    <div class="logo"></div>
  </div>
</template>
<script>
  import * as d3 from "d3";

  import { Deck } from "@deck.gl/core";
  import mapboxgl from "mapbox-gl";
  import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';
  import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';

  export default {
    data(){
      return {
        deck: null,
        viewState: {
            latitude: 59.92,
            longitude: 30.29,
            zoom: 9,
            pitch: 0,
            bearing: 0
        },
        selectedId: 0,
        href: '',
        download: 'export.json',
        state: this.$store.state,
        errorMsg: false,
        msg: null,
        showMenu: false,
        menu: [0,0],
        hoveredComp: null,
        searched: null,
        node: false
      }
    },
    computed: {
      preview(){
        return this.$store.state.preview
      },
      components(){
        const menu = [];
        const components = [...this.$store.state.editor.components.values()];
        
          components.forEach(comp=>{
            if(!comp.path) return
            if(!this.searched){
              if(!comp.path.length){
                menu.push({name: comp.name});
              }else{
                const item = menu.find(d=>d.name === comp.path[0]);
                if(item){
                  item.children.push({name: comp.name})
                }else{
                  menu.push({name: comp.path[0], children: [{name: comp.name}]})
                }
              }
            }else{
              if(comp.name.toLowerCase().includes( this.searched.toLowerCase() )) menu.push({ name: comp.name });
            }
          });

        return menu
      }
    },
    watch:{
      preview: {
        deep: true,
        handler(val){
          if(val.length) this.drawMap();
        }
      }
    },
    methods:{
      openSideMenu(component, open){
        if(component.children && open) this.hoveredComp = component.name;
        if(!open) this.hoveredComp = null;
      },
      async createNode(comp){
        if(!comp.children){
          const component = this.state.editor.components.get( comp.name );
          const node = await component.createNode();
          node.position = this.menu;
          this.state.editor.addNode(node);
          this.showMenu = false;
        }
      },
      load(e){
        let file = e.target.files[0];
        if(file){
          let fr = new FileReader();
          fr.readAsText(file);
          fr.onload = async ()=> {
              const data = JSON.parse(fr.result);

              await this.state.engine.abort();
              this.$store.commit('toggleProcess', false);

              const nodes = this.state.editor.nodes;
              const len = nodes.length;
              for(let i=0; i < len; i++){
                this.state.editor.removeNode(nodes[0]);
              }

              const NODES = Object.values(data.nodes);
            
              for(let i=0; i < NODES.length; i++){
                const node = NODES[i];
                const component = this.state.editor.components.get( node.name );
                const n = await component.createNode( node.data );
                n.id = node.id;
                n.position = node.position;
                this.state.editor.addNode(n);
              }

              for(let i=0; i < NODES.length; i++){
                const node = NODES[i];
                const node1 = this.state.editor.nodes.find(n=> n.id === node.id);
                Object.entries(node.inputs).forEach(([key, val])=>{
                  if(val.connections.length){
                    const conn = val.connections[0];
                    const node2 = this.state.editor.nodes.find(n=> n.id === conn.node);
                    this.state.editor.connect(node2.outputs.get( conn.output ), node1.inputs.get( key ));
                  }
                });
              }

              this.$store.commit('toggleProcess', true);
              this.state.editor.trigger('process');
          }
        }
      },
      select(index){
        this.selectedId = index;
        this.drawMap();
      },
      async saveEditor(noMsg){
        const json = await this.state.editor.toJSON();
        const data = JSON.stringify(json, null, ' ');
        const file = new Blob([data], {type: 'application/json'});
        this.href = URL.createObjectURL(file);
        
        if(!noMsg || noMsg instanceof MouseEvent)
          this.msg = 'Content saved!';
          setTimeout(()=>{ this.msg = null }, 1000);
      },
      drawMap(){
        const layers = this.$store.state.preview[this.selectedId].layers;
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
                        layer = new HexagonLayer({
                            data: l.data.features,
                            getPosition: d => d.geometry.coordinates,
                            extruded: true,
                            elevationScale: 5,
                            getElevationWeight: d => d.properties.elevation || 1,
                            getColorWeight: d => d.properties.color || 1 
                        });
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
      }
    },
    async mounted(){
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
              width: '100%',
              height: '100%',
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
      });

      this.$store.commit('initRete');
      this.state.data['graph'] = await d3.json('/data/graph.json');
      this.state.data['cars.csv'] = d3.csvParse(await this.$axios.$get('/data/cars.csv'));
      this.state.data['branches.json'] = await this.$axios.$get('/data/branches.json');
      const arcs = await this.$axios.$get('/data/arcs.json')
      this.state.data['arcs.json'] = arcs.map(d=>({
            id: d.id,
            clients_count: d.clients_count,
            x: d.source[0],
            y: d.source[1],
            x1: d.target[0],
            y1: d.target[1]
          }));
      this.state.editor.fromJSON({
          "id": "demo@0.1.0",
          "nodes": {
              "1": {
                  "id": 1,
                  "data": { options: ['', 'cars.csv', 'branches.json', 'arcs.json', 'graph'] },
                  "position": [80, 200],
                  "name": "Dataset"
              },
              "2": {
                  "id": 2,
                  "data": {},
                  "position": [500, 200],
                  "name": "Map"
              }
          }
      });
      this.saveEditor(true);

      document.addEventListener('keydown', async (e)=>{
        if(e.ctrlKey && e.key.toLocaleLowerCase() === 's' && this){
          e.preventDefault();
          this.saveEditor();
        }
      });
      this.state.editor.on('contextmenu',({ e, view, node })=>{
        e.preventDefault();
        if(node){
          this.node = true;
          return
        }
        if(this.node){
          this.node = false;
          return
        }
        if(!node){
          this.showMenu = true;
          this.menu = [e.clientX, e.clientY];
          this.searched = null;
          this.$nextTick(()=> this.$refs.search.focus() )
        }
      });
      this.state.editor.on('click',()=>{
        this.showMenu = false;
      });
    }
  }
</script>
<style>
  .download:after{
    content: url(~assets/download.svg);
  }
  .save:after{
    content: url(~assets/save.svg);
  }
  .upload:after{
    content: url(~assets/upload.svg);
  }
  #load{
    position: fixed;
    top: 0; left: 0;
    margin: 10px;
    z-index: 3;
  }
  #editor{
    position: fixed;
    left: 0; bottom: 0;
    width: 100%;
    height: 100% !important;
    z-index: 2;
    background: #292929;
  }
  #preview{
    position: fixed;
    right: 0; bottom: 0;
    z-index: 2;
    width: 900px;
    height: 100%;
  }
  .preview-item{
    border: 1px solid #d5d6d6;
    color: #d5d6d6;
    border-radius: 4px 4px 0 0;
    background: #353535;
    padding: 10px;
  }
  .preview-item.selected{
    border-color: #e3c000;
    color: #e3c000;
  }

  .container-preview{
    width: 100%;
    height: 100%;
    position: relative;
  }
  .map-preview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #e5e9ec;
      overflow: hidden;
  }
  .deck-preview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
  }

  #preview.hidden{ visibility: hidden; }
  .logo{
    position: fixed;
    left: 0; bottom: 0;
    z-index: 2;
  }
  .logo:after{
    content: url(~assets/logo.svg);
  }
  /*.context-menu{
    position: fixed;
    z-index: 3;
    background: #292929;
    padding: 10px;
    width: 120px;
  }*/
</style>