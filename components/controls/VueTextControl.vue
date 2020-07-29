<template>
    <div class="d-flex">
            <div class="mrr-20">{{ placeholder }}</div>
            <input  
                type="string" 
                :readonly="readonly"
                :placeholder="placeholder"
                v-model="val" 
                @dblclick.stop="" 
                @pointerdown.stop="" 
                @pointermove.stop=""/>
    </div>
</template>
<script>
    import { csvParse, text } from 'd3';

    export default { 
        props: ['placeholder', 'readonly', 'emitter', 'ikey', 'node', 'getData', 'putData'],
        data() {
          return {
            val: ''
          }
        },
        updated() {
            this.node.data[this.ikey] = this.val;
            this.emitter.trigger('process');
        }
    }
</script>