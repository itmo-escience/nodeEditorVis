<template>
  <div @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <svg height="25" style="margin-right: 20px;" viewBox="0 0 20 20" @click="togglePallet(0)">
      <circle cx="10" cy="10" r="10" :fill="colors[0]"></circle>
    </svg>
    <svg height="25" viewBox="0 0 20 20" @click="togglePallet(1)">
      <circle cx="10" cy="10" r="10" :fill="colors[1]"></circle>
    </svg>
    <div class="pallet" v-if="opened">
      <Chrome 
        :value="colors[index]"
        @input="updateValue($event, index)"/>
    </div>
    <div style="visibility: hidden; height: 0;">{{render}}</div>
  </div>
</template>
<script>
import { Chrome } from "vue-color";
export default{
  components: {Chrome},
  props: ['emitter', 'ikey', 'node', 'getData', 'putData'],
  data(){
    return {
      colors: ["#"+((1<<24)*Math.random()|0).toString(16), "#"+((1<<24)*Math.random()|0).toString(16)],
      opened: false,
      freez: false,
      index: 0,
      render: true
    }
  },
  methods: {
    togglePallet(index){
        this.index = index;
        this.opened = !this.opened;
    },
    freezEditor(freez){
      this.freez=freez;
    },
    updateValue(color, index){
      this.colors[index] = color.hex;
      this.render = !this.render;
      this.putData(this.ikey, this.colors)
      this.emitter.trigger('process');
    }
  },
  mounted(){
      this.putData(this.ikey, this.colors);
      this.emitter.trigger('process');
      this.emitter.on('noderemove', node=>{
        if(node.id === this.node.id) this.freez = false;
      });
      this.emitter.on('nodetranslate', ()=>!this.freez);
  }
}
</script>
<style>
  .pallet{ 
    position: absolute;
    z-index: 1;
  }
</style>