<template>
    <div>
        <svg width="200" height="200" viewBox="0 0 2 2" ref="slider" @mouseleave="dragEnd" @mousemove="dragging($event)">
            <circle v-for="(p, index) in value.positions.slice(1).concat([1.]).reverse()" :key="index" 
                cx="1" cy="1" :r="p" :fill="value.colors[value.colors.length - index] || '#353535'"
                @mousedown="dragStart(index)" @mouseup="dragEnd"
                @click="togglePallet" @dblclick="dblclick(realIndex)" />
        </svg>
        <div style="visibility: hidden; height: 0;">{{render}}</div>
        <div class="pallet" v-if="opened">
            <Chrome 
                :value="value.colors[realIndex]"
                @input="change($event, realIndex)"/>
        </div>
    </div>
</template>
<script>
    import { Chrome } from "vue-color";

    export default { 
        props: ['emitter', 'ikey', 'getData', 'putData'],
        components: { Chrome },
        data() {
          return {
            freez: false,
            drag: false,
            render: false,
            index: null,
            opened: false,
            value: {
                colors: ['#2E8AE6', '#a3377b'],
                positions: [ 0, .2, .7 ]
            }
          }
        },
        methods: {
            dblclick(index){
                this.value.colors.splice(index, 1);
                this.value.positions.splice(index+1, 1);
            },
            togglePallet(){
                this.opened = !this.opened;
            },
            dragStart(index){
                this.index = index;
                this.freezEditor(true);
                this.drag = true;
            },
            dragEnd(){
                this.freezEditor(false);
                this.drag = false;
            },
            dragging(e){
                if(this.drag){
                    const index = ((this.value.positions.slice(1).length) - this.index)+1;
                    if(index === this.value.positions.length){
                        this.index = 1;
                        this.value.colors.push('#aee772');
                    };
                    const offset = this.$refs.slider.getBoundingClientRect();
                    const position =  Math.abs((e.clientX - offset.left)-100) / 100;
                    const right = this.value.positions[index+1] || 1;
                    const left = this.value.positions[index-1] || 0;
                    if(position < right && position > left){
                        this.value.positions[index] = position;
                        this.render = !this.render;
                        this.update();
                    }
                }
            },
            freezEditor(freez){
                this.freez = freez;
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
        computed: {
            realIndex() {
                return (this.value.colors.length) - this.index;
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
        content: url(~assets/plus.svg);
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