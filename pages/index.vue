<template>
  <div>
    <div id='editor'></div>
  </div>
</template>
<script>
  import * as d3 from "d3";

  export default {
    async mounted(){
      this.$store.commit('initRete');
      const state = this.$store.state;
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
                  "data": { 
                    'options': ['branches.json', 'cars.csv', 'arcs.json'],
                    'dataset': 'branches.json'
                  },
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
    background: #fff;
  }
</style>