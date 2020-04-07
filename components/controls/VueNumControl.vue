<template>
    <input type="number"
        :value="value" 
        @input="change($event)"
        :placeholder="placeholder"/>
</template>
<script>
    export default { 
        props: ['placeholder', 'emitter', 'ikey', 'getData', 'putData'],
        data() {
          return {
            value: 0,
          }
        },
        methods: {
          change(e){
            this.value = +e.target.value;
            this.update();
          },
          update() {
            if (this.ikey)
              this.putData(this.ikey, this.value)
            this.emitter.trigger('process');
          }
        },
        mounted(){
          this.value = this.getData(this.ikey);
        }
    }
</script>