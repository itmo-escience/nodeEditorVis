<template>
    <div>
        <img v-if="loading" src="~assets/loading.svg" />
        <div v-else class="d-flex">
            <div class="mrr-20">{{ placeholder }}</div>
            <input  
                type="string" 
                :readonly="readonly"
                :placeholder="placeholder"
                @input="update($event)" 
                @dblclick.stop="" 
                @pointerdown.stop="" 
                @pointermove.stop=""/>
        </div>
    </div>
</template>
<script>
    import { csvParse, text } from 'd3';

    export default { 
        props: ['placeholder', 'readonly', 'emitter', 'ikey', 'node', 'getData', 'putData'],
        data() {
          return {
            loading: false
          }
        },
        methods: {
            update(e) {
                let url = e.target.value;
                if(!(url.endsWith('.csv') || url.endsWith('.json') || url.endsWith('.geojson'))) return;
                
                this.loading = true;  
              
                url = url.startsWith('https') ? url : 'https://' + url;
                text(url).then(async result=>{
                    const data = url.endsWith('.csv') ? await csvParse(result) : JSON.parse(result);
                    
                    node.data.name = url.split('/').pop();
                    node.data.data = data;

                    this.emitter.nodeId = this.node.id;
                    this.emitter.trigger('process');
                }).catch(e=>{
                    this.loading = false;
                });

                // const result = await text(url);
                // const data = url.endsWith('.csv') ? await csvParse(result) : JSON.parse(result);

                // node.data.name = url.split('/').pop();
                // node.data.data = data;

                // console.log(node.data.name, node.data.data);

                // this.emitter.nodeId = this.node.id;
                // this.emitter.trigger('process');
            }
        }
    }
</script>
<style>
  .loading{
      width: 195px;
      height: 50px;
  }
</style>