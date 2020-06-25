<template>
    <div>
        <img v-if="loading" src="~assets/loading.svg" />
        <div v-else class="d-flex">
            <div class="mrr-20">{{ placeholder }}</div>
            <input  
                type="string" 
                :readonly="readonly"
                :placeholder="placeholder"
                :value="value" 
                @input="change($event)" 
                @dblclick.stop="" 
                @pointerdown.stop="" 
                @pointermove.stop=""/>
        </div>
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
  .loading{
      width: 195px;
      height: 50px;
  }
</style>