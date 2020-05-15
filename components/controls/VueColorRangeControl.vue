<template>
  <div class="d-flex relative align-center" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <div v-for="(color, i) in colors" :key="i" @dblclick="remove(i)" @click="togglePallet(i)" class="trigger" :style="{background: color, width: width}">
    </div>
    <div class="add-color" @click="addColor"></div>
    <div class="color-pallet" v-if="opened">
      <Chrome
        :value="colors[index]"
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
        colors: [
            `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},1)`,
            `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},1)`
        ],
        opened: false,
        index: null,
        freez: false
    }
  },
  computed:{
      width(){
          return 100 / this.colors.length + '%'
      }
  },
  methods:{
    remove(index){
        this.opened = false;
        this.index = null;
        this.colors.splice(index, 1);
    },
    addColor(){
        const color = `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},1)`;
        this.colors.push(color);
        this.update();
    },
    togglePallet(index){
        if(index === this.index){
            this.opened = false;
            this.index = null;
            return
        }
        this.index = index;
        this.opened = true;
    },
    freezEditor(freez){
        this.freez=freez;
    },
    updateValue(color){
        this.colors[this.index] = `rgba(${Object.values(color.rgba).toString()})`;
        this.update();
    },
    update(){
        this.putData(this.ikey, this.colors)
        this.emitter.trigger('process');
    }
  },
  mounted(){
      this.update();
        this.emitter.on('nodetranslate zoom', ()=>!this.freez);
        this.emitter.on('noderemove', node=>{
            if(node.id === this.node.id) this.freez = false;
        });
  }
}
</script>
<style>
    .color-pallet{ 
        position: absolute;
        top: 20px;
        z-index: 3;
    }
    .trigger{
        height: 15px;
    }
    .add-color{
        content: url(~assets/plus.svg);
    }
</style>