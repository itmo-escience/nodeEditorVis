<template>
    <div>
        <img v-if="loading" src="~assets/loading.svg" />
        <input v-else 
            type="string" 
            :readonly="readonly"
            :placeholder="placeholder"
            :value="value" 
            @input="change($event)" 
            @dblclick.stop="" 
            @pointerdown.stop="" 
            @pointermove.stop=""/>
    </div>
</template>
<script>
    export default { 
        props: ['placeholder', 'readonly', 'emitter', 'ikey', 'node', 'getData', 'putData'],
        data() {
          return {
            value: '',
            loading: false
          }
        },
        methods: {
            change(e){
                this.value = e.target.value;
                this.update();
            },
            update() {
                this.loading = true;
                this.putData(this.ikey, this.value);
                this.emitter.nodeId = this.node.id;
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
  .loading{
      width: 195px;
      height: 50px;
  }
</style>