<template>
    <input type="number"
        :value="value" 
        @input="change($event)"
        @mouseleave="unFreez"
        :placeholder="placeholder"/>
</template>
<script>
    export default { 
        props: ['placeholder', 'emitter', 'ikey', 'getData', 'putData'],
        data() {
          return {
            value: 0,
            freez: false,
          }
        },
        methods: {
          unFreez(){
            this.freez = false;
          },
          change(e){
            this.freez = true;
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
          this.emitter.on('zoom', ()=> !this.freez );
        }
    }
</script>