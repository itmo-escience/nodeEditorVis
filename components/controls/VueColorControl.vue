<template>
  <div @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <div class="color-toggle" :style="{ backgroundColor: color }" @click="toggle"></div>
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
  .color-toggle{
    width: 100px;
    height: 20px;
  }
</style>