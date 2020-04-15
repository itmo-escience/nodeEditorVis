<template>
    <select @change="change($event)" @mouseover="freezEditor(true)" @mouseleave="freezEditor(false)">
        <option v-for="(option, index) in options" :key="option" :value="option" :disabled="!option" :selected="!index">{{ option }}</option>
    </select>
</template>
<script>
    export default { 
        props: ['options', 'emitter', 'ikey', 'getData', 'putData'],
        data() {
          return {
            value: '',
            freez: false
          }
        },
        methods: {
          freezEditor(freez){
            this.freez = freez;
          },
          change(e){
            this.value = e.target.value;
            this.freezEditor(false);
            this.update();
          },
          update() {
            if (this.ikey)  
              this.putData(this.ikey, this.value)
            this.emitter.trigger('process');
          }
        },
        mounted() {
          this.value = this.getData(this.ikey);
          this.emitter.on('nodetranslate', ()=> !this.freez);
        }
    }
</script>
<style>
  
</style>