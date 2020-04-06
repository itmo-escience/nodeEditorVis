<template>
    <select @change="change($event)">
        <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
    </select>
</template>
<script>
    export default { 
        props: ['emitter', 'node', 'ikey', 'options','getData', 'putData'],
        methods: {
          change(e){
            this.node.data.shapes[this.ikey] = e.target.value;
            this.emitter.trigger('process');
          }
        }
    }
</script>