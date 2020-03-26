import Vue from 'vue'
import Vuex from 'vuex'

import Rete from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import VueRenderPlugin from 'rete-vue-render-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin';

import VueNumControl from '~/components/VueNumControl'
import VueStrControl from '~/components/VueStrControl'

Vue.use(Vuex)

const store = () => new Vuex.Store({

  state: {
    editor: null,
    engine: null,
    result: null,
    layouts: {}
  },
  mutations: {
    initRete(state){
        const numSocket = new Rete.Socket('Number');
        const objSocket = new Rete.Socket('Object');
        const boolSocket = new Rete.Socket('Bool');
        const anySocket = new Rete.Socket('Any');
        const strSocket = new Rete.Socket('String');

        class NumControl extends Rete.Control {
            constructor(emitter, key, readonly) {
                super(key);
                this.render = 'vue';
                this.component = VueNumControl;
                this.props = { emitter, ikey: key, readonly };
            }

            setValue(val) {
                this.vueContext.value = val;
            }
        }
        class StrControl extends Rete.Control {
            constructor(emitter, key, readonly) {
                super(key);
                this.render = 'vue';
                this.component = VueStrControl;
                this.props = { emitter, ikey: key, readonly };
            }

            setValue(val) {
                this.vueContext.value = val;
            }
        }

        class NumComponent extends Rete.Component {
            constructor(){
                super("Number");
                this.path = ['Const']
            }

            builder(node) {
                var out1 = new Rete.Output('num', "Number", numSocket);
                node.addControl(new NumControl(this.editor, 'num')).addOutput(out1);
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
        
        // Input
        class InputFilterComponent extends Rete.Component {
            constructor(){
                super("Input Filter");
                this.path = null
            }

            builder(node) {
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
                node.addOutput(new Rete.Output('row', 'Row', objSocket));
            }

            worker(node, inputs, outputs) {
                outputs['row'] = node.data;
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
                .addInput(new Rete.Input('value', "Value", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['value']){
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
                .addInput(new Rete.Input('row', "Row", objSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['row'].length){
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
                node.addInput(new Rete.Input('any', 'Any', anySocket));
            }
        
            worker(node, inputs, outputs) {
                console.log(inputs['any'][0])
            }
        }
        class PrintNumComponent extends Rete.Component {
            constructor() {
                super('Print Num')
                this.path = ['Print']
            }
        
            builder(node) {
                let inp = new Rete.Input('num', 'Number', numSocket);
                node.addInput(inp);
            }
        
            worker(node, inputs, outputs) {
                console.log(inputs['num'][0])
            }
        }
        class PrintStrComponent extends Rete.Component {
            constructor() {
                super('Print String')
                this.path = ['Print']
            }
        
            builder(node) {
                let inp = new Rete.Input('str', 'String', strSocket);
                node.addInput(inp);
            }
        
            worker(node, inputs, outputs) {
                console.log(inputs['str'][0])
            }
        }
        class PrintObjComponent extends Rete.Component {
            constructor() {
                super('Print Object')
                this.path = ['Print']
            }
        
            builder(node) {
                let inp = new Rete.Input('obj', 'Object', objSocket);
                node.addInput(inp);
            }
        
            worker(node, inputs, outputs) {
                console.log(inputs['obj'][0])
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
                key.addControl(new StrControl(this.editor, 'key'));

                node
                    .addInput(key)
                    .addInput(new Rete.Input('obj', "Object", objSocket))
                    .addOutput(new Rete.Output('val', "Value", anySocket));
            }

            worker(node, inputs, outputs) {
                let key = inputs['key'].length ? inputs['key'][0] : node.data.key;
                outputs.val = inputs.obj[0][key];
            }
        }
        class SetComponent extends Rete.Component {
            constructor(){
                super("Set");
                this.path = ['Object']
            }

            builder(node) {
                let key = new Rete.Input('key', "Key", strSocket);
                key.addControl(new StrControl(this.editor, 'key'));

                let value = new Rete.Input('val', "Value", strSocket);
                value.addControl(new StrControl(this.editor, 'val'));

                node
                    .addInput(key)
                    .addInput(value)
                    .addInput(new Rete.Input('inObj', "Object", objSocket))
                    .addOutput(new Rete.Output('outObj', "Object", objSocket));
            }

            worker(node, inputs, outputs) {
                let key = inputs['key'].length ? inputs['key'][0] : node.data.key;
                let val = inputs['val'].length ? inputs['val'][0] : node.data.val;
                inputs.inObj[0][key] = val;
                outputs.outObj = inputs.inObj[0];
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
                    .addInput(new Rete.Input('any', "Any", anySocket))
                    .addOutput(new Rete.Output('num', "Num", numSocket));
            }

            worker(node, inputs, outputs) {
                outputs.num = +inputs.any[0];
            }
        }
        class StrToNumComponent extends Rete.Component {
            constructor(){
                super("String to Num");
                this.path = ['Convert']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('str', "String", strSocket))
                    .addOutput(new Rete.Output('num', "Num", numSocket));
            }

            worker(node, inputs, outputs) {
                outputs.num = +inputs.str[0];
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
                    .addInput(new Rete.Input('value1', "Value1", numSocket))
                    .addInput(new Rete.Input('value2', "Value2", numSocket))
                    .addOutput(new Rete.Output('result', "Result", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['value1'].length && inputs['value2'].length){
                    outputs.result = inputs['value1'][0] > inputs['value2'][0];
                }
            }
        }
        class AndComponent extends Rete.Component {
            constructor(){
                super("And");
                this.path = ['Logic']
            }

            builder(node) {
                node
                    .addInput(new Rete.Input('value1', "Value1", boolSocket))
                    .addInput(new Rete.Input('value2', "Value2", boolSocket))
                    .addOutput(new Rete.Output('result', "Result", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['value1'].length && inputs['value2'].length){
                    outputs.result = inputs['value1'][0] && inputs['value2'][0];
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
                node.addInput(new Rete.Input('num1', 'Number', numSocket));
                node.addInput(new Rete.Input('num2', 'Number', numSocket));
                
                node.addOutput(new Rete.Output('result', 'Number', numSocket));
            }

            worker(node, inputs, outputs) {
                outputs['result'] = inputs['num1'] + inputs['num2'];
            }
        }
        class SubtractComponent extends Rete.Component {
            constructor( ) {
                super('Subtract')
                this.path = ['Math']
            }

            builder(node) {
                node.addInput(new Rete.Input('num1', 'Number', numSocket));
                node.addInput(new Rete.Input('num2', 'Number', numSocket));
                
                node.addOutput(new Rete.Output('result', 'Number', numSocket));
            }

            worker(node, inputs, outputs) {
                outputs['result'] = inputs['num1'] - inputs['num2'];
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
            }
        });

        var engine = new Rete.Engine('demo@0.1.0')

        const components = [
            new PrintNumComponent, new PrintAnyComponent,
            new PrintStrComponent, new PrintObjComponent,
            new NumComponent, new StrComponent,
            new AddComponent, new SubtractComponent,
            new MoreComponent, new AndComponent,
            new GetComponent, new SetComponent,
            new AnyToNumComponent, new StrToNumComponent,
            new InputFilterComponent, new InputMapComponent,
            new OutputFilterComponent, new OutputMapComponent
        ];

        components.map(c => {
            editor.register(c);
            engine.register(c);
        });

        editor.on('showcontextmenu', ({ e, node }) => {
            return node && !(node.name.includes('Input')  || node.name.includes('Output'));
        });

        this.state.engine = engine;
        this.state.editor = editor;
      }
  }
})

export default store