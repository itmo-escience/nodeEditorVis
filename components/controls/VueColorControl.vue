<template>
  <div @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
    <Chrome 
      value="#000"
      @input="updateValue"/>
  </div>
</template>
<script>
import { Chrome } from "vue-color";
export default{
  components: {Chrome},
  props: ['emitter', 'ikey', 'getData', 'putData'],
  data(){
    return{
      freez: false
    }
  },
  methods: {
    freezEditor(freez){
      this.freez = freez;
    },
    updateValue(color){
      this.putData(this.ikey, color.hex)
      this.emitter.trigger('process');
    }
  },
  mounted(){
    this.emitter.on('nodetranslate', ()=> !this.freez)
  }
}
</script>