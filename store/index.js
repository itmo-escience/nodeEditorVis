import Vue from 'vue'
import Vuex from 'vuex'

import Rete from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import VueRenderPlugin from 'rete-vue-render-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin';

import G2 from '@antv/g2';
import DataSet from '@antv/data-set';

import * as d3 from "d3";

import VueNumControl from '~/components/VueNumControl'
import VueStrControl from '~/components/VueStrControl'
import VueSelectControl from '~/components/VueSelectControl'
import VueColorControl from '~/components/VueColorControl'

import ChartNode from '~/components/ChartNode'
import FieldsNode from '~/components/FieldsNode'
import MapNode from '~/components/MapNode'

Vue.use(Vuex)

const store = () => new Vuex.Store({

  state: {
    editor: null,
    engine: null,
    result: null,
    layouts: {},
    data: {},
    freez: false
  },
  mutations: {
    freezEditor(state, freez){
        state.freez = freez;
    },
    initRete(state){
        const numSocket = new Rete.Socket('Number');
        const objSocket = new Rete.Socket('Object');
        const boolSocket = new Rete.Socket('Bool');
        const anySocket = new Rete.Socket('Any');
        const strSocket = new Rete.Socket('String');
        const flowSocket = new Rete.Socket('Flow');
        const sizeSocket = new Rete.Socket('Size');

        class ColorControl extends Rete.Control {
            constructor(emitter, key, freez){
                super(key);
                this.render = 'vue';
                this.component = VueColorControl;
                this.props = { emitter, ikey: key, freez: freez};
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
        
        // Input
        class InputFilterComponent extends Rete.Component {
            constructor(){
                super("Input Filter");
                this.path = null
            }

            builder(node) {
                node.addOutput(new Rete.Output('flow', 'Flow', flowSocket));
                for(let key in node.data){
                    let socket;
                    switch(typeof node.data[key]){
                        case 'boolean':
                            socket = boolSocket;
                            break
                        case 'number':
                            socket = numSocket;
                            break
                        case 'object':
                            socket = objSocket;
                            break
                        case 'string':
                            socket = strSocket;
                            break
                        default:
                            socket = anySocket;
                    }
                    node.addOutput(new Rete.Output(key, key, socket));
                }
            }

            worker(node, inputs, outputs) {
                outputs['flow'] = true;
                for(let key in node.data){
                    outputs[key] = node.data[key];
                }
            }
        }
        class InputMapComponent extends Rete.Component {
            constructor(){
                super("Input Map");
                this.path = null
            }

            builder(node) {
                node
                    .addOutput(new Rete.Output('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('row', 'Row', objSocket));
            }

            worker(node, inputs, outputs) {
                outputs['row'] = node.data;
                outputs['flow'] = true;
            }
        }

        //  OUTPUT
        class OutputFilterComponent extends Rete.Component {
            constructor(){
                super("Output Filter");
                this.path = null
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('value', "Value", boolSocket));

            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true && inputs['value']){
                    node.data.result = inputs['value'][0];
                    state.result = inputs['value'][0];
                }
            }
        }
        class OutputMapComponent extends Rete.Component {
            constructor(){
                super("Output Map");
                this.path = null
            }

            builder(node) {
                node
                .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                .addInput(new Rete.Input('row', "Row", objSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true && inputs['row'].length){
                    node.data = inputs['row'][0];
                    state.result = inputs['row'][0];
                }
            }
        }
        

        // PRINT
        class PrintAnyComponent extends Rete.Component {
            constructor( ) {
                super('Print Any')
                this.path = ['Print']
            }
        
            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('any', 'Any', anySocket));
            }
        
            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true) console.log(inputs['any'][0]);
            }
        }
        class PrintNumComponent extends Rete.Component {
            constructor() {
                super('Print Num')
                this.path = ['Print']
            }
        
            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('num', 'Number', numSocket));
            }
        
            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true) console.log(inputs['num'][0]);
            }
        }
        class PrintStrComponent extends Rete.Component {
            constructor() {
                super('Print String')
                this.path = ['Print']
            }
        
            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('str', 'String', strSocket));
            }
        
            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true) console.log(inputs['str'][0]);
            }
        }
        class PrintObjComponent extends Rete.Component {
            constructor() {
                super('Print Object')
                this.path = ['Print']
            }
        
            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('obj', 'Object', objSocket));
            }
        
            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true) console.log(inputs['obj'][0]);
            }
        }

        // OBJECT
        class GetComponent extends Rete.Component {
            constructor(){
                super("Get");
                this.path = ['Object']
            }

            builder(node) {
                let key = new Rete.Input('key', "Key", strSocket);
                key.addControl(new StrControl(this.editor, 'key', 'key'));

                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(key)
                    .addInput(new Rete.Input('obj', "Object", objSocket))
                    .addOutput(new Rete.Output('val', "Value", anySocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'] === true){
                   let key = inputs['key'].length ? inputs['key'][0] : node.data.key;
                    outputs.val = inputs.obj[0][key]; 
                }
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class SetComponent extends Rete.Component {
            constructor(){
                super("Set");
                this.path = ['Object']
            }

            builder(node) {
                let key = new Rete.Input('key', "Key", strSocket);
                key.addControl(new StrControl(this.editor, 'key', 'key'));

                let value = new Rete.Input('val', "Value", strSocket);
                value.addControl(new StrControl(this.editor, 'val', 'value'));

                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(key)
                    .addInput(value)
                    .addInput(new Rete.Input('inObj', "Object", objSocket))
                    .addOutput(new Rete.Output('outObj', "Object", objSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true){
                    let key = inputs['key'].length ? inputs['key'][0] : node.data.key;
                    let val = inputs['val'].length ? inputs['val'][0] : node.data.val;
                    inputs.inObj[0][key] = val;
                    outputs.outObj = inputs.inObj[0];
                }
                outputs['outflow'] = inputs['flow'][0];
            }
        }

        // CONVERT
        class AnyToNumComponent extends Rete.Component {
            constructor(){
                super("Any to Num");
                this.path = ['Convert']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('any', "Any", anySocket))
                    .addOutput(new Rete.Output('num', "Num", numSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true) outputs.num = +inputs.any[0];
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class AnyToStrComponent extends Rete.Component {
            constructor(){
                super("Any to String");
                this.path = ['Convert']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('any', "Any", anySocket))
                    .addOutput(new Rete.Output('str', "String", strSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true){
                    let val = inputs.any[0];
                    outputs.str = typeof val === 'string' ? val : ''; 
                }
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class AnyToObjComponent extends Rete.Component {
            constructor(){
                super("Any to Object");
                this.path = ['Convert']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('any', "Any", anySocket))
                    .addOutput(new Rete.Output('obj', "Object", objSocket));
            }

            worker(node, inputs, outputs){
                if(inputs['flow'][0] === true){
                    let val = inputs.any[0];
                    outputs.obj = typeof val === 'object' ? val : null; 
                }
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class StrToNumComponent extends Rete.Component {
            constructor(){
                super("String to Num");
                this.path = ['Convert']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('str', "String", strSocket))
                    .addOutput(new Rete.Output('num', "Num", numSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true) outputs.num = +inputs.str[0];
                outputs['outflow'] = inputs['flow'][0];
            }
        }

        // LOGIC
        class MoreComponent extends Rete.Component {
            constructor(){
                super("More");
                this.path = ['Logic']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('value1', "Value1", numSocket))
                    .addInput(new Rete.Input('value2', "Value2", numSocket))
                    .addOutput(new Rete.Output('result', "Result", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true && inputs['value1'].length && inputs['value2'].length){
                    outputs.result = inputs['value1'][0] > inputs['value2'][0];
                }
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class NoComponent extends Rete.Component {
            constructor(){
                super("NO");
                this.path = ['Logic']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('val', "Value", bolSocket))
                    .addOutput(new Rete.Output('result', "Result", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true && inputs['val']){
                    outputs.result = !inputs['val'][0];
                }
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class AndComponent extends Rete.Component {
            constructor(){
                super("And");
                this.path = ['Logic']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('value1', "Value1", boolSocket))
                    .addInput(new Rete.Input('value2', "Value2", boolSocket))
                    .addOutput(new Rete.Output('result', "Result", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true && inputs['value1'].length && inputs['value2'].length){
                    outputs.result = inputs['value1'][0] && inputs['value2'][0];
                }
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class OrComponent extends Rete.Component {
            constructor(){
                super("OR");
                this.path = ['Logic']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('value1', "Value1", boolSocket))
                    .addInput(new Rete.Input('value2', "Value2", boolSocket))
                    .addOutput(new Rete.Output('result', "Result", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0] === true && inputs['value1'].length && inputs['value2'].length){
                    outputs.result = inputs['value1'][0] || inputs['value2'][0];
                }
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class BranchComponent extends Rete.Component {
            constructor(){
                super("Branch");
                this.path = []
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('true', 'True', flowSocket))
                    .addOutput(new Rete.Output('false', 'False', flowSocket))
                    .addInput(new Rete.Input('val', "Value1", boolSocket));
            }

            worker(node, inputs, outputs){
                if(inputs['flow'][0]===true){
                    outputs.true = inputs['val'][0];
                    outputs.false = !inputs['val'][0];
                }
            }
        }

        // MATH
        class AddComponent extends Rete.Component {
            constructor( ) {
                super('Add')
                this.path = ['Math']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('num1', 'Number', numSocket))
                    .addInput(new Rete.Input('num2', 'Number', numSocket))
                    .addOutput(new Rete.Output('result', 'Number', numSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true) outputs['result'] = inputs['num1'] + inputs['num2'];
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class SubtractComponent extends Rete.Component {
            constructor( ) {
                super('Subtract')
                this.path = ['Math']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('num1', 'Number', numSocket))
                    .addInput(new Rete.Input('num2', 'Number', numSocket))
                    .addOutput(new Rete.Output('result', 'Number', numSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true) outputs['result'] = inputs['num1'] - inputs['num2'];
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class DivideComponent extends Rete.Component {
            constructor( ) {
                super('Divide')
                this.path = ['Math']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('num1', 'Number', numSocket))
                    .addInput(new Rete.Input('num2', 'Number', numSocket))
                    .addOutput(new Rete.Output('result', 'Number', numSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true) outputs['result'] = inputs['num1'] / inputs['num2'];
                outputs['outflow'] = inputs['flow'][0];
            }
        }
        class MultiplyComponent extends Rete.Component {
            constructor( ) {
                super('Multiply')
                this.path = ['Math']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('flow', 'Flow', flowSocket))
                    .addOutput(new Rete.Output('outflow', 'Flow', flowSocket))
                    .addInput(new Rete.Input('num1', 'Number', numSocket))
                    .addInput(new Rete.Input('num2', 'Number', numSocket))
                    .addOutput(new Rete.Output('result', 'Number', numSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['flow'][0]===true) outputs['result'] = inputs['num1'] * inputs['num2'];
                outputs['outflow'] = inputs['flow'][0];
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

        // BREAK
        class BreakComponent extends Rete.Component {
            constructor(){
                super("Break");
                this.path = []
            }

            builder(node) {
                node.addInput(new Rete.Input('obj', "Object", objSocket));
            }

            worker(node, inputs, outputs){
                node.data.obj = inputs['obj'][0];
            }
        }
        class ValuesComponent extends Rete.Component {
            constructor(){
                super("Values");
                this.path = null;
            }

            builder(node) {
                node.addInput(new Rete.Input('obj', "Object", objSocket));
                for(let key in node.data){
                    let socket;
                    switch(typeof node.data[key]){
                        case 'boolean':
                            socket = boolSocket;
                            break
                        case 'number':
                            socket = numSocket;
                            break
                        case 'object':
                            socket = objSocket;
                            break
                        case 'string':
                            socket = strSocket;
                            break
                        default:
                            socket = anySocket;
                    }
                    node.addOutput(new Rete.Output(key, key, socket));
                }
            }

            worker(node, inputs, outputs){
                for(let key in node.data){
                    outputs[key] = node.data[key];
                }
            }
        }
        class ColorComponent extends Rete.Component {
            constructor(){
                super('Color')
                this.path = [];
            }
            builder(node){
                node
                    .addControl(new ColorControl(this.editor, 'color', 'freez'))
                    .addOutput(new Rete.Output('color', 'Color', strSocket));
            }
            worker(node, inputs, outputs){
                state.freez = node.data.freez;
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
        class DatasetComponent extends Rete.Component {
            constructor() {
                super('Dataset')
                this.path = null;
            }
            builder(node){
                node
                    .addControl(new SelectControl( this.editor, 'dataset', node.data.options ))
                    .addOutput(new Rete.Output( 'data', 'Data', objSocket ));
            }
            worker(node, inputs, outputs){
                outputs['data'] = state.data[ node.data.dataset ]; 
            }
        }
        class SizeComponent extends Rete.Component {
            constructor(){
                super('Size')
                this.path = [];
            }
            builder(node){
                node.addInput(new Rete.Input('field', 'Field', strSocket))
                    .addControl(new NumControl(this.editor, 'from', 'from'))
                    .addControl(new NumControl(this.editor, 'to', 'to'))
                    .addOutput(new Rete.Output('size', 'Size', sizeSocket));
            }
            worker(node, inputs, outputs){
                outputs['size'] = {
                    from: node.data.from,
                    to: node.data.to,
                    field: inputs.field[0]
                }
            }
        }
        class MapComponent extends Rete.Component {
            constructor(){
                super('Map')
                this.data.component = MapNode;
                this.path = [];
            }
            builder(node){
                node
                    .addInput(new Rete.Input('data','Data', objSocket))
                    .addInput(new Rete.Input('lat','Lat', strSocket))
                    .addInput(new Rete.Input('lon','Lon', strSocket))
                    .addInput(new Rete.Input('color','Color', strSocket))
                    .addInput(new Rete.Input('size','Size', sizeSocket));
            }
            worker(node, inputs, outputs){
                node.data.data = inputs.data[0];
                node.data.lat = inputs.lat[0];
                node.data.lon = inputs.lon[0];
                node.data.color = inputs.color[0];
                node.data.size = inputs.size[0];
            }
        }
        class ChartComponent extends Rete.Component {
            constructor() {
                super('Chart')
                this.data.component = ChartNode;
                this.path = [];
            }
            builder(node){
                node
                    .addControl(new SelectControl( this.editor, 'type', ['area', 'point', 'line'] ))
                    .addInput(new Rete.Input('width', 'Width', numSocket))
                    .addInput(new Rete.Input('height', 'Height', numSocket))
                    .addInput(new Rete.Input('x', 'X', strSocket))
                    .addInput(new Rete.Input('y', 'Y', strSocket))
                    .addInput(new Rete.Input('color', 'Color', strSocket))
                    .addInput(new Rete.Input('data', 'Data', objSocket));
            }
            worker(node, inputs, outputs){
                node.data.width = inputs.width[0];
                node.data.height = inputs.height[0];
                node.data.x = inputs.x.length ? inputs.x[0] : node.data.x;
                node.data.y = inputs.y.length ? inputs.y[0] : node.data.y;
                node.data.color = inputs.color.length ? inputs.color[0] : node.data.color;
                node.data.DATA = inputs.data[0];
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
            nodeItems: node => {
                if (node.name === 'Dataset') {
                    return {
                        async 'Fields'(){ 
                            const component = new FieldsComponent;
                            const fields = await component.createNode( state.data[ node.data.dataset ] );
                            fields.position = [node.position[0]+250, node.position[1] ];
                            editor.addNode(fields);
                            editor.connect(node.outputs.get('data'), fields.inputs.get('data'));
                        },
                    }
                }
            }
        });

        var engine = new Rete.Engine('demo@0.1.0')

        const components = [
            // new PrintNumComponent, new PrintAnyComponent,
            // new PrintStrComponent, new PrintObjComponent,
            // new AddComponent, new SubtractComponent,
            // new DivideComponent, new MultiplyComponent,
            // new BranchComponent,
            // new BreakComponent, new ValuesComponent,
            // new MoreComponent, new NoComponent,
            // new OrComponent, new AndComponent,
            // new GetComponent, new SetComponent,
            // new AnyToNumComponent, new AnyToStrComponent,
            // new AnyToObjComponent, new StrToNumComponent,
            // new InputFilterComponent, new InputMapComponent,
            // new OutputFilterComponent, new OutputMapComponent,
            new ColorComponent,
            new StrComponent, new NumComponent,
            new DatasetComponent, new ChartComponent,
            new FieldsComponent,
            new MapComponent,
            new SizeComponent,
        ];

        components.map(c => {
            editor.register(c);
            engine.register(c);
        });

        editor.on('process connectioncreated', async()=>{
            await engine.abort();
            await engine.process( editor.toJSON() )
        });
        editor.on('nodetranslate', ({ node, x, y })=>{
            return !state.freez
        });
        // editor.on('connectioncreated', async (conn)=>{
        //     if(conn.input.node.name === 'Break' || conn.output.node.name === 'Break'){
        //         const inp = conn.input.node.name === 'Break' ? conn.input : conn.output;
        //         const out = conn.input.node.name === 'Break' ? conn.output : conn.input;
                
        //         const component = new ValuesComponent;
        //         const val = await component.createNode( out.node.data );
                
        //         val.position = inp.node.position;

        //         editor.removeNode(inp.node);
        //         editor.addNode(val);
                
        //         editor.connect(out.node.outputs.get(out.key), val.inputs.get('obj'));
        //     }
        // });

        this.state.engine = engine;
        this.state.editor = editor;
      }
  }
})

export default store