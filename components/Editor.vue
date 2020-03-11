<template>
  <div>
    <div class="editor">
      <div id='editor'></div>
    </div>
  </div>
</template>
<script>
/* eslint-disable */
//import '@babel/polyfill'
import Rete from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import VueRenderPlugin from 'rete-vue-render-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin';

import VueNumControl from '~/components/VueNumControl'

export default {
  methods:{
    async initRete(){
      const vm = this;
      const numSocket = new Rete.Socket('Number value');

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
            vm.$emit('size', node.data.num)
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
      new AddComponent
    ];

    components.map(c => {
      editor.register(c);
      engine.register(c);
    });

    await editor.fromJSON({
      "id": "demo@0.1.0",
      "nodes": {
          "1": {
            "id": 1,
            "data": {
                "num": 2
            },
            "inputs": {},
            "outputs": {
                "num": {
                  "connections": []
                }
            },
            "position": [80, 200],
            "name": "Number"
          }
      }
    });

    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
      await engine.abort()
      await engine.process(editor.toJSON())
    })
    }
  },
  mounted(){
    this.initRete();
  }
}
</script>
<style>
.editor{
    width: 100%;
    height: 500px;
  }
  #editor{
    height: 500px;
  }
</style>