<template>
    <div @mouseover="freezEditor(true)" @mouseout="freezEditor(false)"> 
      <verte 
          picker="square" 
          model="hex"
          :draggable="false" 
          :showHistory="false" 
          @input="change($event)">
          <svg height="20" viewBox="0 0 24 10">
            <rect width="24" height="10"></rect>
            <path d="M0 20h24v20H0z"/>
        </svg>
      </verte>
    </div>
</template>
<script>
    import Verte from 'verte';
    import 'verte/dist/verte.css';

    export default { 
        props: ['emitter', 'node', 'key', 'freez', 'getData', 'putData'],
        components: { Verte },
        methods: {
          freezEditor(freez){
            this.putData(this.freez, freez);
            this.emitter.trigger('process');
          },
          change(color){
            this.node.data.colors[this.key] = color;
            this.emitter.trigger('process');
          }
        }
    }
</script>