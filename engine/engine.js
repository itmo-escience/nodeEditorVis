export default class Engine {
    constructor(components){
        this.components = new Map();
        components.forEach(component=> this.components.set(component.name, component) );

        this.editor = null;
        this.nodes = {};
    }
    processNode(node){
        // console.log(node.name);
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
        component.worker(node, inputs, outputs);
        
        const id = node.id;
        this.nodes[id] = { id, outputs }

        for(let key in node.outputs){
            const conn = node.outputs[key].connections[0];
            if(conn){
                const n = this.editor.nodes[conn.node];
                this.processNode( n );
            }
        }
    }
    process(editor, id){
        this.editor = editor;
        let node = this.editor.nodes[id];
        this.processNode( node );
    }
}