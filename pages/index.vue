<template>
  <div>
    <div id='editor'></div>
  </div>
</template>
<script>
  export default {
    mounted(){
      this.$store.commit('initRete');
      const state = this.$store.state;
        
      state.editor.fromJSON({
          "id": "demo@0.1.0",
          "nodes": {
              "1": {
                  "id": 1,
                  "data": ['/data/cars.csv'],
                  "position": [80, 200],
                  "name": "Dataset"
              },
              "2": {
                  "id": 2,
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
  .chart{
    position: fixed;
    top: 0px;
    left: 500px;
  }
</style>