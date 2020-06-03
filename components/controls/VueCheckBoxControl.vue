<template>  
    <label class="d-flex align-center" @mouseover="freezEditor(true)" @mouseleave="freezEditor(false)">
      <input type="checkbox" v-model="value">
      <div class="checkmark"></div>
      {{ label }}
    </label>
</template>
<script>
    export default { 
        props: ['emitter', 'ikey', 'label', 'node', 'getData', 'putData'],
        data() {
          return {
            freez: false,
            value: false
          }
        },
        watch: {
          value(){
            this.update();
          }
        },
        methods: {
          freezEditor(f){
            this.freez = f;
          },
          change(){
            this.value = !this.value;
            this.update();
          },
          update() {
            this.putData(this.ikey, this.value)
            this.emitter.nodeId = this.node.id;
            this.emitter.trigger('process');
          }
        },
        mounted() {
          this.value = this.getData(this.ikey) || this.value;
          this.update();
          
          this.emitter.on('zoom', ()=> !this.freez );
          this.emitter.on('noderemove', node=>{
            if(node.id === this.node.id) this.freez = false;
          });
        }
    }
</script>
<style>
  input[type="checkbox"]{
    width: 0;
    height: 0;
  }
  .checkmark{
    width: 15px;
    height: 15px;
    border-radius: 4px;
    margin-right: 10px;
    border: 1px solid #d5d6d6;
    background: #353535;
  }
  input[type="checkbox"]:checked ~ .checkmark {
    background: #d5d6d6;
  }
</style>