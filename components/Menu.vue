<template>
    <div class="menu">
        <div class="d-flex">
            <div class="cel">Width</div>
            <div class="cel input"><textarea class="textatea" v-model="width"></textarea></div>
        </div>
        <div class="d-flex">
            <div class="cel">Height</div>
            <div class="cel input"><textarea class="textatea" v-model="height"></textarea></div>
        </div>
        <div class="d-flex">
            <div class="cel">Type</div>
            <div class="cel input">
                <select class="select" v-model="type">
                    <option value="point" selected>Point</option>
                    <option value="area">Area</option>
                    <option value="line">Line</option>
                </select>
            </div>
        </div>
        <div class="d-flex">
            <div class="cel">Filter</div>
            <button class="func" @click="openEditor('filter')">Edit</button>
            <button class="func" @click="proces('filter')">Process</button>
        </div>
    </div>
</template>
<script>
import G2 from '@antv/g2';

export default {
    props: ['data'],
    data(){
        return{
            width: null,
            height: null,
            type: null,
            chart: null
        }
    },
    methods:{
        async proces(name){
            const state = this.$store.state;
            let code = state.functions[name];

            let filter = [];
            for(var i=0; i<this.data.length; i++){
            
                code.nodes[1].data.chart = this.chart;
                code.nodes[1].data.value = this.data[i];

                await state.engine.process(code);
                let result = Object.values(code.nodes).find(node=>node.name === 'Output').data.result;
                filter.push(result);
            }
            let filtered = this.data.filter((d,i)=> filter[i] );
            this.chart.source(filtered);
            this.chart.render();
        },
        openEditor(name){
            const state = this.$store.state;
            if(state.functions[name]){
                state.editor.fromJSON(state.functions[name]);
            }else{
                state.editor.fromJSON({
                    "id": "demo@0.1.0",
                    "nodes": {
                        "1": {
                        "id": 1,
                        "data": {
                            "chart": this.chart,
                            "value": ''
                        },
                        "inputs": {},
                        "outputs": {
                            "num": {
                                "connections": []
                            }
                        },
                        "position": [80, 200],
                        "name": "Input"
                        }
                    }
                });
            }
            state.editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
                state.functions[name] = state.editor.toJSON();
            })

        }
    },
    updated(){
        if(this.chart){
            this.chart.destroy()
            this.chart = null;
        };

        this.chart = new G2.Chart({
            container: document.querySelector('#container'),
            width: +this.width | 600,
            height: +this.height | 300
        });
        this.chart.source(this.data);

        switch(this.type){
            case 'area':
                this.chart.area().position('time*pm25');
                break
            case 'line':
                this.chart.line().position('time*pm25');
                break
            default:
                this.chart.point().position('time*pm25');
                break
        }
        this.chart.render();
    }
}
</script>
<style>
    .menu{
        position: fixed;
        top: 0px;
        left: 0px;
        width: 500px;
        height: 100vh;
    }
    .d-flex{
        display: flex;
    }
    .cel{
        padding: 5px;
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
        height: 10px;
        padding: 5px;
        cursor: pointer;
    }
</style>