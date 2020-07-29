export default class Engine {
    constructor(components){
        this.components = new Map();
        components.forEach(component=> this.components.set(component.name, component) );

        this.editor = null;
        this.args = null;
        this.nodes = {};
    }
    async processNode(node){

        let NODE = this.nodes[node.id];
        
        if(!NODE) NODE = this.nodes[node.id] = { id: node.id };
        
        if(NODE.visited) return;
        
        NODE.visited = true;

        // Worker
        const component = this.components.get( node.name );
        const inputs = {};
        for(let key in node.inputs){
            const conns = node.inputs[key].connections;
            inputs[key] = [];

            conns.forEach(c=>{
                const n = this.nodes[c.node];
                inputs[key].push( n.outputs[c.output] )  ;
            });
            if(conns.length === 1){
                inputs[key] = inputs[key][0];
            }
            if(!conns){
                inputs[key] = null; 
            }
        }
        NODE.outputs = {};
        await component.worker(node, inputs, NODE.outputs, ...this.args);

        for(let key in node.outputs){
            const conn = node.outputs[key].connections[0];
            if(conn){
                const n = this.editor.nodes[conn.node];
                await this.processNode( n );
            }
        }
    }
    async process(editor, id, ...args){
        this.args = args;

        for(let key in this.nodes){
            this.nodes[key].visited = false;
        }
        
        if(!id){
            Object.values(editor.nodes).forEach(node => this.processNode(node) );
            return
        }

        this.editor = editor;
        let node = this.editor.nodes[id];
        await this.processNode( node );
    }
}