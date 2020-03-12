<template>
  <div>
    <div class="editor">
      <div id='editor'></div>
    </div>
    <LineChart
      :data='lineData'
    />
  </div>
</template>
<script>
  import LineChart from '~/components/LineChart'

  // G2
  let lineData = [
    {'time': '3-21', 'pm25': 10}, {'time': '3-21', 'pm25': 20},
    {'time': '3-22', 'pm25': 15}, {'time': '3-22', 'pm25': 20},
    {'time': '3-23', 'pm25': 10}, {'time': '3-23', 'pm25': 20},
    {'time': '3-24', 'pm25': 20}, {'time': '3-24', 'pm25': 30}
  ]

  export default {
    components: {
      LineChart
    },
    data () {
      return {
        lineData: lineData
      }
    }
  }
</script>
<style>
  .editor{
    width: 100%;
    height: 500px;
  }
  #editor{
    height: 500px;
  }
</style>