<template>
    <div class="menu">
        <div v-if="data">
            <div class="d-flex">
                <div class="cel head">Width</div>
                <div class="cel input"><input type="number" class="textatea" v-model="width"/></div>
            </div>
            <div class="d-flex">
                <div class="cel head">Height</div>
                <div class="cel input"><input type="number" class="textatea" v-model="height"/></div>
            </div>
            <div class="d-flex">
                <div class="cel head">Type</div>
                <div class="cel input">
                    <select class="select" v-model="type">
                        <option value="point" selected>Point</option>
                        <option value="area">Area</option>
                        <option value="line">Line</option>
                    </select>
                </div>
            </div>

            <div class="d-flex">
                <div class="cel head">X</div>
                <div class="cel input">
                    <select class="select" v-model="x">
                        <option v-for="(c,i) in Object.keys(data[0])" :key="c" :value="c" :selected="i===0">{{c}}</option>
                    </select>
                </div>
            </div>
            <div class="d-flex">
                <div class="cel head">Y</div>
                <div class="cel input">
                    <select class="select" v-model="y">
                        <option v-for="(c,i) in Object.keys(data[0])" :key="c" :value="c" :selected="i===0">{{c}}</option>
                    </select>
                </div>
            </div>
        </div>
        <DataSelect @data="newData($event)" @editor="openEditor($event)" />
    </div>
</template>
<script>
import G2 from '@antv/g2';
import DataSet from '@antv/data-set';
import DataSelect from '~/components/DataSet.vue';

export default {
    components: { DataSelect },
    data(){
        return{
            x: null,
            y: null,
            width: 1300,
            height: 500,
            type: 'point',
            chart: null,
            DATA: null,
            data: null
        }
    },
    methods:{
        newData(data){
            this.DATA = data;
            this.data = data;
        },
        async proces(){
            this.data = this.DATA;
            const state = this.$store.state;
            Object.keys(state.layouts).forEach(async (key)=>{
                switch(state.layouts[key].type){
                    case 'filter':
                        await this.filter(key);
                        break
                    case 'map':
                        await this.map(key);
                    default:
                        break
                } 
            });
        },
        async map(name){
            const state = this.$store.state;
            let code = state.layouts[name].func;
            if(!code) return;

            let input = Object.values(code.nodes).find(node=>node.name === 'Input Map');
            let map = [];
            for(var i=0; i<this.data.length; i++){
                input.data = this.data[i];
                await state.engine.abort();
                await state.engine.process(code);
                map.push(state.result);
            }
            if(map[0]){
                this.data = map;
                this.chart.source(this.data);
                this.chart.render();
            }
        },
        async filter(name){
            const state = this.$store.state;
            let code = state.layouts[name].func;
            if(!code) return;

            let input = Object.values(code.nodes).find(node=>node.name === 'Input Filter');
            let filter = [];
            for(var i=0; i<this.data.length; i++){
                input.data = this.data[i];
                await state.engine.abort();
                await state.engine.process(code);
                filter.push(state.result)
            }
            if(typeof filter[0] !== 'undefined' && typeof filter[0] !== 'object'){
                let filtered = this.data.filter((d,i)=> filter[i] );
                this.data = filtered;
                this.chart.source(this.data);
                this.chart.render();
            }
        },
        openEditor(layout){
            this.$emit('editor', true);
            
            const state = this.$store.state;
            const l = state.layouts[layout.name];
            if(l){
                state.editor.fromJSON(l.func);
            }else{
                let json;
                switch(layout.type){
                    case 'filter':
                        json = {
                            "id": "demo@0.1.0",
                            "nodes": {
                                "1": {
                                    "id": 1,
                                    "data": this.data[0],
                                    "position": [80, 200],
                                    "name": "Input Filter"
                                },
                                "2": {
                                    "id": 2,
                                    "data": {},
                                    "position": [1500, 200],
                                    "name": "Output Filter"
                                }
                            }
                        }
                        break
                    case 'map':
                        json = {
                            "id": "demo@0.1.0",
                            "nodes": {
                                "1": {
                                    "id": 1,
                                    "data": this.data[0],
                                    "position": [80, 200],
                                    "name": "Input Map"
                                },
                                "2": {
                                    "id": 2,
                                    "data": {},
                                    "position": [1500, 200],
                                    "name": "Output Map"
                                }
                            }
                        }
                        break
                    default:
                        break
                }
                state.editor.fromJSON(json);
            }
            state.editor.on('process connectioncreated connectionremoved', async () => {
                if(state.layouts[layout.name]){
                   state.layouts[layout.name].func = state.editor.toJSON(); 
                }else{
                    state.layouts[layout.name] = {
                        func: state.editor.toJSON(),
                        type: layout.type
                    }
                }
                await this.proces();
            });
        },
        update(){
            if(this.chart){
                this.chart.destroy()
                this.chart = null;
            };

            this.chart = new G2.Chart({
                container: document.querySelector('#container'),
                width: +this.width,
                height: +this.height
            });
            this.chart.source(this.data);

            let chart;
            switch(this.type){
                case 'area':
                    chart = this.chart.area();
                    break
                case 'line':
                    chart = this.chart.line();
                    break
                default:
                    chart = this.chart.point();
                    break
            }
            chart.position(`${this.x}*${this.y}`);

            this.chart.render();
        }
    },
    updated(){ this.update(); },
    mounted(){ this.update(); }
}
</script>
<style>
    .menu{
        position: fixed;
        top: 0px;
        left: 0px;
        width: 400px;
        height: 100vh;
        background: #1E1E1E;
    }
    .data{
        position: absolute;
        bottom: 0; left: 0;
        width: 100%;
    }
    .right{
        text-align: right;
        margin-right: 15px;
        cursor: pointer;

    }
    .plus:after{
        content: url('/plus.svg');
    }
    .minus:after{
        content: url('/minus.svg');
    }

    .d-flex{
        display: flex;
    }
    .cel{
        padding: 5px;
        color: #fff;
    }
    .head{
        width: 100px; 
    }
    .input{
        flex-grow: 1;
    }
    .textatea{
        border: 1px solid #000;
        resize: none;
        width: 100%;
        height: 30px;
        padding: 5px;
        border-radius: 4px;
    }
    .select{
        height: 30px;
        cursor: pointer;
    }
</style>