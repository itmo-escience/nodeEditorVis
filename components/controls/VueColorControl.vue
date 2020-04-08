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
  props: ['emitter', 'ikey', 'freez', 'getData', 'putData'],
  methods: {
    freezEditor(freez){
      this.putData(this.freez, freez);
      this.emitter.trigger('process');
    },
    updateValue(color){
      this.putData(this.ikey, color.hex)
      this.emitter.trigger('process');
    }
  }
}
</script>