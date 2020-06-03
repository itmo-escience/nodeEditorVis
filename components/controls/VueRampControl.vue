<template>
    <div>
        <svg width="200" height="200" viewBox="0 0 2 2" ref="slider" @mouseleave="dragEnd" @mousemove="dragging($event)">
            <circle v-for="(p, index) in value.positions" :key="index" 
                cx="1" cy="1" :r="1 - p" :fill="value.colors[index] || '#353535'"
                @mousedown="dragStart(index)" @mouseup="dragEnd"
                @click="togglePallet" @dblclick="remove"/>
        </svg>
        <div style="visibility: hidden; height: 0;">{{render}}</div>
        <div class="pallet" v-if="opened">
            <Chrome 
                :value="value.colors[index]"
                @input="change($event, index)"/>
        </div>
    </div>
</template>
<script>
    import { Chrome } from "vue-color";

    export default { 
        props: ['emitter', 'ikey', 'node', 'getData', 'putData'],
        components: { Chrome },
        data() {
          return {
            freez: false,
            drag: false,
            render: false,
            index: null,
            opened: false,
            value: {
                colors: ['rgba(160, 160, 180, 250)', 'rgba(10, 100, 100, 250)'],
                positions: [ 0, .2, 1. ]
            }
          }
        },
        methods: {
            remove(){
                if(this.index){
                    this.value.colors.splice(this.index, 1);
                    this.value.positions.splice(this.index, 1);
                    this.render = !this.render;
                }
            },
            togglePallet(){
                this.opened = !this.opened;
            },
            dragStart(index){
                this.index = index;
                this.drag = true;
                this.freezEditor(true);      
            },
            dragEnd(){
                this.freezEditor(false);
                this.drag = false;
            },
            dragging(e){
                if(this.drag){
                    const offset = this.$refs.slider.getBoundingClientRect();
                    const position =  1. - (Math.abs((e.clientX - offset.left)-100) / 100);
                    const right = this.value.positions[this.index+1] || 1;
                    const left = this.value.positions[this.index-1] || 0;
                    if(position < right && position > left){
                        if(!this.index){
                            this.value.positions.splice(1,0,position);
                            this.value.colors.splice(0,0,'rgba(160, 160, 180, 250)');
                            this.index = 1;
                        };
                        this.value.positions[this.index] = position;
                        this.render = !this.render;
                        this.update();
                    }
                }
            },
            freezEditor(freez){
                this.freez = freez;
            },
            change(color, index){
                this.value.colors[index] = `rgba(${Object.values(color.rgba).toString()})`;;
                this.render = !this.render;
                this.update();
            },
            update(){
                this.putData(this.ikey, this.value)
                this.emitter.nodeId = this.node.id;
                this.emitter.trigger('process');
            }
        },
        mounted(){
            this.emitter.on('nodetranslate', ()=>!this.freez);
            this.update();
        }
    }
</script>
<style>
    circle{
        stroke: #fff;
        stroke-width: .01px;
    }
    .slider{
        position: relative;
        width: 200px;
        height: 10px;
        border-radius: 5px;
        background: #fafafa;
        margin-right: 10px;
    }
    .plus{
        height: 10px;
        position: relative;
        top: -7px;
    }
    .plus:after{
        content: url(~assets/plus.svg);
    }
    .circle{
        position: absolute;
        top: -5px;
    }
    .picker{
        height: 10px;
        width: 100%;
        position: relative;
        top: -6px;
    }
    #pallet{
        position: absolute;
        top: 10px;
    }
</style>