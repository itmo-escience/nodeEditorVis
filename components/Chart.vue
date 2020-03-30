<template>
    <div id="container"></div>
</template>
<script>
import G2 from '@antv/g2';
import DataSet from '@antv/data-set';

export default{
    props: ['emitter', 'width', 'height', 'x', 'y', 'data', 'getData', 'putData'],
    data(){
        return{
            chart: null
        }
    }
    methods:{
        updateChart(){
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

            chart.position(`${this.x}*${this.y}`);

            this.chart.render();
        }
    }
}
</script>