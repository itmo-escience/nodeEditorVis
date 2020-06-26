<template>
  <div @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <svg height="15" viewBox="0 0 20 10" @click="togglePallet">
      <circle cx="10" cy="5" r="5" :fill="color"></circle>
    </svg>
    <div class="pallet" v-if="opened">
      <Chrome 
        :value="color"
        @input="updateValue"/>
    </div>
  </div>
</template>
<script>
import { Chrome } from "vue-color";
export default{
  components: {Chrome},
  props: ['emitter', 'ikey', 'node'],
  data(){
    return {
      color: `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},1)`,
      opened: false,
      freez: false
    }
  },
  methods:{
    togglePallet(){
      this.opened = !this.opened;
    },
    freezEditor(freez){
      this.freez=freez;
    },
    updateValue(color){
      this.color = `rgba(${Object.values(color.rgba).toString()})`;
      this.node.data.colors[this.ikey] = this.color;
    }
  },
  mounted(){
    this.color = this.node.data.colors[this.ikey] || this.color;
    this.node.data.colors[this.ikey] = this.color;
    this.emitter.on('nodetranslate', ()=>!this.freez);
    this.emitter.on('noderemove', node=>{
      if(node.id === this.node.id) this.freez = false;
    });
  },
  beforeDestroy(){
    delete this.node.data.colors[this.ikey];
  }
}
</script>
<style>
  .pallet{ position: absolute; }
</style>