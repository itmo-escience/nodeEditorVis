<template>
    <div class="container mrr-20" @mousemove="dragging($event)">
        <div class="slider d-flex" ref="slider">
            <svg class="circle" :style="{ left: (position*100) +'%' }" height="20" viewBox="0 0 10 10" 
                @mousedown="dragStart">
                <circle cx="5" cy="5" r="5"></circle>
            </svg>
        </div>
    </div>
</template>
<script>
    import { Chrome } from "vue-color";

    export default { 
        props: ['emitter', 'ikey', 'range', 'node', 'getData', 'putData'],
        components: { Chrome },
        data() {
          return {
            drag: false,
            render: false,
            freez: false,
            position: 1,
            index: 0
          }
        },
        methods: {
            dragStart(){
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
                    if(position < 1 && position > 0){
                        this.position = position;
                        this.update();
                    }
                }
            },
            freezEditor(freez){
                this.freez = freez;
            },
            update(){
                const diff = this.range[1] - this.range[0];
                this.putData(this.ikey, this.range[0]+(diff*this.position))
                this.emitter.trigger('process');
            }
        },
        mounted(){
            this.position = this.getData(this.ikey) || this.position;
            document.addEventListener('mouseup', this.dragEnd)
            this.update();
            this.emitter.on('noderemove', node=>{
                if(node.id === this.node.id) this.freez = false;
            });
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