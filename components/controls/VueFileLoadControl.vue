<template>
    <input id="file" type="file" @change="newData"/>
</template>
<script>
import * as d3 from "d3";

export default{
    props: ['emitter', 'DATA', 'name', 'getData', 'putData'],
    methods:{
      newData(e){
        let file = e.target.files[0];
        let fr = new FileReader();
        fr.readAsText(file);
        fr.onload = async ()=> {
            const data = file.name.endsWith('.csv') ? await d3.csvParse(fr.result) : JSON.parse(fr.result);
            this.putData(this.DATA, data);
            this.putData(this.name, file.name);
            this.emitter.trigger('process');
        };  
      }
    }
}
</script>