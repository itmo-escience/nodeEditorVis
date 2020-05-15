<template>
    <div>
        <div>{{ ikey }}</div>
        <div class="relative">
            <div class="min">{{ short(range[0]) }}</div>
            <div class="container mrr-20" @mousemove="dragging($event)">
                <div class="slider d-flex" ref="slider">
                    <svg class="circle" :style="{ left: (position*100) +'%' }" height="20" viewBox="0 0 10 10" 
                        @mousedown="dragStart">
                        <circle cx="5" cy="5" r="5"></circle>
                    </svg>
                </div>
            </div>
            <div class="max">{{ short(range[1]) }}</div>
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
            short(val){
                val = val.toString();
                return val.length < 4 ? val : val.slice(0,-3) + 'K'
            },
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