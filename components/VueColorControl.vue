<template>
    <verte picker="square" model="hex" draggable="false" @input="change($event)"></verte>
</template>
<script>
    import Verte from 'verte';
    import 'verte/dist/verte.css';

    export default { 
        props: ['emitter', 'ikey', 'getData', 'putData'],
        components: { Verte },
        data() {
          return {
            color: 0,
          }
        },
        methods: {
          change(color){
            console.log(color)
            //this.color = +e.target.value;
            //this.update();
          },
          update() {
            if (this.ikey)
              this.putData(this.ikey, this.value)
            this.emitter.trigger('process');
          }
        },
        mounted() {
          //this.value = this.getData(this.ikey);
        }
    }
</script>