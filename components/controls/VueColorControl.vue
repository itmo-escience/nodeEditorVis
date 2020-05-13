<template>
  <div class="color-control" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <Chrome 
      v-if="opened"
      :value="color"
      @input="updateValue"/>
    <div v-if="!opened" class="toggle-color" @click="toggle" :style="{background: color}"></div>
    <div class="arrow" @click="toggle" :class="{up: opened, down: !opened}"></div>
  </div>
</template>
<script>
import { Chrome } from "vue-color";
export default{
  components: {Chrome},
  props: ['emitter', 'ikey', 'node', 'getData', 'putData'],
  data(){
    return{
      freez: false,
      opened: true,
      color: "rgba(0,0,0,250)"
    }
  },
  methods: {
    toggle(){
      this.opened = !this.opened;
    },
    freezEditor(freez){
      this.freez = freez;
    },
    updateValue(color){
      this.color = `rgba(${Object.values(color.rgba).toString()})`;
      this.putData(this.ikey, this.color)
      this.emitter.trigger('process');
    }
  },
  mounted(){
    this.putData(this.ikey, this.color)
    this.emitter.on('nodetranslate', ()=> !this.freez)
    this.emitter.on('noderemove', node=>{
      if(node.id === this.node.id) this.freez = false;
    });
  }
}
</script>
<style>
  .color-control{ margin: 0 10px; }
  .toggle-color{  
    width: 225px;
    height: 40px;
    border-radius: 2px;
  }
</style>