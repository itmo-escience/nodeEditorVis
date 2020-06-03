<template>
  <div class="d-flex space-between">
      <div>{{ ikey }}</div>
      <div class="d-flex align-center space-between" @mouseover="freezEditor(true)" @mouseleave="freezEditor(false)">
        <div class="minus" @click="minus"></div>
        <input type="number"
          :value="value" 
          @input="change($event)"
          :placeholder="placeholder"/>
        <div class="plus" @click="plus"></div>
      </div>
  </div>
</template>
<script>
    export default { 
        props: ['placeholder', 'emitter', 'node', 'ikey', 'getData', 'putData'],
        data() {
          return {
            value: 0,
            freez: false,
          }
        },
        methods: {
          plus(){ 
            this.value++
            this.update();
          },
          minus(){ 
            this.value--
            this.update();
          },
          freezEditor(f){
            this.freez = f;
          },
          change(e){
            this.freez = true;
            this.value = +e.target.value;
            this.update();
          },
          update() {
            this.putData(this.ikey, this.value)
            this.emitter.nodeId = this.node.id;
            this.emitter.trigger('process');
          }
        },
        mounted(){
          this.value = this.getData(this.ikey);
          this.emitter.on('zoom', ()=> !this.freez );
          this.emitter.on('noderemove', node=>{
            if(node.id === this.node.id) this.freez = false;
          });
        }
    }
</script>
<style>
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type=number] {
    -moz-appearance: textfield;
    text-align: center;
    width: 100px;
  }
  .plus, .minus{ margin: 0 10px; }
  .plus:after{
    content: url(~assets/plus.svg);
    position: relative;
    top: -2px;
  }
  .minus:after{
    content: url(~assets/minus.svg);
  }
</style>