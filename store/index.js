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
    functions: {}
  },
  mutations: {
    initRete(){
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
        

        class InputComponent extends Rete.Component {
            constructor(){
                super("Input");
                this.path = null
            }

            builder(node) {
                node
                    .addOutput(new Rete.Output('chart', "Chart", objSocket))
                    .addOutput(new Rete.Output('value', "Value", objSocket));
            }

            worker(node, inputs, outputs) {
                outputs['value'] = node.data.value;
                outputs['chart'] = node.data.chart;
            }
        }


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

        class OutputComponent extends Rete.Component {

            constructor(){
                super("Output");
                this.path = null
            }

            builder(node) {
                node
                .addInput(new Rete.Input('value', "Value", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['value']){
                    node.data.result = inputs['value'][0];
                }
            }
        }

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
            // items: {'Click me'(){ console.log('Works!') }}
        });

        var engine = new Rete.Engine('demo@0.1.0')

        const components = [
            new PrintNumComponent,
            new PrintAnyComponent,
            new NumComponent,
            new StrComponent,
            new AddComponent,
            new MoreComponent,
            new GetComponent,
            new InputComponent,
            new AnyToNumComponent,
            new OutputComponent
        ];

        components.map(c => {
            editor.register(c);
            engine.register(c);
        });

        this.state.engine = engine;
        this.state.editor = editor;

        // editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        //     await engine.abort();
        //     await engine.process(editor.toJSON());
        //     console.log(editor.toJSON())
        // })
      }
  }
})

export default store