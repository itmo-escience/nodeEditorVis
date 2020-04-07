<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <div class="title">{{node.name}}</div>
        <div class="input d-flex" v-for="input in inputs()" :key="input.key">
            <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
            <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
            <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
        </div>
        <!-- Outputs-->
        <div class="output d-flex" v-for="output in outputs()" :key="output.key">
            <div class="fields-output-title">{{output.name}}</div>
            <div @mouseover="showMenu($event, output.name)" @mouseout="hideMenu">
                <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
            </div>
        </div>
        <div v-if="node.name === 'Parse'" class="field-menu d-fex" ref="menu" @mouseover="hodMenu" @mouseout="hideMenu">
            <div class="menu-item" @click="colorCategory">Color category</div>
            <div class="menu-item" @click="shapeCategory">2d Shape category</div>
            <div class="menu-item" @click="range" v-if="typeof node.data[0][name] === 'number'" >Range</div>
        </div>
        <!-- <div class="control" v-for="control in controls()" v-control="control"></div>-->
        <!-- Inputs-->
        
    </div>
</template>
<script>
    import VueRenderPlugin from 'rete-vue-render-plugin'
    export default{
        mixins: [VueRenderPlugin.mixin],
        components:{ Socket: VueRenderPlugin.Socket },
        data(){return { name: null }},
        methods:{
            async range(){
                if(this.node.name === 'Parse'){
                    const component = this.editor.components.get('Size');
                    const values = this.node.data.map(item => item[this.name]);
                    const range = await component.createNode( { 
                        values: values,
                        field: this.name,
                        domainFrom: Math.min(...values),
                        domainTo: Math.max(...values),
                    });
                    range.position = [this.node.position[0]+250, this.node.position[1] ];
                    this.editor.addNode(range);
                    this.editor.connect(this.node.outputs.get( this.name ), range.inputs.get('column'));
                }
            },
            async colorCategory(){
                if(this.node.name === 'Parse'){
                    const component = this.editor.components.get('Color Category');
                    const unique = [...new Set(this.node.data.map(item => item[this.name]))];
                    const fields = await component.createNode( { values: unique } );
                    fields.position = [this.node.position[0]+250, this.node.position[1] ];
                    this.editor.addNode(fields);
                    this.editor.connect(this.node.outputs.get( this.name ), fields.inputs.get('field'));
                }
            },
            async shapeCategory(){
                if(this.node.name === 'Parse'){
                    const component = this.editor.components.get('Shape Category');
                    const unique = [...new Set(this.node.data.map(item => item[this.name]))];
                    const fields = await component.createNode( { values: unique } );
                    fields.position = [this.node.position[0]+250, this.node.position[1] ];
                    this.editor.addNode(fields);
                    this.editor.connect(this.node.outputs.get( this.name ), fields.inputs.get('field'));
                }
            },
            hideMenu(){
                if(this.node.name === 'Parse')
                    this.$refs.menu.style.visibility = 'hidden';
            },
            hodMenu(){
                if(this.node.name === 'Parse')
                    this.$refs.menu.style.visibility = 'visible';
            },
            showMenu(e, name){
                if(this.node.name === 'Parse'){
                    const menu = this.$refs.menu
                    menu.style.visibility = 'visible';
                    menu.style.top = e.target.offsetTop + 'px';
                    menu.style.left = e.target.offsetLeft + e.target.offsetWidth + 'px';
                    this.name = name;
                }
            }
        }
    }
</script>
<style>
    .node{
        background: rgba(110,136,255,0.8);
        border: 2px solid #4e58bf;
        min-width: 180px;
        height: auto;
    }
    .input-title{
        position: relative;
        top: 7px;
    }
    .fields-output-title{
        margin-left: auto;
        position: relative;
        top: 7px;
    }
    .d-flex{
        display: flex;
    }
    .field-menu{
        visibility: hidden;
        position: absolute; 
        border: .5px solid #000;
        border-radius: 5px;
        background: #fff;
    }
    .menu-item{
        min-width: 100px;
        padding: 5px;
    }
    
</style>