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
</style>