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

  import Rete from 'rete'
  import ConnectionPlugin from 'rete-connection-plugin';
  import VueRenderPlugin from 'rete-vue-render-plugin';

  import {
      MultiplyComponent, ColorComponent,
      ColorCategoryComponent, ColorRangeComponent,
      ParseComponent, DatasetComponent,
      //LoadDataComponent, URLDataComponent,
      RangeComponent, SizeComponent,
      PointLayerComponent, LineLayerComponent,
      ArcLayerComponent, PolygonLayerComponent,
      GridMapLayerComponent, HeatMapLayerComponent,
      HeatMapComponent, MapComponent,
      ScatterComponent, ForceManyBodyComponent,
      ForceRadialComponent, ForceXComponent,
      ForceYComponent, LinksComponent,
      GraphComponent
  } from '~/language/components.js';

  import Engine from '~/engine/engine.js';

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
        
        editor: null,
        engine: null,
        
        
        state: {
          preview: [],
          maps: 0,
          data: {},
          //process: true,
        },
        copiedNode: null,

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
        return this.state.preview;
      },
      components(){
        const menu = [];
        const components = [...this.editor.components.values()];
        
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
          const component = this.editor.components.get( comp.name );
          const node = await component.createNode();
          node.position = this.menu;
          this.editor.addNode(node);
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

              await this.engine.abort();
             // this.$store.commit('toggleProcess', false);

              const nodes = this.editor.nodes;
              const len = nodes.length;
              for(let i=0; i < len; i++){
                this.editor.removeNode(nodes[0]);
              }

              const NODES = Object.values(data.nodes);
            
              for(let i=0; i < NODES.length; i++){
                const node = NODES[i];
                const component = this.editor.components.get( node.name );
                const n = await component.createNode( node.data );
                n.id = node.id;
                n.position = node.position;
                this.editor.addNode(n);
              }

              for(let i=0; i < NODES.length; i++){
                const node = NODES[i];
                const node1 = this.editor.nodes.find(n=> n.id === node.id);
                Object.entries(node.inputs).forEach(([key, val])=>{
                  if(val.connections.length){
                    const conn = val.connections[0];
                    const node2 = this.editor.nodes.find(n=> n.id === conn.node);
                    this.editor.connect(node2.outputs.get( conn.output ), node1.inputs.get( key ));
                  }
                });
              }

              //this.$store.commit('toggleProcess', true);
              this.editor.nodeId = undefined;
              this.editor.trigger('process');
          }
        }
      },
      select(index){
        this.selectedId = index;
        this.drawMap();
      },
      async saveEditor(noMsg){
        const json = await this.editor.toJSON();
        const data = JSON.stringify(json, null, ' ');
        const file = new Blob([data], {type: 'application/json'});
        this.href = URL.createObjectURL(file);
        
        if(!noMsg || noMsg instanceof MouseEvent)
          this.msg = 'Content saved!';
          setTimeout(()=>{ this.msg = null }, 1000);
      },
      drawMap(){
        const layers = this.state.preview[this.selectedId].layers;
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

      
      var container = document.querySelector('#editor')
      this.editor = new Rete.NodeEditor('demo@0.1.0', container)

      this.editor.use( VueRenderPlugin )
      this.editor.use( ConnectionPlugin )

      this.engine = new Rete.Engine('demo@0.1.0')

      const components = [
          new DatasetComponent, new ParseComponent,

          new ColorComponent, new ColorCategoryComponent, new ColorRangeComponent,
          
          new MultiplyComponent,

          new MapComponent,
          new PointLayerComponent, new LineLayerComponent,
          new PolygonLayerComponent, new HeatMapLayerComponent,
          new GridMapLayerComponent, new ArcLayerComponent,
          new HeatMapComponent,
          new RangeComponent, new SizeComponent,
            
          new ScatterComponent,
          
          new GraphComponent,
          new LinksComponent,
          new ForceXComponent, new ForceYComponent,
          new ForceManyBodyComponent,
          new ForceRadialComponent
      ];

        components.map(c => {
            this.editor.register(c);
            this.engine.register(c);
        });

        this.Engine = new Engine(components);

        this.editor.on('process', async()=>{
            // if(state.process)
                await this.engine.abort();
                await this.engine.process( this.editor.toJSON(), this.editor.nodeId, this.state );
        });
        this.editor.on('connectionremoved', async(conn)=>{
            // if(state.process)
                await this.engine.abort();
                await this.engine.process( this.editor.toJSON(), conn.input.node.id, this.state );
        });
        this.editor.on('connectioncreated', async(conn)=>{
            // if(state.process)
                await this.engine.abort();
                await this.engine.process( this.editor.toJSON(), conn.input.node.id, this.state );
        });

        // editor.on('connectionremoved', async(conn)=>{
        //     //if(state.process)
        //         await this.Engine.process( editor.toJSON(), conn.input.node.id, this.state );
        // });
        // editor.on('connectioncreated', async(conn)=>{
        //     //if(state.process)
        //         await this.Engine.process( editor.toJSON(), conn.input.node.id, this.state );
        // });
        // editor.on('process', async()=>{
        //     //if(state.process)
        //         await this.Engine.process( editor.toJSON(), editor.nodeId, this.state );
        // });


        this.editor.on('noderemove', (node)=>{
            // if(state.process && node){
              if(node.data.preview){
                  const item = this.state.preview.find(d=>d.id === node.data.id);
                  this.state.preview.splice(this.state.preview.indexOf(item), 1);
              }
            // }
        })

        document.addEventListener('keydown', async (e) => {
            const node = this.editor.selected.list[0];
            if (e.key === "Delete"){
                this.editor.removeNode( node );
            }else if(e.ctrlKey && e.key.toLocaleLowerCase() === 'c'){
                this.copiedNode = node;
            }else if(e.ctrlKey && e.key.toLocaleLowerCase() === 'v'){
                if(this.copiedNode){
                    const component = this.editor.components.get( this.copiedNode.name );
                    const copy = await component.createNode( this.copiedNode.data );
                    copy.position = [this.copiedNode.position[0]+10, this.copiedNode.position[1]+10];
                    this.editor.addNode( copy );
                }
            }
        });
      ///

      this.state.data['nodes'] = await this.$axios.$get('/data/nodes.json');
      this.state.data['links'] = await this.$axios.$get('/data/links.json');
      this.state.data['cars'] = d3.csvParse(await this.$axios.$get('/data/cars.csv'));
      this.state.data['branches'] = await this.$axios.$get('/data/branches.json');
      const arcs = await this.$axios.$get('/data/arcs.json')
      this.state.data['arcs'] = arcs.map(d=>({
            id: d.id,
            clients_count: d.clients_count,
            x: d.source[0],
            y: d.source[1],
            x1: d.target[0],
            y1: d.target[1]
          }));
          
      await this.editor.fromJSON({
          "id": "demo@0.1.0",
          "nodes": {
              "1": {
                  "id": 1,
                  "data": {},
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

      this.editor.nodeId = undefined;
      this.editor.trigger('process');

      document.addEventListener('keydown', async (e)=>{
        if(e.ctrlKey && e.key.toLocaleLowerCase() === 's' && this){
          e.preventDefault();
          this.saveEditor();
        }
      });
      this.editor.on('contextmenu',({ e, view, node })=>{
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
      this.editor.on('click',()=>{
        this.showMenu = false;
      });
    }
  }
</script>