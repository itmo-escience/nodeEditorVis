<template>
  <div>
    <Menu @editor="toggleEditor($event)"/>
    <div class="chart">
        <div id="container"></div>
    </div>
    <div :class="{hidden: !editor}" class="editor">
      <div class="exit" @click="toggleEditor(false)"></div>
      <div id='editor'></div>
    </div>
  </div>
</template>
<script>
  import Menu from '~/components/Menu';

  export default {
    components: { Menu },
    data () {
      return {
        editor: false
      }
    },
    methods: {
      toggleEditor(open){
        this.editor = open;
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
    left: 0; bottom: 0;
    width: 100%;
    height: 50%;
    z-index: 2;
    border: 1px solid #000;
  }
  #editor{
    height: 100%;
    width: 100%;
    background: #fff;
  }
  .exit{
    position:absolute;
    top: 20px; right: 20px;
    width: 30px; height: 30px;
    background: url('~assets/exit.png');
  }
  .hidden{
    visibility: hidden;
  }
  .chart{
    position: fixed;
    top: 0px;
    left: 500px;
  }
</style>