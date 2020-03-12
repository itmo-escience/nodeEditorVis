<template>
    <div>
        <div id="container"></div>
    </div>
</template>
<script>
    import G2 from '@antv/g2';
    
    export default {
        props: ['size', 'data'],
        data(){
            return {
                chart: null,
                val: null,
                editor: false
            }
        },
        methods:{
            emitEditor: function(val){
                //this.val = val;
                //this.editor = true;
                //console.log(this.$store.state.engine, this.$store.state.editor);
                this.$store.state.editor.fromJSON({
                    "id": "demo@0.1.0",
                    "nodes": {
                        "1": {
                        "id": 1,
                        "data": {
                            "chart": this.chart,
                            "value": val
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
        },
        mounted(){
            this.$store.commit('initRete');
            this.chart = new G2.Chart({
                container: document.querySelector('#container'),
                width: 600,
                height: 300
            });
            this.chart.source(this.data);
            this.chart.point().position('time*pm25').shape('spline').size(2);

            //this.emitEditor('2');
            // this.chart.filter('time', (val) => {
            //     this.emitEditor(val);
            //     //return val > 20;
            // });
            this.chart.render();
        }
    }
</script>