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
      //state.data['cars.csv'] = await d3.csv('/data/cars.csv');
      state.data['cars.csv'] = d3.csvParse(await this.$axios.$get('/data/cars.csv'));
      
      state.editor.fromJSON({
          "id": "demo@0.1.0",
          "nodes": {
              "1": {
                  "id": 1,
                  "data": { 
                    'options': ['cars.csv'],
                    'dataset': 'cars.csv'
                  },
                  "position": [80, 200],
                  "name": "Dataset"
              },
              "2": {
                  "id": 2,
                  "data": {
                    'width': 500, 'height': 500,
                    'type': 'point',
                    'DATA': [],
                    'x': 'width', 'y': 'height',
                    'color':''
                  },
                  "position": [500, 200],
                  "name": "Chart"
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