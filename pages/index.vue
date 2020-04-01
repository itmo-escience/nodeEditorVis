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
      
      state.editor.fromJSON({
          "id": "demo@0.1.0",
          "nodes": {
              "1": {
                  "id": 1,
                  "data": { 
                    'options': ['branches.json', 'cars.csv'],
                    'dataset': 'branches.json'
                  },
                  "position": [80, 200],
                  "name": "Dataset"
              },
              // "2": {
              //     "id": 2,
              //     "data": {
              //       'width': 500, 'height': 500,
              //       'type': 'point',
              //       'DATA': [],
              //       'x': 'width', 'y': 'height',
              //       'color':''
              //     },
              //     "position": [500, 200],
              //     "name": "Chart"
              // }
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
    height: 100%;
    z-index: 2;
    background: #fff;
  }
</style>