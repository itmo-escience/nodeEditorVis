<template>
    <div class="container mrr-20" @mousemove="dragging($event)">
        <div class="slider d-flex" ref="slider">
            <svg class="circle" :style="{ left: (positions[0]*100) +'%' }" height="20" viewBox="0 0 10 10" 
                @mousedown="dragStart(0)">
                <circle cx="5" cy="5" r="5"></circle>
            </svg>
            <svg class="circle" :style="{ left: (positions[1]*100) +'%' }" height="20" viewBox="0 0 10 10" 
                @mousedown="dragStart(1)">
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
            index: 0
          }
        },
        methods: {
            togglePallet(index){
                this.render = !this.render;
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
                    const offset = this.$refs.slider.getBoundingClientRect();
                    const width = (offset.right - offset.left);
                    const position = (e.clientX - offset.left) / width;
                    const right = this.positions[this.index+1] || 1;
                    const left = this.positions[this.index-1] || 0;
                    if(position < right && position > left){
                        this.positions[this.index] = position;
                        this.render = !this.render;
                        this.update();
                    }
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
        content: url(~assets/plus.svg);
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