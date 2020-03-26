<template>
    <div class="data">
        <div class="d-flex">
            <div class="cel head">Layouts</div>
            <div class="cel input plus right" @click="addLayout=true"></div>
        </div>
        <div class="layouts">
            <div v-if="addLayout" class="d-flex">
                <div class="cel head"><input type="text" class="textatea" v-model="newLayoutName"/></div>
                <div class="cel input">
                    <button class="func" @click="createLayout">Create</button>
                </div>
            </div>
            <div v-for="l in layouts" :key="l.name" class="layout">
                <div class="d-flex">
                    <div class="cel head">{{l.name}}</div>
                    <div class="cel input minus right" @click="removeLayout(l.name)"></div>
                </div>
                <div class="d-flex">
                    <div class="cel head">Type</div>
                    <div class="cel input">
                        <select class="select" v-model="l.type" @change="changeLayoutType(l)">
                            <option value="filter" selected>Filter</option>
                            <option value="map">Map</option>
                            <option value="pick">Pick</option>
                            <option value="rename">Rename</option>
                        </select>
                    </div>
                </div>
                <div v-if="l.type==='filter' || l.type==='map'" class="d-flex">
                    <div class="cel head">Callback</div>
                    <div class="cel input">
                        <button class="func" @click="openEditor(l)">Edit</button>
                    </div>
                </div>

            </div>
        </div>
        <div class="d-flex">
            <div class="cel head">DataSet</div>
            <div class="cel input">
                <select class="select" v-model="dataSet" @change="newData">
                    <option value="cars" selected>Cars</option>
                    <option value="countries">Countries</option>
                </select>
            </div>
        </div>
    </div>
</template>
<script>
    import * as d3 from "d3";

    export default {
        data(){
            return {
                dataSet: 'cars',
                layouts: [],
                addLayout: false,
                newLayoutName: null,
            }
        },
        methods:{
            changeLayoutType(layout){
                this.$store.state.layouts[layout.name] = null;
            },
            createLayout(){
                this.addLayout = false;
                this.layouts.push({ 
                    name: this.newLayoutName,
                    type: 'filter'
                });
                this.newLayoutName = null;
            },
            removeLayout(layout){
                this.layouts.splice( this.layouts.indexOf(layout), 1 )
            },
            openEditor(layout){
                this.$emit('editor', layout);
            },
            async newData(){
                let data;
                switch(this.dataSet){
                    case 'cars':
                        data = await d3.csv(`/data/cars.csv`);
                        break
                    case 'countries':
                        data = await d3.json(`/data/countries.json`);
                        break
                    default:
                        break
                }

                this.$emit('data', data);
            }
        },
        mounted(){ this.newData(); }
    }
</script>