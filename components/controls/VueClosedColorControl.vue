<template>
  <div @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <svg height="15" viewBox="0 0 24 10" @click="togglePallet">
      <rect width="24" height="10" :fill="color"></rect>
    </svg>
    <div id="pallet" v-if="opened">
      <Chrome 
        value="#000"
        @input="updateValue"/>
    </div>
  </div>
  
</template>
<script>
import { Chrome } from "vue-color";
export default{
  components: {Chrome},
  props: ['emitter', 'ikey', 'freez', 'getData', 'putData'],
  data(){
    return {
      color: '#000',
      opened: false
    }
  },
  methods: {
    togglePallet(){
      this.opened = !this.opened;
    },
    freezEditor(freez){
      this.putData(this.freez, freez);
      this.emitter.trigger('process');
    },
    updateValue(color){
      this.color = color.hex;
      this.putData(this.ikey, color.hex)
      this.emitter.trigger('process');
    }
  }
}
</script>
<style>
  #pallet{ position: absolute; }
</style>