<template>
  <div>
    <Editor
      @size="setSize($event)"
    />
    <LineChart
      :data='lineData'
      :size='size'
    />
  </div>
</template>
<script>
/* eslint-disable */

import LineChart from '~/components/LineChart'
import Editor from '~/components/Editor'

// G2
let lineData = [
  {'time': '3-21', 'pm25': 10},
  {'time': '3-22', 'pm25': 40},
  {'time': '3-23', 'pm25': 40},
  {'time': '3-24', 'pm25': 40}
]

export default {
  components: {
    LineChart,
    Editor
  },
  data () {
    return {
      lineData: lineData,
      size: 20
    }
  },
  methods: {
    setSize(size){
      this.size = size;
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