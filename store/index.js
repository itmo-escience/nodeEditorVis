import Vue from 'vue'
import Vuex from 'vuex'

import Rete from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import VueRenderPlugin from 'rete-vue-render-plugin'

import * as d3 from "d3";

import VueNumControl from '~/components/controls/VueNumControl'
import VueStrControl from '~/components/controls/VueStrControl'
import VueSelectControl from '~/components/controls/VueSelectControl'
import VueColorControl from '~/components/controls/VueColorControl'
import VueClosedColorControl from '~/components/controls/VueClosedColorControl'
import VueFileLoadControl from '~/components/controls/VueFileLoadControl'
import VueTwoColorControl from '~/components/controls/VueTwoColorControl'
import VueTwoRangeControl from '~/components/controls/VueTwoRangeControl'
import VueLoadControl from '~/components/controls/VueLoadControl.vue'
import VueRangeControl from '~/components/controls/VueRangeControl.vue'
import VueCheckBoxControl from '~/components/controls/VueCheckBoxControl.vue'
import VueColorRangeControl from '~/components/controls/VueColorRangeControl.vue'

import ChartNode from '~/components/nodes/ChartNode'
import MapNode from '~/components/nodes/MapNode'
import CategoryNode from '~/components/nodes/CategoryNode'
import GraphNode from '~/components/nodes/GraphNode'
import Node from '~/components/nodes/Node'

Vue.use(Vuex)

const store = () => new Vuex.Store({

  state: {
    editor: null,
    engine: null,
    options: ['', 'cars.csv', 'branches.json', 'arcs.json', 'nodes', 'links'],
    preview: [],
    ids: {
        maps: 0
    },
    process: true,
    data: {},
    copiedNode: null,
    shapes: [
        'circle','square','triangle','hexagon', // 2D
        'cylinder', 'triangleColumn', 'hexagonColumn', 'squareColumn', // 3D
        ],
    lineShapes: ['line', 'arc', 'greatcircle', 'arc3d'],
    polygonShapes: ['extrude', 'fill'],
  },
  mutations: {
    toggleProcess(state, process){
        state.process = process;
    },
    initRete(state){
        const numSocket = new Rete.Socket('Number');
        const colorSocket = new Rete.Socket('Color');
        const colorMapSocket = new Rete.Socket('Color Map');
        const strSocket = new Rete.Socket('String');
        const sizeSocket = new Rete.Socket('Size');
        const layerSocket = new Rete.Socket('Layer');
        const strArrSocket = new Rete.Socket('String Array');
        const numArrSocket = new Rete.Socket('Number Array');
        const lineShapesSocket = new Rete.Socket('Line Shapes');
        const pointShapesSocket = new Rete.Socket('Point Shapes');
        const heatMapSocket = new Rete.Socket('HeatMap');
        const gridSocket = new Rete.Socket('Grid');

        const forceXSocket = new Rete.Socket('Force X');
        const forceYSocket = new Rete.Socket('Force Y');
        const forceManyBodySocket = new Rete.Socket('Force Many Body');
        const forceRadialSocket = new Rete.Socket('Force Radial');

        const nodesSocket = new Rete.Socket('Nodes');
        const linksSocket = new Rete.Socket('Links');

        const pointGeometrySocket = new Rete.Socket('Point Geometry');
        const lineGeometrySocket = new Rete.Socket('Line Geometry');
        const polygonGeometrySocket = new Rete.Socket('Polygon Geometry');
        

        class MultiplyComponent extends Rete.Component {
            constructor() {
                super('Multiply')
                this.data.component = Node;
                this.path = [];
            }
            builder(node){
                node.data.multiplier = 1;
                node
                    .addInput(new Rete.Input('nums', 'Nums', numArrSocket))
                    .addOutput(new Rete.Output('result', 'Result', numArrSocket))
                    .addControl(new NumControl(this.editor, 'multiplier', node));
            }
            worker(node, inputs, outputs){
                outputs.result = inputs.nums[0].map(d=> d*node.data.multiplier );
            }
        }
        class FileLoadControl extends Rete.Control {
            constructor(emitter, key, name){
                super(key)
                this.render = 'vue';
                this.component = VueFileLoadControl;
                this.props = { emitter, DATA: key, name: name }
            }
        }
        class ColorControl extends Rete.Control {
            constructor(emitter, key, node){
                super(key);
                this.render = 'vue';
                this.component = VueColorControl;
                this.props = { emitter, ikey: key, node};
            }
        }
        class ClosedColorControl extends Rete.Control{
            constructor(emitter, key, node){
                super(key)
                this.render = 'vue';
                this.component = VueClosedColorControl;
                this.props = { emitter, ikey: key, node};
            }
        }
        class TwoColorControl extends Rete.Control{
            constructor(emitter, key, node){
                super(key)
                this.render = 'vue';
                this.component = VueTwoColorControl;
                this.props = { emitter, ikey: key, node};
            }
        }
        class ColorRangeControl extends Rete.Control{
            constructor(emitter, key, node){
                super(key)
                this.render = 'vue';
                this.component = VueColorRangeControl;
                this.props = { emitter, ikey: key, node};
            }
        }
        class CheckBoxControl extends Rete.Control{
            constructor(emitter, key, label, node){
                super(key)
                this.render = 'vue';
                this.component = VueCheckBoxControl;
                this.props = { emitter, ikey: key, label, node };
            }
        }
        class RangeControl extends Rete.Control{
            constructor(emitter, key, range, node){
                super(key)
                this.render = 'vue';
                this.component = VueRangeControl;
                this.props = { emitter, ikey: key, range, node};
            }
        }
        class TwoRangeControl extends Rete.Control{
            constructor(emitter, key, range, node){
                super(key)
                this.render = 'vue';
                this.component = VueTwoRangeControl;
                this.props = { emitter, ikey: key, range, node};
            }
        }
        class NumControl extends Rete.Control {
            constructor(emitter, key, node, placeholder) {
                super(key);
                this.render = 'vue';
                this.component = VueNumControl;
                this.props = { emitter, ikey: key, node, placeholder };
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
        }
        class LoadControl extends Rete.Control {
            constructor(emitter, key, placeholder) {
                super(key);
                this.render = 'vue';
                this.component = VueLoadControl;
                this.props = { emitter, ikey: key, placeholder };
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
        // COMPONENTSS
        class NumComponent extends Rete.Component {
            constructor(){
                super("Number");
                this.data.component = Node;
                this.path = ['Const']
            }

            builder(node) {
                var out1 = new Rete.Output('num', "Number", numSocket);
                node.addControl(new NumControl(this.editor, 'num', node))
                    .addOutput(out1);
            }

            worker(node, inputs, outputs) {
                outputs['num'] = node.data.num;
            }
        }
        class StrComponent extends Rete.Component {
            constructor(){
                super("String");
                this.data.component = Node;
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
        class ColorComponent extends Rete.Component {
            constructor(){
                super('Color')
                this.data.component = Node;
                this.path = ['Color'];
            }
            builder(node){
                node
                    .addControl(new ColorControl(this.editor, 'color', node))
                    .addOutput(new Rete.Output('color', 'Color', colorSocket));
            }
            worker(node, inputs, outputs){
                if(node.data.color){
                   outputs['color'] = {data: null, value: node.data.color}; 
                }
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
                    .addInput(new Rete.Input('color', 'Color Map', colorMapSocket))
                    
                    .addOutput(new Rete.Output('colors', 'Colors', colorSocket))
                    .addOutput(new Rete.Output('colorMap', 'Color Map', colorMapSocket)); 
                if(node.data.values){
                    node.data.values.forEach(v=>{
                        node.addControl(new ClosedColorControl(this.editor, 'field'+v, node));
                    });
                }
            }
            async worker(node, inputs, outputs){
                const values = inputs.strings.length ? inputs.strings[0] : inputs.nums[0];
                if(!values){
                    node.data.values = null;
                }else if( !node.data.values ||  (node.data.values && (JSON.stringify(node.data.values) != JSON.stringify([...new Set( values )])))){
                    const component = this.editor.components.get('Color Category');
                    const colors = await component.createNode({ values: [...new Set( values )] });
                    colors.position = node.position;
                    this.editor.addNode(colors);
                    const key = inputs.strings.length ? 'strings' :  'nums';
                    const conn = node.inputs[key].connections[0];

                    const n = this.editor.nodes.find(n=> n.id === conn.node);
                    this.editor.connect(n.outputs.get( conn.output ), colors.inputs.get( key ));

                    const colorConn = node.inputs['color'].connections[0];
                    if(colorConn){
                        const colorNode = this.editor.nodes.find(n=> n.id === colorConn.node);
                        this.editor.connect(colorNode.outputs.get( colorConn.output ), colors.inputs.get( 'color' )); 
                    }

                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );

                    const outColorConn = node.outputs['colors'].connections[0];
                    if(outColorConn){
                        const n = this.editor.nodes.find(n=> n.id === outColorConn.node);
                        this.editor.connect(colors.outputs.get( 'colors' ), n.inputs.get( outColorConn.input ));
                    }
                    const outColorMapConn = node.outputs['colorMap'].connections[0];
                    if(outColorMapConn){
                        const n = this.editor.nodes.find(n=> n.id === outColorMapConn.node);
                        this.editor.connect(colors.outputs.get( 'colorMap' ), n.inputs.get( outColorMapConn.input ));
                    }
                }
                if(node.data.values){
                    if(inputs.color.length){
                        const n = this.editor.nodes.find(n=>n.id===node.id);
                        Object.keys(node.data).forEach(k=>{
                            if(inputs.color[0][k]){
                                node.data[k] = inputs.color[0][k];
                                n.controls.get(k).update();
                            }
                        });
                    }

                    var data = Object.assign({}, node.data);
                    delete data.values;

                    outputs.colorMap = data;
                    
                    outputs.colors = {
                        data: values.map(v=> data['field'+v]), 
                        value: null
                    }
                }
            }
        }
        class ColorRangeComponent extends Rete.Component {
            constructor(){
                super('Color Range')
                this.data.component = Node;
                this.path = ['Color'];
            }
            build(node){
                node
                    .addInput(new Rete.Input('nums', 'Num Values', numArrSocket))
                    .addControl(new TwoColorControl(this.editor, 'colors', node))
                    .addControl(new TwoRangeControl(this.editor, 'range', [0, 1], node))
                    .addOutput(new Rete.Output('color', 'Color', colorSocket));
            }
            worker(node, inputs, outputs){
                const range = node.data.range;
                const nums = inputs.nums[0];
                const diff = d3.max(nums) - d3.min(nums);
                const min = d3.min(nums) + (diff*range[0]);
                const max = d3.min(nums) + (diff*range[1]);
                const data = nums.map(d=> d > max ? max : d < min ? min : d );
                const color = d3.scaleLinear([min, max], node.data.colors);
                outputs.color = {
                    data: data.map(d=> color(d) ),
                    value: null
                }
            }
        }
        class ParseComponent extends Rete.Component {
            constructor(){
                super('Parse')
                this.data.component = Node;
                this.path = null;
            }
            builder(node){
                if(node.data.data.type === 'FeatureCollection'){
                    const props = node.data.data.features[0].properties;
                    let socket;
                    for(let key in props){
                        socket = isNaN(+ props[key]) ? strArrSocket : numArrSocket;
                        node.addOutput(new Rete.Output(key, key, socket));
                    }
                    const geometry = node.data.data.features[0].geometry.type;
                    socket = geometry === 'Point' ? pointGeometrySocket : geometry === 'LineString' ? lineGeometrySocket : polygonGeometrySocket;
                    node.addOutput(new Rete.Output('geom', 'Geometry', socket));
                }else if(node.data.data.nodes && node.data.data.links){
                    node
                        .addOutput(new Rete.Output('nodes', 'Nodes', nodesSocket))
                        .addOutput(new Rete.Output('links', 'Links', linksSocket));
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
                }else if(node.data.data.nodes && node.data.data.links){
                    outputs.nodes = node.data.data.nodes;
                    outputs.links = node.data.data.links;
                }else{
                   for(let key in node.data.data[0]){
                        outputs[key] = node.data.data.map(d=> !isNaN(+d[key]) ? +d[key] : d[key] );
                    } 
                }
            }
        }
        class DatasetComponent extends Rete.Component {
            constructor() {
                super('Dataset')
                this.data.component = Node;
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
                this.data.component = Node;
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
        class URLDataComponent extends Rete.Component {
            constructor(){
                super('Load from URL')
                this.data.component = Node;
                this.path = ['Data']
            }
            builder(node){
                node.addControl(new LoadControl(this.editor, 'url', 'data url'));
            }
            async worker(node){
                if(node.data.url){
                    let url = node.data.url;
                    if(!(url.endsWith('.csv') || url.endsWith('.json') || url.endsWith('.geojson'))) return;
                    url = url.startsWith('https') ? url : 'https://' + url;
                    const result = await d3.text(url);
                    const data = url.endsWith('.csv') ? await d3.csvParse(result) : JSON.parse(result);
                    const name = url.split('/').pop();

                    const component = new ParseComponent;
                    const parse = await component.createNode( {name: name, data: data} );
                    parse.position = node.position;
                    editor.addNode(parse);
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );
                }
            }
        }
        class RangeComponent extends Rete.Component {
            constructor(){
                super('Range')
                this.data.component = Node;
                this.path = []
            }
            build(node){
                node.addInput(new Rete.Input('nums', 'Num Values', numArrSocket));
                if(node.data.values){
                    node
                        .addControl(new TwoRangeControl(this.editor, 'domain', [node.data.domainFrom, node.data.domainTo], node))
                        .addControl(new TwoRangeControl(this.editor, 'range', [1, 30], node))
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
                this.data.component = Node;
                this.path = [];
            }
            builder(node){
                node.data.x = 5;
                node.data.y = 5;
                node.data.z = 0;
                
                const inX = new Rete.Input('x', 'X', numArrSocket);
                const inY = new Rete.Input('y', 'Y', numArrSocket);
                const inZ = new Rete.Input('z', 'Z', numArrSocket);

                inX.addControl(new NumControl(this.editor, 'x', node))
                inY.addControl(new NumControl(this.editor, 'y', node))
                inZ.addControl(new NumControl(this.editor, 'z', node))
                
                node
                    .addInput(inX).addInput(inY).addInput(inZ)
                    .addOutput(new Rete.Output('size', 'Size', sizeSocket));
            }
            worker(node, inputs, outputs){
                outputs['size'] = {
                    values: [],
                    params: null
                };
                const nums = inputs.x[0] || inputs.y[0] || inputs.z[0];
                if(nums){
                    outputs['size'].params = ['size', s=>{ return [ s.x, s.y, s.z ]; }]
                    for(let i=0; i < nums.length; i++){
                        outputs['size'].values.push({
                             x: inputs.x.length ? inputs.x[0][i] : node.data.x,
                             y: inputs.y.length ? inputs.y[0][i] : node.data.y,
                             z: inputs.z.length ? inputs.z[0][i] : node.data.z,  
                         }); 
                     }
                }else{
                    outputs['size'].params = [[node.data.x, node.data.y, node.data.z]]
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
                if(!values){
                    node.data.values = null;
                }else if( !node.data.values ||  (node.data.values && (JSON.stringify(node.data.values) != JSON.stringify([...new Set( values )])))){
                    const component = this.editor.components.get('Line Shape Category');
                    const colors = await component.createNode({ values: [...new Set( values )] });
                    colors.position = node.position;
                    this.editor.addNode(colors);
                    const key = inputs.strings.length ? 'strings' :  'nums';
                    const conn = node.inputs[key].connections[0];
                    const n = this.editor.nodes.find(n=> n.id === conn.node);
                    this.editor.connect(n.outputs.get( conn.output ), colors.inputs.get( key ));
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );

                    const outShapesConn = node.outputs['shapes'].connections[0];
                    if(outShapesConn){
                        const n = this.editor.nodes.find(n=> n.id === outShapesConn.node);
                        this.editor.connect(colors.outputs.get( 'shapes' ), n.inputs.get( outShapesConn.input ));
                    }
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
                if(!values){
                    node.data.values = null;
                }else if( !node.data.values ||  (node.data.values && (JSON.stringify(node.data.values) != JSON.stringify([...new Set( values )])))){
                    const component = this.editor.components.get('Point Shape Category');
                    const colors = await component.createNode({ values: [...new Set( values )] });
                    colors.position = node.position;
                    this.editor.addNode(colors);
                    const key = inputs.strings.length ? 'strings' :  'nums';
                    const conn = node.inputs[key].connections[0];
                    const n = this.editor.nodes.find(n=> n.id === conn.node);
                    this.editor.connect(n.outputs.get( conn.output ), colors.inputs.get( key ));
                    this.editor.removeNode( this.editor.nodes.find(n=>n.id === node.id) );

                    const outShapesConn = node.outputs['shapes'].connections[0];
                    if(outShapesConn){
                        const n = this.editor.nodes.find(n=> n.id === outShapesConn.node);
                        this.editor.connect(colors.outputs.get( 'shapes' ), n.inputs.get( outShapesConn.input ));
                    }
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
                this.data.component = Node;
                this.path = ['Layers']
            }
            build(node){
                node.data.shape = state.shapes[0];
                node.data.radius = 100;

                const radiusInput = new Rete.Input('radius','Radius', numArrSocket);
                radiusInput.addControl(new NumControl(this.editor, 'radius', node, 'radius'));

                node
                    .addInput(new Rete.Input('lat','Lat', numArrSocket))
                    .addInput(new Rete.Input('lon','Lon', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', pointGeometrySocket))
                    .addInput(new Rete.Input('colors', 'Color', colorSocket))
                    .addInput(radiusInput)
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if( (inputs.lat.length && inputs.lon.length) || inputs.geometry.length ){
                    let data = [];
                    if( (inputs.lat.length && inputs.lon.length) && 
                        inputs.lat[0].length === inputs.lon[0].length )
                    {
                        data = {
                            type: "FeatureCollection",
                            features: inputs.lat[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(inputs.radius.length ? {radius: inputs.radius[0][i]} : {}),
                                    ...(inputs.colors.length  ? inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {} : {}),
                                    
                                },
                                geometry: {
                                    type: "Point",
                                    coordinates: [inputs.lon[0][i], inputs.lat[0][i]]
                                }
                            }))
                        }
                    }else if(inputs.geometry.length){
                        data = {
                            type: "FeatureCollection",
                            features: inputs.geometry[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(inputs.radius.length ? {radius: inputs.radius[0][i]} : {}),
                                    ...(inputs.colors.length  ? inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {} : {}),
                                },
                                geometry: g 
                            }))
                        }
                    }
                    
                    outputs['layer'] = {
                        type: 'point',
                        data: data,
                        radius: inputs.radius.length ? null : node.data.radius,
                        color: inputs.colors.length ? inputs.colors[0].value : 'rgba(160, 160, 180, 250)',
                    };
                }
            }
        }
        class LineLayerComponent extends Rete.Component {
            constructor(){
                super('Line Layer')
                this.data.component = Node;
                this.path = ['Layers']
            }
            build(node){
                node.data.shape = state.lineShapes[0];

                node
                    .addInput(new Rete.Input('x','X', numArrSocket))
                    .addInput(new Rete.Input('x1','X1', numArrSocket))
                    .addInput(new Rete.Input('y','Y', numArrSocket))
                    .addInput(new Rete.Input('y1','Y1', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', lineGeometrySocket))
                    .addInput(new Rete.Input('colors', 'Color', colorSocket))
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
                        data = {
                            type: "FeatureCollection",
                            features: inputs.x[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(!inputs.colors.length  ? {} : inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {}),
                                },
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [inputs.x[0][i], inputs.y[0][i]],
                                        [inputs.x1[0][i], inputs.y1[0][i]]
                                    ]
                                }
                            }))
                        }
                    }else if(inputs.geometry.length){
                        data = {
                            type: "FeatureCollection",
                            features: inputs.geometry[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(!inputs.colors.length  ? {} : inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {}),
                                },
                                geometry: g 
                            }))
                        }
                    }
    
                    outputs['layer'] = {
                        type: 'line',
                        data: data,
                        color: inputs.colors.length ? inputs.colors[0].value : 'rgba(160, 160, 180, 250)',
                    };                    
                }
            }
        }
        class ArcLayerComponent extends Rete.Component {
            constructor(){
                super('Arc Layer')
                this.data.component = Node;
                this.path = ['Layers']
            }
            build(node){
                node.data.width = 2;
                const widthInput = new Rete.Input('width','Width', numArrSocket);
                widthInput.addControl(new NumControl(this.editor, 'width', node, 'width'));

                node
                    .addInput(new Rete.Input('x','X', numArrSocket))
                    .addInput(new Rete.Input('x1','X1', numArrSocket))
                    .addInput(new Rete.Input('y','Y', numArrSocket))
                    .addInput(new Rete.Input('y1','Y1', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', lineGeometrySocket))
                    .addInput(new Rete.Input('colors', 'Color', colorSocket))
                    .addInput(widthInput)
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if( (inputs.x.length && inputs.y.length && inputs.x1.length && inputs.y1.length) || inputs.geometry.length ){
                    let data = [];
                    console.log(inputs.colors)
                    if( (inputs.x.length && inputs.y.length && inputs.x1.length && inputs.y1.length) && 
                        (inputs.x[0].length === inputs.y[0].length) &&
                        (inputs.x[0].length === inputs.x1[0].length) &&
                        (inputs.x[0].length === inputs.y1[0].length) )
                    {   
                        data = {
                            type: "FeatureCollection",
                            features: inputs.x[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(!inputs.colors.length  ? {} : inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {}),
                                    ...(!inputs.width.length  ? {} : {width: inputs.width[0][i]}),
                                },
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [inputs.x[0][i], inputs.y[0][i]],
                                        [inputs.x1[0][i], inputs.y1[0][i]]
                                    ]
                                }
                            }))
                        }
                    }else if(inputs.geometry.length){
                        data = {
                            type: "FeatureCollection",
                            features: inputs.geometry[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(!inputs.colors.length  ? {} : inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {}),
                                    ...(!inputs.width.length  ? {} : {width: inputs.width[0][i]}),
                                },
                                geometry: g 
                            }))
                        }
                    }
    
                    outputs['layer'] = {
                        type: 'arc',
                        data: data,
                        width: inputs.width.length ? null : node.data.width,
                        color: inputs.colors.length ? inputs.colors[0].value : 'rgba(160, 160, 180, 250)'
                    };                    
                }
            }
        }
        class PolygonLayerComponent extends Rete.Component {
            constructor(){
                super('Polygon Layer')
                this.data.component = Node;
                this.path = ['Layers']
            }
            build(node){
                node.data.height = 30;
                const heightInput = new Rete.Input('height','Height', numArrSocket);
                heightInput.addControl(new NumControl(this.editor, 'height', node, 'height'))

                node
                    .addControl(new SelectControl(this.editor, 'shape', state.polygonShapes))
                    .addInput(new Rete.Input('colors', 'Colors', colorSocket))
                    .addInput(heightInput)
                    .addInput(new Rete.Input('geometry', 'Geometry', polygonGeometrySocket))
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if(inputs.geometry.length){
                    const data = {
                        type: "FeatureCollection",
                        features: inputs.geometry[0].map((g, i)=>({ 
                            type: "Feature",
                            properties: { 
                                ...(!inputs.colors.length  ? {} : inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {}),
                                ...(inputs.height.length ? {height: inputs.height[0][i]} : {}), 
                            },
                            geometry: g
                        }))
                    }
                    outputs['layer'] = {
                        type: 'polygon',
                        data: data,
                        extruded: node.data.shape === 'extrude',
                        color: inputs.colors.length ? inputs.colors[0].value : 'rgba(160, 160, 180, 250)',
                        height: inputs.height.length ? null : node.data.height
                    };
                }
            }
        }
        class GridMapLayerComponent extends Rete.Component {
            constructor(){
                super('GridMap Layer')
                this.data.component = Node;
                this.path = ['Layers']
            }
            build(node){
                node.data.extruded = true;
                node
                    .addControl(new SelectControl(this.editor, 'type', ['hexagon', 'grid']))
                    .addControl(new CheckBoxControl(this.editor, 'extruded', 'Extrude', node))
                    .addControl(new ColorRangeControl(this.editor, 'colorRange', node))
                    .addControl(new TwoRangeControl(this.editor, 'elevationRange', [0, 200000], node))
                    .addControl(new SelectControl(this.editor, 'colorAggMethod', ['SUM', 'MEAN', 'MIN', 'MAX']))
                    .addControl(new SelectControl(this.editor, 'elevationAggMethod', ['SUM', 'MEAN', 'MIN', 'MAX']))
                    .addInput(new Rete.Input('lat','Lat', numArrSocket))
                    .addInput(new Rete.Input('lon','Lon', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', pointGeometrySocket))
                    .addInput(new Rete.Input('elevation', 'Elevation', numArrSocket))
                    .addInput(new Rete.Input('color', 'Color', numArrSocket))
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if( (inputs.lat.length && inputs.lon.length) || inputs.geometry.length ){
                    
                    let data = [];
                    if( (inputs.lat.length && inputs.lon.length) && 
                    inputs.lat[0].length === inputs.lon[0].length )
                    {
                        data = {
                            type: "FeatureCollection",
                            features: inputs.lat[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(inputs.elevation.length ? {elevation: inputs.elevation[0][i]} : {}),
                                    ...(inputs.color.length ? {color: inputs.color[0][i]} : {}),
                                },
                                geometry: {
                                    type: "Point",
                                    coordinates: [inputs.lon[0][i], inputs.lat[0][i]]
                                }
                            }))
                        }

                    }else if(inputs.geometry.length){
                        data = {
                            type: "FeatureCollection",
                            features: inputs.geometry[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(inputs.elevation.length ? {elevation: inputs.elevation[0][i]} : {}),
                                    ...(inputs.color.length ? {color: inputs.color[0][i]} : {}),
                                },
                                geometry: g 
                            }))
                        }
                    }
                    outputs['layer'] = {
                        type: 'hexagon',
                        grid_type: node.data.type,
                        extruded: node.data.extruded,
                        colorRange: node.data.colorRange,
                        elevationRange: node.data.elevationRange,
                        colorAggMethod: node.data.colorAggMethod,
                        elevationAggMethod: node.data.elevationAggMethod,
                        data: data
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
                node.data.weight = 30;
                const weightInput = new Rete.Input('weight','Weight', numArrSocket);
                weightInput.addControl(new NumControl(this.editor, 'weight', node, 'weight'));

                node
                    .addInput(new Rete.Input('lat','Lat', numArrSocket))
                    .addInput(new Rete.Input('lon','Lon', numArrSocket))
                    .addInput(new Rete.Input('geometry', 'Geometry', pointGeometrySocket))
                    .addInput(weightInput)
                    .addInput(new Rete.Input('heatmap', 'Heatmap', heatMapSocket))
                    .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
            }
            worker(node, inputs, outputs){
                if( (inputs.lat.length && inputs.lon.length) || inputs.geometry.length ){
                    
                    let data = {};

                    if( (inputs.lat.length && inputs.lon.length) && 
                    inputs.lat[0].length === inputs.lon[0].length )
                    {
                        data = {
                            type: "FeatureCollection",
                            features: inputs.lat[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: { 
                                    ...(inputs.weight.length ? {weight: inputs.weight[0][i]} : {}),
                                },
                                geometry: {
                                    type: "Point",
                                    coordinates: [inputs.lon[0][i], inputs.lat[0][i]]
                                }
                            }))
                        }
                    }else if(inputs.geometry.length){
                        data = {
                            type: "FeatureCollection",
                            features: inputs.geometry[0].map((g, i)=>({ 
                                type: "Feature",
                                properties: {
                                    ...(inputs.weight.length ? {weight: inputs.weight[0][i]} : {}),
                                },
                                geometry: g 
                            }))
                        }
                    }

                    outputs['layer'] = {
                        type: 'heatmap',
                        data: data,
                        weight: inputs.weight.length ? null : node.data.weight,
                        radius: inputs.heatmap.length ? inputs.heatmap[0].radius : null,
                        intensity: inputs.heatmap.length ? inputs.heatmap[0].intensity : null,
                        threshold: inputs.heatmap.length ? inputs.heatmap[0].threshold : null,
                        colorRange: inputs.heatmap.length ? inputs.heatmap[0].colors : null
                    };
                }
            }
        }
        /*class GridComponent extends Rete.Component {
            constructor(){
                super('Grid')
                this.data.component = Node;
                this.path = []
            }
            builder(node){
                node.data.type = 'hexagon',
                node.data.method = 'sum',
                node.data.size = 1000;

                node
                    .addControl(new NumControl(this.editor, 'size', node, 'size'))
                    .addControl(new TwoRangeControl(this.editor, 'height', [0, 100000], node))
                    .addControl(new TwoColorControl(this.editor, 'colors', node))
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
        }*/
        class HeatMapComponent extends Rete.Component {
            constructor(){
                super('HeatMap')
                this.data.component = Node;
                this.path = []
            }
            builder(node){
                node.data.threshold = .2;
                node
                    .addControl(new NumControl(this.editor, 'intensity', node, 'intensity'))
                    .addControl(new NumControl(this.editor, 'radius', node, 'radius'))
                    .addControl(new RangeControl(this.editor, 'threshold', [0, 1], node))
                    .addControl(new ColorRangeControl(this.editor, 'colors', node))
                    .addOutput(new Rete.Output('heatmap', 'HeapMap', heatMapSocket));
            }
            worker(node, inputs, outputs){
                outputs.heatmap = {
                    intensity: node.data.intensity,
                    radius: node.data.radius,
                    threshold: node.data.threshold,
                    colors: node.data.colors
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
                node.addInput(new Rete.Input('layer0', 'layer', layerSocket));
                const inputs = node.data.inputs;
                if(inputs) inputs.forEach(input=>node.addInput(new Rete.Input(input, input, layerSocket)))
            }
            worker(node, inputs, outputs){
                if(!node.data.id){
                    state.ids.maps++;
                    node.data.id = state.ids.maps
                }
                node.data.layers = Object.values(inputs).map(input=>input[0]).filter(d=> d);
                
                const item = state.preview.find(d=>d.id === node.data.id);
                if(node.data.preview){
                    if(!item){
                        state.preview.push({id: node.data.id, name: node.data.name, layers: node.data.layers})
                    }else{
                        item.name = node.data.name;
                        item.layers = node.data.layers;
                    }
                }else{
                    if(item) state.preview.splice(state.preview.indexOf(item), 1);
                }

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
                const sizeInput = new Rete.Input('size','Size', numArrSocket);
                sizeInput.addControl(new NumControl(this.editor, 'size', node, 'size'))
                node
                    .addInput(new Rete.Input('x', 'X', numArrSocket))
                    .addInput(new Rete.Input('y', 'Y', numArrSocket))
                    .addInput(new Rete.Input('strx', 'X', strArrSocket))
                    .addInput(new Rete.Input('stry', 'Y', strArrSocket))
                    .addInput(new Rete.Input('colors', 'Colors', colorSocket))
                    .addInput(sizeInput)
                    .addInput(new Rete.Input('shapes', 'Shape by Cat', pointShapesSocket))
                    .addControl(new SelectControl(this.editor, 'shape', state.shapes));
            }
            worker(node, inputs, outputs){
                node.data.type = 'point';
                if((inputs.x.length || inputs.strx.length) && (inputs.y.length || inputs.stry.length)){

                    node.data.DATA = (inputs.x[0] || inputs.strx[0]).map((x, i)=> ({
                        x: inputs.x.length ? +inputs.x[0][i] : inputs.strx[0][i],
                        y: inputs.y.length ? +inputs.y[0][i] : inputs.stry[0][i],
                        ...(!inputs.colors.length  ? {} : inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {}),
                        ...(inputs.size.length ? {size: +inputs.size[0][i]} : {}),
                        ...(inputs.shapes.length ? {shape: inputs.shapes[0].field[i]}:{})
                    }));
                }
                // node.data.color = inputs.colors.length ? inputs.colors[0].params : null,
                node.data.color = inputs.colors.length ? inputs.colors[0].data ? ['color', d=>d] : [inputs.colors[0].value] : null,
                node.data.size = inputs.size.length ? ['size'] : node.data.size ? [node.data.size] : null;
                node.data.shape = inputs.shapes.length ? ['shape', s=>{ return inputs.shapes[0].shapes['field'+s] }] : [node.data.shape],
                
                this.editor.nodes.find(n=>n.id===node.id).update();
            }
        }
        // FORCES
        class ForceManyBodyComponent extends Rete.Component {
            constructor() {
                super('Force Many Body')
                this.data.component = Node;
                this.path = ['Force'];
            }
            builder(node){
                const strength = new Rete.Input('strength', 'Strength', numArrSocket);
                strength.addControl(new RangeControl(this.editor, 'strength', [-30, 30], node));

                node
                    .addInput(strength)
                    .addOutput(new Rete.Output('force', 'Force', forceManyBodySocket));
            }
            worker(node, inputs, outputs){
                outputs.force = {
                    strength: inputs.strength.length ? inputs.strength[0] : node.data.strength
                }
            }
        }
        class ForceRadialComponent extends Rete.Component {
            constructor() {
                super('Force Radial')
                this.data.component = Node;
                this.path = ['Force'];
            }
            builder(node){
                const strength = new Rete.Input('strength', 'Strength', numArrSocket);
                strength.addControl(new RangeControl(this.editor, 'strength', [0, 1], node));
                const radius = new Rete.Input('radius', 'Radius', numArrSocket);
                radius.addControl(new RangeControl(this.editor, 'radius', [0, 250], node));

                node
                    .addInput(strength).addInput(radius)
                    .addControl(new RangeControl(this.editor, 'x', [0, 500], node))
                    .addControl(new RangeControl(this.editor, 'y', [0, 500], node))
                    .addOutput(new Rete.Output('force', 'Force', forceRadialSocket));
            }
            worker(node, inputs, outputs){
                outputs.force = {
                    strength: inputs.strength.length ? inputs.strength[0] : node.data.strength,
                    radius: inputs.radius.length ? inputs.radius[0] : node.data.radius,
                    center: [node.data.x, node.data.y]
                }
            }
        }
        class ForceXComponent extends Rete.Component {
            constructor() {
                super('Force X')
                this.data.component = Node;
                this.path = ['Force'];
            }
            builder(node){
                const strength = new Rete.Input('strength', 'Strength', numArrSocket);
                strength.addControl(new RangeControl(this.editor, 'strength', [-1, 1], node));
                const x = new Rete.Input('x', 'X', numArrSocket);
                x.addControl(new RangeControl(this.editor, 'x', [0, 500], node));

                node
                    .addInput(strength).addInput(x)
                    .addOutput(new Rete.Output('force', 'Force', forceXSocket));
            }
            worker(node, inputs, outputs){
                outputs.force = {
                    strength: inputs.strength.length ? inputs.strength[0] : node.data.strength,
                    x: inputs.x.length ? inputs.x[0] : node.data.x
                }
            }
        }
        class ForceYComponent extends Rete.Component {
            constructor() {
                super('Force Y')
                this.data.component = Node;
                this.path = ['Force'];
            }
            builder(node){
                const strength = new Rete.Input('strength', 'Strength', numArrSocket);
                strength.addControl(new RangeControl(this.editor, 'strength', [-1, 1], node));
                const y = new Rete.Input('y', 'Y', numArrSocket);
                y.addControl(new RangeControl(this.editor, 'y', [0, 500], node));

                node
                    .addInput(strength).addInput(y)
                    .addOutput(new Rete.Output('force', 'Force', forceYSocket));
            }
            worker(node, inputs, outputs){
                outputs.force = {
                    strength: inputs.strength.length ? inputs.strength[0] : node.data.strength,
                    y: inputs.y.length ? inputs.y[0] : node.data.y
                }
            }
        }
        class LinksComponent extends Rete.Component {
            constructor() {
                super('Links')
                this.data.component = Node;
                this.path = [];
            }
            builder(node){
                const distance = new Rete.Input('distance', 'Distance', numArrSocket);
                distance.addControl(new RangeControl(this.editor, 'distance', [0, 100], node));

                node
                    .addInput(new Rete.Input('strSource', 'source', strArrSocket))
                    .addInput(new Rete.Input('intSource', 'source', numArrSocket))
                    .addInput(new Rete.Input('strTarget', 'target', strArrSocket))
                    .addInput(new Rete.Input('intTarget', 'target', numArrSocket))
                    .addControl(new RangeControl(this.editor, 'iterations', [1, 10], node))
                    .addInput(distance)
                    .addOutput(new Rete.Output('links', 'Links', linksSocket));
            }
            worker(node, inputs, outputs){
                if((inputs.strSource.length && inputs.strTarget.length) || (inputs.intSource.length && inputs.intTarget.length)){
                    outputs.links = {
                        iterations: node.data.iterations,
                        links: (inputs.strSource.length ? inputs.strSource[0] : inputs.intSource[0]).map((d,i)=>{
                            return {
                                source: d,
                                target: inputs.strTarget.length ? inputs.strTarget[0][i] : inputs.intTarget[0][i],
                                ldis: inputs.distance.length ? inputs.distance[i] : node.data.distance,
                            }
                        })
                    }
                }
                
            }
        }
        class GraphComponent extends Rete.Component {
            constructor() {
                super('Graph')
                this.data.component = GraphNode;
                this.path = [];
            }
            builder(node){
                node.data.radius = 10;
                const radius = new Rete.Input('radius', 'Radius', numArrSocket);
                radius.addControl(new NumControl(this.editor, 'radius', node, 'radius'));
                node
                    .addInput(new Rete.Input('strId', 'id', strArrSocket))
                    .addInput(new Rete.Input('intId', 'id', numArrSocket))
                    .addInput(new Rete.Input('x', 'Force X', forceXSocket))
                    .addInput(new Rete.Input('y', 'Force Y', forceYSocket))
                    .addInput(new Rete.Input('charge', 'Force Many Body', forceManyBodySocket))
                    .addInput(new Rete.Input('links', 'Links', linksSocket))
                    .addInput(new Rete.Input('radial', 'Force Radial', forceRadialSocket))
                    .addInput(new Rete.Input('colors', 'Colors', colorSocket))
                    .addInput(radius);
            }
            worker(node, inputs, outputs){
                if(inputs.strId.length || inputs.intId.length){
                    node.data.GRAPH = {
                        radialCenter: inputs.radial.length ? inputs.radial[0].center : [],
                        iterations: inputs.links.length ?  inputs.links[0].iterations : null,
                        ...(inputs.links.length ? {links: inputs.links[0].links} : {}),
                        nodes: (inputs.strId.length ? inputs.strId[0] : inputs.intId[0]).map((d, i)=>{
                            return {
                                id: d,
                                radius: inputs.radius.length ?  inputs.radius[0][i] : node.data.radius || null,
                                ...(inputs.colors.length ? inputs.colors[0].data ? {color: inputs.colors[0].data[i]} : {color: inputs.colors[0].value} : {color: null}),
                                ...(inputs.x.length ? inputs.x[0].strength.length ? {xstr: inputs.x[0].strength[i]} : {xstr: inputs.x[0].strength} : {xstr: null}),
                                ...(inputs.x.length ? inputs.x[0].x.length ? {xpos: inputs.x[0].x[i]} : {xpos: inputs.x[0].x} : {xpos: null}),
                                ...(inputs.y.length ? inputs.y[0].strength.length ? {ystr: inputs.y[0].strength[i]} : {ystr: inputs.y[0].strength} : {ystr: null}),
                                ...(inputs.y.length ? inputs.y[0].y.length ? {ypos: inputs.y[0].y[i]} : {ypos: inputs.y[0].y} : {ypos: null}),
                                ...(inputs.charge.length ? inputs.charge[0].strength.length ? {cstr: inputs.charge[0].strength[i]} : {cstr: inputs.charge[0].strength} : {cstr: null}),
                                ...(inputs.radial.length ? inputs.radial[0].strength.length ? {rstr: inputs.radial[0].strength[i]} : {rstr: inputs.radial[0].strength} : {rstr: null}),
                                ...(inputs.radial.length ? inputs.radial[0].radius.length ? {rad: inputs.radial[0].radius[i]} : {rad: inputs.radial[0].radius} : {rad: null}),
                                ...(inputs.radial.length ? inputs.radial[0].radius.length ? {rad: inputs.radial[0].radius[i]} : {rad: inputs.radial[0].radius} : {rad: null}),
                            }
                        })
                    }
                }else{
                    node.data.GRAPH = null;
                }
                this.editor.nodes.find(n=>n.id===node.id).update();
            }
        }

        var container = document.querySelector('#editor')
        var editor = new Rete.NodeEditor('demo@0.1.0', container)

        editor.use(VueRenderPlugin)
        editor.use(ConnectionPlugin)

        var engine = new Rete.Engine('demo@0.1.0')

        const components = [
            new DatasetComponent, new LoadDataComponent, new URLDataComponent,
            new ColorComponent, new ColorCategoryComponent, new ColorRangeComponent,
            new MultiplyComponent,
            new StrComponent, new NumComponent,
            new ParseComponent,

            new MapComponent,
            new PointLayerComponent, new LineLayerComponent,
            new PolygonLayerComponent, new HeatMapLayerComponent,
            new GridMapLayerComponent, new ArcLayerComponent,
            new HeatMapComponent,
            //new PointShapeCategoryComponent,
            //new LineShapeCategoryComponent,
            //new GridComponent,
            new RangeComponent, new SizeComponent, 
             
            new ScatterComponent,
            
            new GraphComponent,
            new LinksComponent,
            new ForceXComponent, new ForceYComponent,
            new ForceManyBodyComponent,
            new ForceRadialComponent
        ];

        components.map(c => {
            editor.register(c);
            engine.register(c);
        });

        editor.on('process connectioncreated connectionremoved nodecreated', async()=>{
            if(state.process)
                await engine.abort();
                await engine.process( editor.toJSON() )
        });
        editor.on('noderemove', (node)=>{
            if(state.process && node){
                if(node.data.preview){
                    const item = state.preview.find(d=>d.id === node.data.id);
                    state.preview.splice(state.preview.indexOf(item), 1);
                }
            }
        })

        document.addEventListener('keydown', async function (e){
            const node = editor.selected.list[0];
            if (e.key === "Delete"){
                editor.removeNode( node );
            }else if(e.ctrlKey && e.key.toLocaleLowerCase() === 'c'){
                state.copiedNode = node;
            }else if(e.ctrlKey && e.key.toLocaleLowerCase() === 'v'){
                if(state.copiedNode){
                    const component = editor.components.get( state.copiedNode.name );
                    const copy = await component.createNode( state.copiedNode.data );
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