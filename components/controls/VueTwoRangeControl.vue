<template>
    <div class="container">
        <div class="slider d-flex" ref="slider">
                <svg class="circle" :style="{ left: (positions[0]*width)-10 +'px' }" height="20" viewBox="0 0 10 10" 
                    @mousedown="dragStart"   @mousemove="dragging($event, 0)">
                    <circle cx="5" cy="5" r="5"></circle>
                </svg>
                <svg class="circle" :style="{ left: width ? (positions[1]*width)-10 +'px':'calc(100% - 10px)' }" height="20" viewBox="0 0 10 10" 
                    @mousedown="dragStart"   @mousemove="dragging($event, 1)">
                    <circle cx="5" cy="5" r="5"></circle>
                </svg>
                <div :style="{visibility: 'hidden'}">{{render}}</div>
        </div>
    </div>
</template>
<script>
    import { Chrome } from "vue-color";

    export default { 
        props: ['emitter', 'ikey', 'range', 'getData', 'putData'],
        components: { Chrome },
        data() {
          return {
            drag: false,
            render: false,
            freez: false,
            positions: [0, 1],
            width: null
          }
        },
        methods: {
            togglePallet(index){
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
                    const offset = this.$refs.slider.getBoundingClientRect();
                    this.width = (offset.right - offset.left);
                    const position = (e.clientX - offset.left) / this.width;
                    const right = this.positions[index+1] || 1;
                    const left = this.positions[index-1] || 0;
                    if(position < right && position > left) this.positions[index] = position;
                    this.render = !this.render;
                    this.update();
                }
            },
            freezEditor(freez){
                this.freez = freez;
            },
            update(){
                const diff = this.range[1] - this.range[0];
                this.putData(this.ikey, [this.range[0]+(diff*this.positions[0]), this.range[0]+(diff*this.positions[1])])
                this.emitter.trigger('process');
            }
        },
        mounted(){
            document.addEventListener('mouseup', this.dragEnd)
            this.update();
            this.emitter.on('nodetranslate', ()=>!this.freez);
        }
    }
</script>
<style>
    .container{
        height: 20px;
    }
    .d-flex{ display: flex; }
    .slider{
        position: relative;
        top: 10px;
        width: 100%;
        height: 2px;
        border-radius: 5px;
        background: #d5d6d6;
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
        top: -8px;
    }
    .circle circle{ fill: #d5d6d6; }
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