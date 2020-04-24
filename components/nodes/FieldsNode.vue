<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <div class="title">{{node.data.name}}</div>
        <!-- Outputs-->
        <div class="output d-flex" v-for="output in outputs()" :key="output.key">
            <div class="fields-output-title">{{output.name}}</div>
            <!--<div @mouseover="showMenu($event, output.name)" @mouseout="hideMenu">-->
            <div>
                <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
            </div>
        </div>
        
    </div>
</template>
<script>
    import VueRenderPlugin from 'rete-vue-render-plugin'
    export default{
        mixins: [VueRenderPlugin.mixin],
        components:{ Socket: VueRenderPlugin.Socket },
    }
</script>
<style>
    .input-title{
        position: relative;
        top: 7px;
    }
    .fields-output-title{
        margin-left: auto;
        position: relative;
        top: 7px;
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