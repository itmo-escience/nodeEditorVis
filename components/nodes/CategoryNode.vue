<template>
    <div class="node" :class="[selected(), node.name] | kebab">
        <!--- hide title <div class="title">{{node.name}}</div> -->
        <div class="d-flex space-between">
            <div>
                <div class="input d-flex align-center" v-for="input in inputs()" :key="input.key">
                    <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
                    <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
                    <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
                </div>
            </div>
            <!-- Outputs-->
            <div>
                <div class="output d-flex justify-end align-center" v-for="output in outputs()" :key="output.key">
                    <div class="fields-output-title">{{output.name}}</div>
                    <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
                </div>
            </div>
        </div>

        <div v-if="node.data.values" class="mrr-20 mrl-20">
            <div v-for="value in node.data.values" class="d-flex align-center mrv-10" :key="value">
                <Control :emitter="editor" :node="node" :ikey="value" />
                <div>{{ value ? (value.length > 15 ? value.toString().slice(0,15)+'...' : value.toString().slice(0,15)) : 'Null'  }}</div>
            </div>
        </div>
    </div>
</template>
<script>
    import VueClosedColorControl from '~/components/controls/VueClosedColorControl.vue'

    import VueRenderPlugin from 'rete-vue-render-plugin'
    export default{
        mixins: [VueRenderPlugin.mixin],
        components:{ Socket: VueRenderPlugin.Socket, Control: VueClosedColorControl },
        data(){ 
            return {
                colors: null
            }
        },
        updated(){
            const colors = JSON.stringify( Object.values(this.node.data.colors ));
            if(colors != this.colors){
                this.editor.nodeId = this.node.id;
                this.editor.trigger('process');

                this.colors = colors;
            }
        }
    }
</script>