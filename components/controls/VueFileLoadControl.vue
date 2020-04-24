<template>
  <div>
    <label for="file" ref="files" class="d-flex justify-center cursor-pointer files"
      :class="{ highlighted: highlighted }"
      @drop="drop($event)" @dragover="highlightArea(true)" @dragleave="highlightArea(false)">
      <img class="file-type" src="~assets/csv.svg">
      <img class="file-type" src="~assets/json.svg">
    </label>
    <input id="file" class="file-input d-flex" type="file" @change="newData"/>
  </div>
</template>
<script>
import * as d3 from "d3";

export default{
    props: ['emitter', 'DATA', 'name', 'getData', 'putData'],
    data(){
      return {
        highlighted: false
      }
    },
    methods:{
      highlightArea(highlight){
        this.highlighted = highlight;
      },
      drop(e){
        this.highlightArea(false);
        this.openFile(e.dataTransfer.files[0])
      },
      newData(e){
        let file = e.target.files[0];
        this.openFile(file);
      },
      openFile(file){
        let fr = new FileReader();
        fr.readAsText(file);
        fr.onload = async ()=> {
            const data = file.name.endsWith('.csv') ? await d3.csvParse(fr.result) : JSON.parse(fr.result);
            this.putData(this.DATA, data);
            this.putData(this.name, file.name);
            this.emitter.trigger('process');
        };  
      }
    },
    mounted(){
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        this.$refs.files.addEventListener(event, (e)=>{
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });
    }
}
</script>
<style>
  .file-input { 
    visibility: hidden; 
    height: 0; 
    padding: 0; 
  }
  .files{ 
    margin: 10px 10px 0 10px;
    padding: 20px 0;
    border: 1px dashed #353535;
    border-radius: 4px;
  }
  .files.highlighted{
    border-color: #e3c000;
  }
  .file-type{
    width: 50px;
    height: 50px;
  }
</style>