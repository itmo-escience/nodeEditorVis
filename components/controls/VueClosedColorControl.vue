<template>
  <div @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <svg height="15" viewBox="0 0 24 10" @click="togglePallet">
      <rect width="24" height="10" :fill="color"></rect>
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
  props: ['emitter', 'ikey', 'node', 'getData', 'putData'],
  data(){
    return {
      color: `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},1)`,
      // color: "#"+((1<<24)*Math.random()|0).toString(16),
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
      this.putData(this.ikey, this.color)
      this.emitter.trigger('process');
    }
  },
  updated(){
    this.color = this.getData(this.ikey);
  },
  mounted(){
    this.color = this.getData(this.ikey) || this.color;
    this.putData(this.ikey, this.color);
    this.emitter.trigger('process');
    this.emitter.on('nodetranslate', ()=>!this.freez);
    this.emitter.on('noderemove', node=>{
      if(node.id === this.node.id) this.freez = false;
    });
  }
}
</script>
<style>
  .pallet{ position: absolute; }
</style>