import Vue from 'vue'
import Vuex from 'vuex'

import Rete from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import VueRenderPlugin from 'rete-vue-render-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin';

import VueNumControl from '~/components/VueNumControl'

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
        const store = this;

        const numSocket = new Rete.Socket('Number');
        const objSocket = new Rete.Socket('Object');
        const boolSocket = new Rete.Socket('Bool');
        const anySocket = new Rete.Socket('Any');

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

        class NumComponent extends Rete.Component {

            constructor(){
                super("Number");
            }

            builder(node) {
                var out1 = new Rete.Output('num', "Number", numSocket);
                node.addControl(new NumControl(this.editor, 'num')).addOutput(out1);
            }

            worker(node, inputs, outputs) {
                outputs['num'] = node.data.num;
            }
        }

        class InputComponent extends Rete.Component {

            constructor(){
                super("Input");
            }

            builder(node) {
                node
                .addOutput(new Rete.Output('chart', "Chart", objSocket))
                .addOutput(new Rete.Output('value', "Value", anySocket));
            }

            worker(node, inputs, outputs) {
                outputs['value'] = node.data.value;
                outputs['chart'] = node.data.chart;
            }
        }

        class OutputComponent extends Rete.Component {

            constructor(){
                super("Output");
            }

            builder(node) {
                node
                .addInput(new Rete.Input('value', "Value", boolSocket));
            }

            worker(node, inputs, outputs) {
                if(inputs['value']){
                    node.data.result = inputs['value'];
                }
            }
        }

        class PrinterComponent extends Rete.Component {
            constructor( ) {
            super('Printer')
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
                //return ['Submenu'];
                return [];
            },
            rename(component) {
                return component.name;
            },
            items: {
                //'Click me'(){ console.log('Works!') }
            }
        });

        var engine = new Rete.Engine('demo@0.1.0')

        const components = [
            new PrinterComponent, 
            new NumComponent,
            new AddComponent,
            new InputComponent,
            new OutputComponent
        ];

        components.map(c => {
            editor.register(c);
            engine.register(c);
        });

        this.state.engine = engine;
        this.state.editor = editor;

        editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
            await engine.abort();
            await engine.process(editor.toJSON());
            console.log(editor.toJSON())
        })
      }
  }
})

export default store