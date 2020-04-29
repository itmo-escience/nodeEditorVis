<template>
  <div>
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
        selectedId: 0
      }
    },
    computed: {
      preview(){
        return this.$store.state.preview
      }
    },
    watch:{
      preview: {
        deep: true,
        handler(){
          this.drawMap()
        }
      }
    },
    methods:{
      select(index){
        this.selectedId = index;
        this.drawMap();
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
      const state = this.$store.state;

      // const confirmed = d3.csvParse(await this.$axios.$get('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv'));
      // const deaths = d3.csvParse(await this.$axios.$get('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv'));
      // const recovered = d3.csvParse(await this.$axios.$get('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv'));
      // const COVID = confirmed.map(c=>{
      //   const name = `${c['Country/Region']}, ${c['Province/State']}`
      //   const d = deaths.find(item=> `${item['Country/Region']}, ${item['Province/State']}` === name);
      //   const r = recovered.find(item=> `${item['Country/Region']}, ${item['Province/State']}` === name);
      //   return {
      //     name: name,
      //     lat: +c.Lat,
      //     lon: +c.Long,
      //     confirmed: Object.values(c).slice(4).reduce((a, b) => +a + +b, 0),
      //     deaths: d ? Object.values(d).slice(4).reduce((a, b) => +a + +b, 0) : null,
      //     recovered: r ? Object.values(r).slice(4).reduce((a, b) => +a + +b, 0) : null
      //   }
      // });
      // state.data['COVID'] = COVID;
      state.data['cars.csv'] = d3.csvParse(await this.$axios.$get('/data/cars.csv'));
      state.data['branches.json'] = await this.$axios.$get('/data/branches.json');
      const arcs = await this.$axios.$get('/data/arcs.json')
      state.data['arcs.json'] = arcs.map(d=>({
            id: d.id,
            clients_count: d.clients_count,
            x: d.source[0],
            y: d.source[1],
            x1: d.target[0],
            y1: d.target[1]
          }));
      state.editor.fromJSON({
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
                  "data": {
                  },
                  "position": [500, 200],
                  "name": "Map"
              }
          }
      });
    }
  }
</script>
<style>
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
</style>