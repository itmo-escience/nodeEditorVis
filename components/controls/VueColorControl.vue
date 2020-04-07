<template>
    <div @mouseover="freezEditor(true)" @mouseout="freezEditor(false)"> 
      <verte 
          picker="square" 
          model="hex" 
          display="widget" 
          :draggable="false" 
          :showHistory="false" 
          @input="change($event)">
      </verte>
    </div>
</template>
<script>
    import Verte from 'verte';
    import 'verte/dist/verte.css';

    export default { 
        props: ['emitter', 'key', 'freez', 'getData', 'putData'],
        components: { Verte },
        methods: {
          freezEditor(freez){
            this.putData(this.freez, freez);
            this.emitter.trigger('process');
          },
          change(color){
            if (this.key)
              this.putData(this.key, color)
            this.emitter.trigger('process');
          }
        }
    }
</script>