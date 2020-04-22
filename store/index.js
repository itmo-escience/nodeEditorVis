import Vue from 'vue'
import Vuex from 'vuex'

import Rete from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import VueRenderPlugin from 'rete-vue-render-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin';

import G2 from '@antv/g2';

import VueNumControl from '~/components/controls/VueNumControl'
import VueStrControl from '~/components/controls/VueStrControl'
import VueSelectControl from '~/components/controls/VueSelectControl'
import VueColorControl from '~/components/controls/VueColorControl'
import VueClosedColorControl from '~/components/controls/VueClosedColorControl'
import VueFileLoadControl from '~/components/controls/VueFileLoadControl'
import VueRampControl from '~/components/controls/VueRampControl'
import VueTwoColorControl from '~/components/controls/VueTwoColorControl'
import VueTwoRangeControl from '~/components/controls/VueTwoRangeControl'

import ChartNode from '~/components/nodes/ChartNode'
import FieldsNode from '~/components/nodes/FieldsNode'
import MapNode from '~/components/nodes/MapNode'
import CategoryNode from '~/components/nodes/CategoryNode'
import GridNode from '~/components/nodes/GridNode'

Vue.use(Vuex)

const store = () => new Vuex.Store({

  state: {
    editor: null,
    engine: null,
    result: null,
    layouts: {},
    data: {},
    copiedNode: null,
    options: ['', 'branches.json', 'cars.csv', 'arcs.json', /*'COVID'*/],
    shapes: [
        'circle','square','triangle','hexagon', // 2D
        'cylinder', 'triangleColumn', 'hexagonColumn', 'squareColumn', // 3D
        ],
    lineShapes: ['line', 'arc', 'greatcircle', 'arc3d'],
    polygonShapes: ['extrude', 'fill', 'line'],
  },
  mutations: {
    initRete(state){
        const numSocket = new Rete.Socket('Number');
        const objSocket = new Rete.Socket('Object');
        const colorRangeSocket = new Rete.Socket('Color Range');
        const strSocket = new Rete.Socket('String');
        const sizeSocket = new Rete.Socket('Size');
        const layerSocket = new Rete.Socket('Layer');
        const colorSocket = new Rete.Socket('Color');
        const strArrSocket = new Rete.Socket('String Array');
        const numArrSocket = new Rete.Socket('Number Array');
        const lineShapesSocket = new Rete.Socket('Line Shapes');
        const pointShapesSocket = new Rete.Socket('Point Shapes');
        const geometrySocket = new Rete.Socket('Geometry');
        const heatMapSocket = new Rete.Socket('HeatMap');
        const gridSocket = new Rete.Socket('Grid')

        class FileLoadControl extends Rete.Control {
            constructor(emitter, key, name){
                super(key)
                this.render = 'vue';
                this.component = VueFileLoadControl;
                this.props = { emitter, DATA: key, name: name }
            }
        }
        class ColorControl extends Rete.Control {
            constructor(emitter, key){
                super(key);
                this.render = 'vue';
                this.component = VueColorControl;
                this.props = { emitter, ikey: key};
            }
        }
        class ClosedColorControl extends Rete.Control{
            constructor(emitter, key){
                super(key)
                this.render = 'vue';
                this.component = VueClosedColorControl;
                this.props = { emitter, ikey: key};
            }
        }
        class TwoColorControl extends Rete.Control{
            constructor(emitter, key){
                super(key)
                this.render = 'vue';
                this.component = VueTwoColorControl;
                this.props = { emitter, ikey: key};
            }
        }
        class TwoRangeControl extends Rete.Control{
            constructor(emitter, key, range){
                super(key)
                this.render = 'vue';
                this.component = VueTwoRangeControl;
                this.props = { emitter, ikey: key, range};
            }
        }
        class RampControl extends Rete.Control{
            constructor(emitter, key){
                super(key)
                this.render = 'vue';
                this.component = VueRampControl;
                this.props = { emitter, ikey: key};
            }
        }
        class NumControl extends Rete.Control {
            constructor(emitter, key, placeholder) {
                super(key);
                this.render = 'vue';
                this.component = VueNumControl;
                this.props = { emitter, ikey: key, placeholder };
            }

            setValue(val) {
                this.vueContext.value = val;
            }
        }
        class StrControl extends Rete.Control {
            constructor(emitter, key, placeholder) {
                super(key);
                this.render = 'vue';
                this.component = VueStrControl;
                this.props = { emitter, ikey: key, placeholder };
            }

            setValue(val) {
                this.vueContext.value = val;
            }
        }
        class SelectControl extends Rete.Control {
            constructor(emitter, key, options) {
                super(key);
                this.render = 'vue';
                this.component = VueSelectControl;
                this.props = { emitter, ikey: key, options };
            }

            setValue(val) {
                this.vueContext.value = val;
            }
        }

        // CONST
        class NumComponent extends Rete.Component {
            constructor(){
                super("Number");
                this.path = ['Const']
            }

            builder(node) {
                var out1 = new Rete.Output('num', "Number", numSocket);
                node.addControl(new NumControl(this.editor, 'num'))
                    .addOutput(out1);
            }

            worker(node, inputs, outputs) {
                outputs['num'] = node.data.num;
            }
        }
        class StrComponent extends Rete.Component {
            constructor(){
                super("String");
                this.path = ['Const']
            }

            builder(node) {
                node
                    .addControl(new StrControl(this.editor, 'str'))
                    .addOutput(new Rete.Output('str', "String", strSocket));
            }

            worker(node, inputs, outputs) {
                outputs['str'] = node.data.str;
            }
        }
        class ColorCategoryComponent extends Rete.Component {
            constructor(){
                super('Color Category')
                this.data.component = CategoryNode;
                this.path = ['Color']
            }
            build(node){
                node
                    .addInput(new Rete.Input('nums', 'Num Values', numArrSocket))
                    .addInput(new Rete.Input('strings', 'Str Values', strArrSocket))
                    .addOutput(new Rete.Output('colors', 'Colors', colorSocket)); 
                if(node.data.values){
                    node.data.values.forEach(v=>{
                        node.addControl(new ClosedColorControl(this.editor, 'field'+v));
                    });
                }
            }
            async worker(node, inputs, outputs){
                const values = inputs.strings.length ? inputs.strings[0] : inputs.nums[0];
                if( (!node.data.values && (inputs.strings.length || inputs.nums.length)) ||  (node.data.values && (JSON.stringify(node.data.values) != JSON.stringify([...new Set( values )])))){
                    const component = this.editor.components.get('Color Category');
                    const colors = await component.createNode({ values: [...new Set( values )] });
                    colors.position = node.position;
                    this.editor.addNode(colors);
                    const key = inputs.strings.length ? 'strings' :  'nums';
                    const conn = node.inputs[key].connections[0];
                    const n = this.editor.nodes.find(n=> n.id === conn.node);
                    this.editor.connect(n.outputs.get( conn.output ), colors.inputs.get( key ));
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );
                }
                if(node.data.values){
                    var data = Object.assign({}, node.data);
                    delete data.values;

                    outputs.colors = {
                        field: values,
                        colors: data
                    };
                }
            }
        }
        class ColorComponent extends Rete.Component {
            constructor(){
                super('Color')
                this.path = ['Color'];
            }
            builder(node){
                node
                    .addControl(new ColorControl(this.editor, 'color'))
                    .addOutput(new Rete.Output('color', 'Color', strSocket));
            }
            worker(node, inputs, outputs){
                if(node.data.color){
                   outputs['color'] = node.data.color; 
                }
            }
        }
        class FieldsComponent extends Rete.Component {
            constructor(){
                super('Fields')
                this.data.component = FieldsNode;
                this.path = null;
            }
            builder(node){
                node.addInput(new Rete.Input('data', 'Data', objSocket));
                for(let key in node.data[0]){
                    node.addOutput(new Rete.Output(key, key, strSocket));
                }
            }
            worker(node, inputs, outputs){
                for(let key in node.data[0]){
                    outputs[key] = key;
                }
            }
        }
        class ParseComponent extends Rete.Component {
            constructor(){
                super('Parse')
                this.data.component = FieldsNode;
                this.path = null;
            }
            builder(node){
                if(node.data.data.type === 'FeatureCollection'){
                    const props = node.data.data.features[0].properties;
                    const geometry = node.data.data.features[0].geometry;
                    for(let key in props){
                        let socket = isNaN(+ props[key]) ? strArrSocket : numArrSocket;
                        node.addOutput(new Rete.Output(key, key, socket));
                    }
                    node.addOutput(new Rete.Output('geom', 'Geometry', geometrySocket));
                }else{
                    for(let key in node.data.data[0]){
                        let socket = isNaN(+ node.data.data[0][key]) ? strArrSocket : numArrSocket;
                        node.addOutput(new Rete.Output(key, key, socket));
                    }
                }
            }
            worker(node, inputs, outputs){
                if(node.data.data.type === 'FeatureCollection'){
                    const props = node.data.data.features[0].properties;
                    for(let key in props){
                        outputs[key] = node.data.data.features.map(f=> f.properties[key]);
                    }
                    outputs.geom = node.data.data.features.map(f=> f.geometry);
                }else{
                   for(let key in node.data.data[0]){
                        outputs[key] = node.data.data.map(d=>d[key]);
                    } 
                }
            }
        }
        class DatasetComponent extends Rete.Component {
            constructor() {
                super('Dataset')
                this.path = ['Data'];
            }
            builder(node){
                node.data.dataset = '';
                node.addControl(new SelectControl( this.editor, 'dataset', state.options ));
            }
            async worker(node, inputs, outputs){
                if(node.data.dataset){
                    const component = new ParseComponent;
                    const parse = await component.createNode( {name: node.data.dataset, data: state.data[ node.data.dataset ]} );
                    parse.position = node.position;
                    editor.addNode(parse);
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );
                }
            }
        }
        class LoadDataComponent extends Rete.Component {
            constructor(){
                super('Load Data')
                this.path = ['Data']
            }
            builder(node){
                node
                    .addControl(new FileLoadControl(this.editor, 'data', 'name'));
            }
            async worker(node, inputs, outputs){
                if(node.data.data){
                    const component = new ParseComponent;
                    const parse = await component.createNode( {name: node.data.name, data: node.data.data} );
                    parse.position = node.position;
                    editor.addNode(parse);
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );
                }
            }
        }
        class ColorRangeComponent extends Rete.Component {
            constructor(){
                super('Color Range')
                this.data.component = GridNode;
                this.path = ['Color'];
            }
            build(node){
                node
                    .addInput(new Rete.Input('nums', 'Num Values', numArrSocket))
                    .addControl(new TwoColorControl(this.editor, 'colors'))
                    .addControl(new TwoRangeControl(this.editor, 'range', [0, 1]))
                    .addOutput(new Rete.Output('range', 'Range', colorRangeSocket));
            }
            async worker(node, inputs, outputs){
                const range = node.data.range;
                const nums = inputs.nums[0];
                const diff = Math.max(...nums) - Math.min(...nums);
                const min = Math.min(...nums) + (diff*range[0]);
                const max = Math.min(...nums) + (diff*range[1]);
                outputs.range = {
                    field: nums.map(d=> d > max ? max : d < min ? min : d ),
                    colors: node.data.colors
                }
            }
        }
        class RangeComponent extends Rete.Component {
            constructor(){
                super('Range')
                this.data.component = GridNode;
                this.path = []
            }
            build(node){
                node.addInput(new Rete.Input('nums', 'Num Values', numArrSocket));
                if(node.data.values){
                    node
                        .addControl(new TwoRangeControl(this.editor, 'domain', [node.data.domainFrom, node.data.domainTo]))
                        .addControl(new TwoRangeControl(this.editor, 'range', [1, 30]))
                        .addOutput(new Rete.Output('range', 'Range', numArrSocket));
                }
            }
            async worker(node, inputs, outputs){
                if(node.data.values){
                    const domainFrom = node.data.domain[0];
                    const domainTo = node.data.domain[1];
                    const rangeFrom = node.data.range[0];
                    const rangeTo = node.data.range[1];
                    outputs['range'] = inputs.nums[0].map(v=>{
                        v = v > domainTo ? domainTo : v;
                        v = v < domainFrom ? domainFrom : v;
                        return (((v - domainFrom) * (rangeTo - rangeFrom)) / (domainTo - domainFrom)) + rangeFrom
                    });
                    if(JSON.stringify(node.data.values) != JSON.stringify(inputs.nums[0])){
                        node.data.values = null;
                    }
                }

                if(!node.data.values && inputs.nums.length){
                    const values = inputs.nums[0];
                    const connection = node.inputs.nums.connections[0];

                    const component = this.editor.components.get('Range');
                    const colors = await component.createNode({ 
                        values: values,
                        domainFrom: Math.min(...values),
                        domainTo: Math.max(...values),
                    });
                    colors.position = node.position;
                    this.editor.addNode(colors);
                    const n = this.editor.nodes.find(n=> n.id === connection.node);
                    this.editor.connect(n.outputs.get( connection.output ), colors.inputs.get('nums'));
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );
                }
            }
        }
        class SizeComponent extends Rete.Component{
            constructor(){
                super('Size')
                this.path = [];
            }
            builder(node){
                node
                    .addInput(new Rete.Input('x', 'X range', numArrSocket))
                    .addInput(new Rete.Input('y', 'Y range', numArrSocket))
                    .addInput(new Rete.Input('z', 'Z range', numArrSocket))
                    .addOutput(new Rete.Output('size', 'Size', sizeSocket));
            }
            worker(node, inputs, outputs){
                outputs['size'] = [];
                for(let i=0; i < (inputs.x[0].length || inputs.y[0].length || inputs.z[0].length); i++){
                   outputs['size'].push({
                        x: inputs.x.length ? inputs.x[0][i] : 5,
                        y: inputs.y.length ? inputs.y[0][i] : 5,
                        z: inputs.z.length ? inputs.z[0][i] : 0,  
                    }) 
                }
            }
        }
        class LineShapeCategoryComponent extends Rete.Component {
            constructor(){
                super('Line Shape Category')
                this.data.component = CategoryNode;
                this.path = ['Shapes']
            }
            build(node){
                node
                    .addInput(new Rete.Input('nums', 'Num Values', numArrSocket))
                    .addInput(new Rete.Input('strings', 'Str Values', strArrSocket))
                    .addOutput(new Rete.Output('shapes', 'Shapes', lineShapesSocket)); 
                if(node.data.values){
                    node.data.values.forEach(v=>{
                        node.addControl(new SelectControl(this.editor, 'field'+v, state.lineShapes))
                    });
                }
            }
            async worker(node, inputs, outputs){
                const values = inputs.strings.length ? inputs.strings[0] : inputs.nums[0];
                if( (!node.data.values && (inputs.strings.length || inputs.nums.length)) ||  (node.data.values && (JSON.stringify(node.data.values) != JSON.stringify([...new Set( values )])))){
                    const component = this.editor.components.get('Line Shape Category');
                    const colors = await component.createNode({ values: [...new Set( values )] });
                    colors.position = node.position;
                    this.editor.addNode(colors);
                    const key = inputs.strings.length ? 'strings' :  'nums';
                    const conn = node.inputs[key].connections[0];
                    const n = this.editor.nodes.find(n=> n.id === conn.node);
                    this.editor.connect(n.outputs.get( conn.output ), colors.inputs.get( key ));
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );
                }
                if(node.data.values){
                    var data = Object.assign({}, node.data);
                    delete data.values;

                    outputs.shapes = {
                        field: values,
                        shapes: data
                    };
                }
            }
        }
        class PointShapeCategoryComponent extends Rete.Component {
            constructor(){
                super('Point Shape Category')
                this.data.component = CategoryNode;
                this.path = ['Shapes']
            }
            build(node){
                node
                    .addInput(new Rete.Input('nums', 'Num Values', numArrSocket))
                    .addInput(new Rete.Input('strings', 'Str Values', strArrSocket))
                    .addOutput(new Rete.Output('shapes', 'Shapes', pointShapesSocket)); 
                if(node.data.values){
                    node.data.values.forEach(v=>{
                        node.addControl(new SelectControl(this.editor, 'field'+v, state.shapes))
                    });
                }
            }
            async worker(node, inputs, outputs){
                const values = inputs.strings.length ? inputs.strings[0] : inputs.nums[0];
                if( (!node.data.values && (inputs.strings.length || inputs.nums.length)) ||  (node.data.values && (JSON.stringify(node.data.values) != JSON.stringify([...new Set( values )])))){
                    const component = this.editor.components.get('Point Shape Category');
                    const colors = await component.createNode({ values: [...new Set( values )] });
                    colors.position = node.position;
                    this.editor.addNode(colors);
                    const key = inputs.strings.length ? 'strings' :  'nums';
                    const conn = node.inputs[key].connections[0];
                    const n = this.editor.nodes.find(n=> n.id === conn.node);
                    this.editor.connect(n.outputs.get( conn.output ), colors.inputs.get( key ));
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );
                }
                if(node.data.values){
                    var data = Object.assign({}, node.data);
                    delete data.values;

                    outputs.shapes = {
                        field: values,
                        shapes: data
                    };
                }
            }
        }
        class PointLayerComponent extends Rete.Component {
            constructor(){
                super('Point Layer')
                this.path = ['Layers']
            }
            build(node){
                node.data.shape = state.shapes[0];

                node
                    .addInput(new Rete.Input('lat','Lat', numArrSocket))
                    .addInput(new Rete.Input('lon','Lon', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', geometrySocket))
                    .addControl(new SelectControl(this.editor, 'shape', state.shapes))
                    .addInput(new Rete.Input('shapes', 'Shape by Cat', pointShapesSocket))
                    .addInput(new Rete.Input('color','Color', strSocket))
                    .addInput(new Rete.Input('colors', 'Color by Cat', colorSocket))
                    .addInput(new Rete.Input('colorRange', 'Color Range', colorRangeSocket))
                    .addInput(new Rete.Input('size','Size', sizeSocket))
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if( (inputs.lat.length && inputs.lon.length) || inputs.geometry.length ){
                    let data = [];
                    if( (inputs.lat.length && inputs.lon.length) && 
                        inputs.lat[0].length === inputs.lon[0].length )
                    {
                        for(let i=0; i<inputs.lat[0].length; i++){
                            let obj = {
                                x: inputs.lon[0][i], 
                                y: inputs.lat[0][i],
                                ...(inputs.size.length ? {size: inputs.size[0][i]} : {}),
                                ...(inputs.colors.length ? {color: inputs.colors[0].field[i]} : {}),
                                ...(inputs.colorRange.length ? {colors: inputs.colorRange[0].field[i]} : {}),
                                ...(inputs.shapes.length ? {shape: inputs.shapes[0].field[i]}:{})
                            }
                            data.push(obj);
                        }
                    }else if(inputs.geometry.length){
                        data = {
                            type: "FeatureCollection",
                            features: inputs.geometry[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(inputs.size.length ? {size: inputs.size[0][i]} : {}),
                                    ...(inputs.colors.length ? {color: inputs.colors[0].field[i]} : {}),
                                    ...(inputs.colorRange.length ? {colors: inputs.colorRange[0].field[i]} : {}),
                                    ...(inputs.shapes.length ? {shape: inputs.shapes[0].field[i]}:{})
                                },
                                geometry: g 
                            }))
                        }
                    }

                    outputs['layer'] = {
                        type: 'point',
                        data: data,
                        parse: {
                            parser: {
                            type: 'json',
                            x: 'x',
                            y: 'y'
                        }},
                        color: inputs.color.length ? [inputs.color[0]] : inputs.colors.length ? ['color', c=>{return inputs.colors[0].colors['field'+c] }] : inputs.colorRange.length ? ['colors', inputs.colorRange[0].colors] : null,
                        shape: inputs.shapes.length ? ['shape', s=>{ return inputs.shapes[0].shapes['field'+s] }] : [node.data.shape],
                        size: inputs.size.length ? ['size', s=>{ return [ s.x, s.y, s.z ]; }] : null
                    };
                    
                }
            }
        }
        class LineLayerComponent extends Rete.Component {
            constructor(){
                super('Line Layer')
                this.path = ['Layers']
            }
            build(node){
                node.data.shape = state.lineShapes[0];

                node
                    .addInput(new Rete.Input('x','X', numArrSocket))
                    .addInput(new Rete.Input('x1','X1', numArrSocket))
                    .addInput(new Rete.Input('y','Y', numArrSocket))
                    .addInput(new Rete.Input('y1','Y1', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', geometrySocket))
                    .addControl(new SelectControl(this.editor, 'shape', state.lineShapes))
                    .addInput(new Rete.Input('color','Color', strSocket))
                    .addInput(new Rete.Input('colors', 'Color by Cat', colorSocket))
                    .addInput(new Rete.Input('colorRange', 'Color Range', colorRangeSocket))
                    // .addInput(new Rete.Input('size','Size', numSocket))
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if( (inputs.x.length && inputs.y.length && inputs.x1.length && inputs.y1.length) || inputs.geometry.length ){
                    let data = [];

                    if( (inputs.x.length && inputs.y.length && inputs.x1.length && inputs.y1.length) && 
                        (inputs.x[0].length === inputs.y[0].length) &&
                        (inputs.x[0].length === inputs.x1[0].length) &&
                        (inputs.x[0].length === inputs.y1[0].length) )
                    {
                        for(let i=0; i<inputs.x[0].length; i++){
                            let obj = {
                                x: inputs.x[0][i], 
                                x1: inputs.x1[0][i], 
                                y: inputs.y[0][i],
                                y1: inputs.y1[0][i],
                                ...(inputs.colorRange.length ? {colors: inputs.colorRange[0].field[i]} : {}),
                                ...(inputs.colors.length ? {color: inputs.colors[0].field[i]} : {})
                            }
                            data.push(obj);
                        }
                        
                    }else if(inputs.geometry.length){
                        data = {
                            type: "FeatureCollection",
                            features: inputs.geometry[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(inputs.colorRange.length ? {colors: inputs.colorRange[0].field[i]} : {}),
                                    ...(inputs.colors.length ? {color: inputs.colors[0].field[i]} : {}),
                                },
                                geometry: g 
                            }))
                        }
                    }
    
                    outputs['layer'] = {
                        type: 'line',
                        data: data,
                        parse: inputs.geometry.length ? {} : { parser: {
                                type: 'json',
                                x: 'x', x1: 'x1',
                                y: 'y', y1: 'y1'
                            } 
                        },
                        color: inputs.color.length ? [inputs.color[0]] : inputs.colors.length ? ['color', c=>{return inputs.colors[0].colors['field'+c] }] : inputs.colorRange.length ? ['colors', inputs.colorRange[0].colors] : null,
                        shape: [node.data.shape],
                    };                    
                }
            }
        }
        class PolygonLayerComponent extends Rete.Component {
            constructor(){
                super('Polygon Layer')
                this.path = ['Layers']
            }
            build(node){
                node
                    .addControl(new SelectControl(this.editor, 'shape', state.polygonShapes))
                    .addInput(new Rete.Input('color','Color', strSocket))
                    .addInput(new Rete.Input('colors', 'Color by Cat', colorSocket))
                    .addInput(new Rete.Input('colorRange', 'Color Range', colorRangeSocket))
                    .addInput(new Rete.Input('size','Size', numSocket))
                    .addInput(new Rete.Input('sizes','Sizes', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', geometrySocket))
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if(inputs.geometry.length){
                    const data = {
                        type: "FeatureCollection",
                        features: inputs.geometry[0].map((g, i)=>({ 
                            type: "Feature",
                            properties: { 
                                ...(inputs.colorRange.length ? {colors: inputs.colorRange[0].field[i]} : {}),
                                ...(inputs.colors.length ? {color: inputs.colors[0].field[i]} : {}), 
                                ...(inputs.sizes.length ? {size: inputs.sizes[0][i]} : {}), 
                            },
                            geometry: g 
                        }))
                    }

                    outputs['layer'] = {
                        type: 'polygon',
                        data: data,
                        parse: {},
                        color: inputs.color.length ? [inputs.color[0]] : inputs.colors.length ? ['color', c=>{return inputs.colors[0].colors['field'+c] }] : inputs.colorRange.length ? ['colors', inputs.colorRange[0].colors] : null,
                        shape: [node.data.shape],
                        size: inputs.size.length ? [inputs.size[0]] : inputs.sizes.length ? ['size'] : [200]
                    };
                }
            }
        }
        class HeatMapLayerComponent extends Rete.Component {
            constructor(){
                super('HeatMap Layer')
                this.path = ['Layers']
            }
            build(node){
                node.data.shape = 'circle';
                node
                    .addInput(new Rete.Input('lat','Lat', numArrSocket))
                    .addInput(new Rete.Input('lon','Lon', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', geometrySocket))
                    .addControl(new SelectControl(this.editor, 'shape', state.shapes.concat(['heatmap'])))
                    .addInput(new Rete.Input('grid', 'Grid', gridSocket))
                    .addInput(new Rete.Input('style', 'Heatmap', heatMapSocket))
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if( ((inputs.lat.length && inputs.lon.length) || inputs.geometry.length) && (inputs.style.length || inputs.grid.length) ){
                    
                    let data = [];
                    let parse;

                    if( (inputs.lat.length && inputs.lon.length) && 
                    inputs.lat[0].length === inputs.lon[0].length )
                    {
                        for(let i=0; i<inputs.lat[0].length; i++){
                            let obj = {
                                x: inputs.lon[0][i], 
                                y: inputs.lat[0][i],
                                ...(inputs.grid.length ? {transform: inputs.grid[0].field[i]} : {}), 
                            }
                            data.push(obj);
                        }
                        parse = {
                                parser: {
                                    type: 'json',
                                    x: 'x',
                                    y: 'y'
                                },
                                ...(inputs.grid.length ? {transforms: [{
                                    type: inputs.grid[0].type,
                                    size: inputs.grid[0].size,
                                    field: 'transform',
                                    method: inputs.grid[0].method
                                }]} : {})
                            };

                    }else if(inputs.geometry.length){
                        data = {
                            type: "FeatureCollection",
                            features: inputs.geometry[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(inputs.grid.length ? {transform: inputs.grid[0].field[i]} : {}), 
                                },
                                geometry: g 
                            }))
                        }
                        parse = inputs.grid.length ? {transforms: [{
                                type: inputs.grid[0].type,
                                size: inputs.grid[0].size,
                                field: 'transform',
                                method: inputs.grid[0].method
                            }]} : {};
                    }

                    outputs['layer'] = {
                        type: 'heatmap',
                        data: data,
                        parse: parse,
                        style: inputs.style.length ? [inputs.style[0]] : null,
                        color: inputs.grid.length ? [inputs.grid[0].method, inputs.grid[0].color] : null,
                        shape: inputs.grid.length ? node.data.shape === 'heatmap' ? [state.shapes[0]] : [node.data.shape] : [node.data.shape],
                        size: inputs.grid.length ? [inputs.grid[0].method, inputs.grid[0].height] : null
                    };
                }
            }
        }
        class GridComponent extends Rete.Component {
            constructor(){
                super('Grid')
                this.data.component = GridNode;
                this.path = []
            }
            builder(node){
                node.data.type = 'hexagon',
                node.data.method = 'sum',
                node.data.size = 1000;

                node
                    .addControl(new NumControl(this.editor, 'size', 'size'))
                    .addControl(new TwoRangeControl(this.editor, 'height', [0, 100000]))
                    .addControl(new TwoColorControl(this.editor, 'colors'))
                    .addControl(new SelectControl(this.editor, 'type', ['grid', 'hexagon']))
                    .addControl(new SelectControl(this.editor, 'method', ['max','min','sum','mean']))
                    .addInput(new Rete.Input('field', 'Field', numArrSocket))
                    .addOutput(new Rete.Output('grid', 'Grid', gridSocket));
            }
            worker(node, inputs, outputs){
                outputs.grid = {
                    type: node.data.type,
                    method: node.data.method,
                    size: node.data.size,
                    field: inputs.field.length ? inputs.field[0] : [],
                    height: node.data.height,
                    color: node.data.colors
                }
            }
        }
        class HeatMapComponent extends Rete.Component {
            constructor(){
                super('HeatMap')
                this.path = []
            }
            builder(node){
                node
                    .addControl(new NumControl(this.editor, 'intensity', 'intensity'))
                    .addControl(new NumControl(this.editor, 'radius', 'radius'))
                    .addControl(new NumControl(this.editor, 'opacity', 'opacity'))
                    .addControl(new RampControl(this.editor, 'ramp'))
                    .addOutput(new Rete.Output('heatmap', 'HeapMap', heatMapSocket));
            }
            worker(node, inputs, outputs){
                outputs.heatmap = {
                    intensity: node.data.intensity,
                    radius: node.data.radius,
                    opacity: node.data.opacity,
                    rampColors: node.data['ramp']
                }
            }
        }
        class MapComponent extends Rete.Component {
            constructor(){
                super('Map')
                this.data.component = MapNode;
                this.data.render = 'vue';
                this.path = [];
            }
            builder(node){
                const inputs = node.data.inputs; 
                if(inputs){
                    inputs.forEach(input=> node.addInput(new Rete.Input(input.key, input.name, layerSocket)));
                }
                const index = inputs ? inputs.length : 0;
                node.addInput(new Rete.Input('layer'+index, 'Layer'+index, layerSocket));
            }
            worker(node, inputs, outputs){
                node.data.layers = Object.values(inputs).map(input=>input[0]);
                node.data.update = true;
                this.editor.nodes.find(n=>n.id===node.id).update();
            }
        }
        class ScatterComponent extends Rete.Component {
            constructor() {
                super('Scatter')
                this.data.component = ChartNode;
                this.path = [];
            }
            builder(node){
                node
                    .addInput(new Rete.Input('x', 'X', numArrSocket))
                    .addInput(new Rete.Input('y', 'Y', numArrSocket))
                    .addInput(new Rete.Input('strx', 'X', strArrSocket))
                    .addInput(new Rete.Input('stry', 'Y', strArrSocket))
                    .addInput(new Rete.Input('color', 'Color', strSocket))
                    .addControl(new SelectControl(this.editor, 'shape', state.shapes));
            }
            worker(node, inputs, outputs){
                node.data.type = 'point';
                if((inputs.x.length || inputs.strx.length) && (inputs.y.length || inputs.stry.length)){

                    node.data.DATA = inputs.x[0].map((x, i)=> ({
                        x: inputs.x.length ? inputs.x[0][i] : inputs.strx[0][i],
                        y: inputs.y.length ? inputs.y[0][i] : inputs.stry[0][i]
                    }));
                }
                if(inputs.color.length){
                    node.data.color = inputs.color[0];
                }
                this.editor.nodes.find(n=>n.id===node.id).update();
            }
        }

        var container = document.querySelector('#editor')
        var editor = new Rete.NodeEditor('demo@0.1.0', container)

        editor.use(VueRenderPlugin)
        editor.use(ConnectionPlugin)
        editor.use(ContextMenuPlugin,{
            searchBar: true,
            delay: 100,
            allocate(component) {
                return component.path;
            },
            rename(component) {
                return component.name;
            },
            nodeItems: {
                'Delete': false,
                'Clone': false
            },
        });

        var engine = new Rete.Engine('demo@0.1.0')

        const components = [
            new ColorComponent,
            new StrComponent, new NumComponent,
            new DatasetComponent,// new ChartComponent,
            new FieldsComponent, new ParseComponent,
            new MapComponent,
            new PointLayerComponent, new LineLayerComponent,
            new PolygonLayerComponent, new HeatMapLayerComponent,
            new RangeComponent, new SizeComponent, 
            new ColorCategoryComponent,
            new PointShapeCategoryComponent,
            new LineShapeCategoryComponent,
            new LoadDataComponent,
            new HeatMapComponent, new GridComponent,
            new ColorRangeComponent,
            new ScatterComponent
        ];

        components.map(c => {
            editor.register(c);
            engine.register(c);
        });

        editor.on('process connectioncreated connectionremoved', async()=>{
            await engine.abort();
            await engine.process( editor.toJSON() )
        });

        document.addEventListener('keydown', async function (e){
            const node = editor.selected.list[0];
            if (e.key === "Delete"){
                editor.removeNode( node );
            }else if(e.ctrlKey && e.key.toLocaleLowerCase() === 'c'){
                state.copiedNode = node;
            }else if(e.ctrlKey && e.key.toLocaleLowerCase() === 'v'){
                if(state.copiedNode){
                    const component = editor.components.get( state.copiedNode.name );
                    const copy = await component.createNode();
                    copy.position = [state.copiedNode.position[0]+10, state.copiedNode.position[1]+10];
                    editor.addNode(copy);
                }
            }
        });

        this.state.engine = engine;
        this.state.editor = editor;
      }
  }
})

export default store