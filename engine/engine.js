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
        if(!NODE){
            NODE = this.nodes[node.id] = { id: node.id, visited: true };
        }else if(NODE.visited){
            return
        }else{
            NODE.visited = true;
        }

        // Worker
        const component = this.components.get( node.name );
        const inputs = {};
        for(let key in node.inputs){
            const conn = node.inputs[key].connections[0];
            if(conn){
                const n = this.nodes[conn.node];
                inputs[key] = [ n.outputs[conn.output] ]; 
            }else{
                inputs[key] = []; 
            }
        }
        const outputs = {};
        await component.worker(node, inputs, outputs, ...this.args);
       

        NODE.outputs = outputs;

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