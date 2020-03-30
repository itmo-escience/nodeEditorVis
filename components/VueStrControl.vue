<template>
    <input type="string" 
        :readonly="readonly"
        :placeholder="placeholder"
        :value="value" 
        @input="change($event)" 
        @dblclick.stop="" 
        @pointerdown.stop="" 
        @pointermove.stop=""/>
</template>
<script>
    export default { 
        props: ['placeholder', 'readonly', 'emitter', 'ikey', 'getData', 'putData'],
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
  input[type="string"] {
    margin-right: 20px;
  }
</style>