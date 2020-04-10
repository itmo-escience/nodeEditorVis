<template>
    <select @change="change($event)">
        <option v-for="(option, index) in options" :key="option" :value="option" :disabled="!option" :selected="!index">{{ option }}</option>
    </select>
</template>
<script>
    export default { 
        props: ['options', 'emitter', 'ikey', 'getData', 'putData'],
        data() {
          return {
            value: '',
          }
        },
        methods: {
          change(e){
            this.value = e.target.value;
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
        }
    }
</script>
<style>
  
</style>