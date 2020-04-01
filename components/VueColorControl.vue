<template>
    <verte 
        picker="square" 
        model="hex" 
        display="widget" 
        draggable="false" 
        showHistory="false" 
        @input="change($event)">
    </verte>
</template>
<script>
    import Verte from 'verte';
    import 'verte/dist/verte.css';

    export default { 
        props: ['emitter', 'ikey', 'getData', 'putData'],
        components: { Verte },
        methods: {
          change(color){
            if (this.ikey)
              this.putData(this.ikey, color)
            this.emitter.trigger('process');
          }
        },
        mounted() {
          //this.value = this.getData(this.ikey);
        }
    }
</script>