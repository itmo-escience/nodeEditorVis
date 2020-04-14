<template>
    <div class="d-flex">
        <div class="slider d-flex" ref="slider" @mouseover="freezEditor(true)" @mouseout="freezEditor(false)">
            <div class="color" v-for="(color, index) in value.colors" :key="index" :style="{ width: ((value.positions[index+1]-value.positions[index])*200) +'px', zIndex: 10-index }">
                <div>
                    <div id="pallet" v-if="pallet[index]">
                        <Chrome :value="color" @input="change($event, index)"/>
                    </div>
                    <svg class="picker" viwebox="0 0 10 10" @click="togglePallet(index)">
                        <rect :width="((value.positions[index+1]-value.positions[index])*200)" :fill="color" height="10"></rect>
                    </svg>
                </div>
                <svg class="circle" :style="{ left: (value.positions[index+1]*200)-10 +'px' }" height="20" viewBox="0 0 10 10" 
                    @mousedown="dragStart" @mouseup="dragEnd"  @mousemove="dragging($event, index)">
                    <circle cx="5" cy="5" r="5" :fill="color"></circle>
                </svg>
                <div :style="{visibility: 'hidden'}">{{render}}</div>
            </div>
        </div>
        <div class="plus" @click="add"></div>
    </div>
</template>
<script>
    import { Chrome } from "vue-color";

    export default { 
        props: ['emitter', 'ikey', 'freez', 'getData', 'putData'],
        components: { Chrome },
        data() {
          return {
            drag: false,
            render: false,
            pallet: [],
            value: {
                colors: ['#2E8AE6', '#a3377b'],
                positions: [ 0, .5, .9 ]
            }
          }
        },
        methods: {
            add(){
                const positions = this.value.positions;
                if(positions[positions.length - 1] < 1){
                    this.value.colors.push('#a3377b');
                    positions.push(1)
                    this.render = !this.render;
                }
            },
            togglePallet(index){
                this.pallet[index] = !this.pallet[index];
                this.render = !this.render;
            },
            dragStart(){
                this.freezEditor(true);
                this.drag = true;
            },
            dragEnd(){
                this.freezEditor(false);
                this.drag = false;
            },
            dragging(e, index){
                if(this.drag){
                    const offset = this.$refs.slider.getBoundingClientRect().left;
                    const position = (e.clientX - offset) / 200;
                    const right = this.value.positions[index+2] || 1;
                    const left = this.value.positions[index] || 0;
                    if(position < right && position > left) this.value.positions[index+1] = position;
                    this.render = !this.render;
                    this.update();
                }
            },
            freezEditor(freez){
                this.putData(this.freez, freez);
                this.emitter.trigger('process');
            },
            change(color, index){
                this.value.colors[index] = color.hex;
                this.render = !this.render;
                this.update();
            },
            update(){
                this.putData(this.ikey, this.value)
                this.emitter.trigger('process');
            }
        },
        mounted(){
            this.pallet = new Array( this.value.colors.length ).fill(false);
        }
    }
</script>
<style>
    .d-flex{ display: flex; }
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
        content: url(/plus.svg);
    }
    .color{
        height: 10px;
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