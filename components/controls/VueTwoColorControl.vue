<template>
  <div class="d-flex">
    <div class="mrr-20">{{ ikey }}</div>
    <div class="fg-1" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
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
  </div>
</template>
<script>
import { Chrome } from "vue-color";
export default{
  components: {Chrome},
  props: ['emitter', 'ikey', 'node', 'getData', 'putData'],
  data(){
    return {
      colors: [
        `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},1)`,
        `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},1)`
      ],
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
      this.colors[index] = `rgba(${Object.values(color.rgba).toString()})`;
      this.render = !this.render;
      this.putData(this.ikey, this.colors);
      this.emitter.nodeId = this.node.id;
      this.emitter.trigger('process');
    }
  },
  mounted(){
      this.putData(this.ikey, this.colors);
      this.emitter.nodeId = this.node.id;
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