<template>
    <div class="slider" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
        <div class="color" v-for="(color, index) in value.colors" :key="index" :style="{ width: (value.positions[index+1]*200)-5 +'px' }">
            <div>
                <verte picker="square" :value="color" model="hex" :draggable="false" :showHistory="false" @input="change($event, index)">
                    <svg class="picker" viwebox="0 0 10 10">
                        <rect :width="(value.positions[index+1]*200)-5" height="10"></rect>
                    </svg>
                </verte>
            </div>
            <svg class="circle" :style="{ left: (value.positions[index+1]*200)-10 +'px' }" height="20" viewBox="0 0 10 10" 
                @mousedown="dragStart" @mouseup="dragEnd"  @mousemove="dragging($event, index)">
                <circle cx="5" cy="5" r="5"></circle>
            </svg>
            <div :style="{visibility: 'hidden'}">{{render}}</div>
        </div>
    </div>
</template>
<script>
    import Verte from 'verte';
    import 'verte/dist/verte.css';

    export default { 
        props: ['emitter', 'ikey', 'freez', 'getData', 'putData'],
        components: { Verte },
        data() {
          return {
            drag: false,
            render: false,
            value: {
                colors: [
                    '#2E8AE6'
                ],
                positions: [ 0, .5 ]
            }
          }
        },
        methods: {
            dragStart(){
                this.drag = true;
            },
            dragEnd(){
                this.drag = false;
            },
            dragging(e, index){
                if(this.drag){
                    console.log(e.layerX)
                    this.value.positions[index+1] = e.layerX / 200;
                    this.render = !this.render;
                }
            },
            freezEditor(freez){
                this.putData(this.freez, freez);
                this.emitter.trigger('process');
            },
            change(color, index){
                this.value.colors[index] = color;
                
                // this.putData(this.ikey, this.value)
                // this.emitter.trigger('process');
            }
        }
    }
</script>
<style>
    .slider{
        position: relative;
        width: 200px;
        height: 10px;
        border-radius: 5px;
        background: #fafafa;
    }
    .color{
        height: 10px;
    }
    .circle{
        position: absolute;
        top: 0px;
    }
    .picker{
        height: 10px;
        width: 100%;
        position: absolute;
        top: 0; left: 0;
    }
</style>