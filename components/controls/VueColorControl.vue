<template>
  <div class="color-control" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <svg width="40" height="20" viewBox="0 0 20 10" @click="toggle">
      <rect width="20" height="10" :fill="color"></rect>
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
    return{
      freez: false,
      opened: false,
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
      this.putData(this.ikey, this.color);
      this.emitter.nodeId = this.node.id;
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
  .color-control{ 
    margin: 0 10px; 
  }
</style>