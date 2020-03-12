<template>
  <div>
    <Menu :data="Data"/>
    <div class="editor">
      <div id='editor'></div>
    </div>
    <div class="chart">
        <div id="container"></div>
    </div>
    <!--<LineChart
      :data='lineData'
    />-->
  </div>
</template>
<script>
  import Menu from '~/components/Menu'

  export default {
    components: { Menu },
    data () {
      return {
        Data: [
          {'time': '3-21', 'pm25': 10}, {'time': '3-21', 'pm25': 20},
          {'time': '3-22', 'pm25': 15}, {'time': '3-22', 'pm25': 20},
          {'time': '3-23', 'pm25': 10}, {'time': '3-23', 'pm25': 20},
          {'time': '3-24', 'pm25': 20}, {'time': '3-24', 'pm25': 30}
        ]
      }
    },
    mounted(){
      this.$store.commit('initRete');
    }
  }
</script>
<style>
  .editor{
    position: fixed;
    left: 500px;
    bottom: 0px;
    width: 100%;
    height: 500px;
  }
  #editor{
    height: 500px;
  }
  .chart{
    position: fixed;
    top: 0px;
    left: 500px;
  }
</style>