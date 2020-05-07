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
      <div id="preview-map" ref="preview-map"></div>
    </div>
    <div class="logo"></div>
  </div>
</template>
<script>
  import * as d3 from "d3";

  import { Scene } from '@antv/l7';
  import { Mapbox } from '@antv/l7-maps';
  import { PointLayer, LineLayer, PolygonLayer, HeatmapLayer } from '@antv/l7';

  export default {
    data(){
      return {
        scene: null,
        selectedId: 0,
        href: '',
        download: 'export.json',
        state: this.$store.state,
        errorMsg: false,
        msg: null,
        showMenu: false,
        menu: [0,0],
        hoveredComp: null,
        searched: null
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
                  menu.push({name: comp.path[0], children: []})
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
        const options = { autoFit: true };
        if(layers && this.scene){
          this.scene.getLayers().forEach(layer=>{
              this.scene.removeLayer(layer);
          });
          layers.forEach(l=>{
              if(l){
                  const layer = l.type === 'point' ? new PointLayer(options) : l.type === 'line' ? new LineLayer(options) : l.type === 'polygon' ? new PolygonLayer(options) : new HeatmapLayer(options);
                  layer.source(l.data, {...l.parse});
                  if(l.color) layer.color(...l.color);
                  if(l.shape) layer.shape(...l.shape);
                  if(l.size) layer.size(...l.size);
                  if(l.style) layer.style(...l.style);
                  this.scene.addLayer(layer)
              };
          });
        }
      }
    },
    async mounted(){
      this.$nextTick(()=>{
        this.scene = new Scene({
            id: this.$refs['preview-map'],
            map: new Mapbox({
                style: 'dark',
                pitch: 3,
                center: [30.29, 59.92],
                zoom: 9,
            }),
        });
      });

      this.$store.commit('initRete');

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

      document.addEventListener('keydown', async (e)=>{
        if(e.ctrlKey && e.key.toLocaleLowerCase() === 's' && this){
          e.preventDefault();
          this.saveEditor();
        }
      });
      this.state.editor.on('contextmenu',({ e, view, node })=>{
        e.preventDefault();
        // console.log(e, view, node)
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

  #preview-map{
    width: 100%;
    height: 100%;
    position: relative;
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