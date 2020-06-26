import Rete from 'rete';

import * as d3 from "d3";

import ChartNode from '~/components/nodes/ChartNode'
import MapNode from '~/components/nodes/MapNode'
import CategoryNode from '~/components/nodes/CategoryNode'
import GraphNode from '~/components/nodes/GraphNode'
import Node from '~/components/nodes/Node'

import {
    FileLoadControl, ColorControl,
    ClosedColorControl, TwoColorControl,
    ColorRangeControl, CheckBoxControl,
    RangeControl, TwoRangeControl,
    NumControl,
    LoadControl, SelectControl
} from '~/language/controls.js';

const colorSocket = new Rete.Socket('Color');
const colorMapSocket = new Rete.Socket('Color Map');
const layerSocket = new Rete.Socket('Layer');

const dataSocket = new Rete.Socket('Data');

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
            .addInput(new Rete.Input('nums', 'Nums', dataSocket))
            .addOutput(new Rete.Output('result', 'Result', dataSocket))
            .addControl(new NumControl(this.editor, 'multiplier', node));
    }
    worker(node, inputs, outputs){
        outputs.result = inputs.nums[0].map(d=> !isNaN(+d) ? d*node.data.multiplier : d );
    }
}
class ColorComponent extends Rete.Component {
    constructor(){
        super('Color')
        this.data.component = CategoryNode;
        this.path = []
    }
    build(node){
        node.data.colors = {};
        const val = new Rete.Input('values', 'Values', dataSocket);
        val.addControl(new ColorControl(this.editor, 'color', node))
        node
            .addInput( val )
            .addOutput(new Rete.Output('colors', 'Colors', colorSocket)); 
    }
    async worker(node, inputs, outputs){

        node.data.values = inputs.values.length ? [...new Set( inputs.values[0] )] : [];

        if(!node.data.values.length){
            outputs.colors = { data: null, value: node.data.color };
            return;
        }

        if(!isNaN(+node.data.values[0])){ // if number
            node.data.values = d3.extent( node.data.values ); 
        }
        this.editor.nodes.find(n=>n.id===node.id).update();

        const colors = node.data.colors;
        const color = d3.scaleLinear(d3.extent( node.data.values ), Object.values(colors));
        
        outputs.colors = {
            data: inputs.values[0].map(d=> isNaN(d) ? colors[d] : color(d) ),
            value: null
        }
        console.log(outputs.colors.data);
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
            const feature = node.data.data.features[0];
            for(let key in feature.properties){
                node.addOutput(new Rete.Output(key, key, dataSocket));
            }
            const geometry = feature.geometry.type;
            const socket = geometry === 'Point' ? pointGeometrySocket : geometry === 'LineString' ? lineGeometrySocket : polygonGeometrySocket;

            node.addOutput(new Rete.Output('geom', 'Geometry', socket));
        }else{
            for(let key in node.data.data[0]){
                node.addOutput(new Rete.Output(key, key, dataSocket));
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
        this.path = [];
    }
    builder(node){
        node.data.dataset = '';

        node.addControl( new SelectControl( this.editor, 'dataset', ['', 'cars', 'branches', 'arcs', 'nodes', 'links'], node ) )
            .addControl(new LoadControl(this.editor, 'url', 'Url', node))
            .addControl(new FileLoadControl(this.editor, 'data', 'name', node));
    }
    async worker(node, inputs, outputs, state){
        
        let data;
        if(node.data.dataset){
            data = {
                name: node.data.dataset, 
                data: state.data[ node.data.dataset ]
            };
        }
        if(node.data.data){
            data = {
                name: node.data.name, 
                data: node.data.data
            };
        }
        if(node.data.url){
            let url = node.data.url;
            if(!(url.endsWith('.csv') || url.endsWith('.json') || url.endsWith('.geojson'))) return;
            url = url.startsWith('https') ? url : 'https://' + url;
            const result = await d3.text(url);
            const data = url.endsWith('.csv') ? await d3.csvParse(result) : JSON.parse(result);
            const name = url.split('/').pop();

            data = { name, data };
        }
        if(data){
            if(data.data.type == 'FeatureCollection'){
                (d3.nest()
                .key(function(d) { return d.geometry.type; })
                .entries(data.data.features) ).forEach(async (d, i)=>{
                    const component = new ParseComponent;
                    const parse = await component.createNode( {name, data: { type: 'FeatureCollection', features: d.values }} );
                    parse.position = [ node.position[0], node.position[1] + i*20 ];
                    this.editor.addNode( parse );
                    this.editor.nodeId = parse.id;
                    this.editor.trigger('process');
                });
            }else{
                const component = new ParseComponent;
                const parse = await component.createNode( data );
                parse.position = node.position;
                this.editor.addNode( parse );
                this.editor.nodeId = parse.id;
                this.editor.trigger('process');
            };
            
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
        node.addInput(new Rete.Input('nums', 'Values', dataSocket));
        if(node.data.values){
            node
                .addControl(new TwoRangeControl(this.editor, 'domain', [node.data.domainFrom, node.data.domainTo], node))
                .addControl(new TwoRangeControl(this.editor, 'range', [1, 30], node))
                .addOutput(new Rete.Output('range', 'Range', dataSocket));
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
class PointLayerComponent extends Rete.Component {  
    constructor(){
        super('Point Layer')
        this.data.component = Node;
        this.path = ['Layers']
    }
    build(node){
        node.data.radius = 100;

        const radiusInput = new Rete.Input('radius','Radius', dataSocket);
        radiusInput.addControl(new NumControl(this.editor, 'radius', node, 'radius'));

        node
            .addInput(new Rete.Input('lat','Lat', dataSocket))
            .addInput(new Rete.Input('lon','Lon', dataSocket))
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
        node
            .addInput(new Rete.Input('x','X', dataSocket))
            .addInput(new Rete.Input('x1','X1', dataSocket))
            .addInput(new Rete.Input('y','Y', dataSocket))
            .addInput(new Rete.Input('y1','Y1', dataSocket))
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
        const widthInput = new Rete.Input('width','Width', dataSocket);
        widthInput.addControl(new NumControl(this.editor, 'width', node, 'width'));

        node
            .addInput(new Rete.Input('x','X', dataSocket))
            .addInput(new Rete.Input('x1','X1', dataSocket))
            .addInput(new Rete.Input('y','Y', dataSocket))
            .addInput(new Rete.Input('y1','Y1', dataSocket))
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
        const heightInput = new Rete.Input('height','Height', dataSocket);
        heightInput.addControl(new NumControl(this.editor, 'height', node, 'height'))

        node
            .addControl(new SelectControl(this.editor, 'shape', ['extrude', 'fill'], node))
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
            .addControl(new SelectControl(this.editor, 'type', ['hexagon', 'grid'], node))
            .addControl(new CheckBoxControl(this.editor, 'extruded', 'Extrude', node))
            .addControl(new ColorRangeControl(this.editor, 'colorRange', node))
            .addControl(new TwoRangeControl(this.editor, 'elevationRange', [0, 200000], node))
            .addControl(new SelectControl(this.editor, 'colorAggMethod', ['SUM', 'MEAN', 'MIN', 'MAX'], node))
            .addControl(new SelectControl(this.editor, 'elevationAggMethod', ['SUM', 'MEAN', 'MIN', 'MAX'], node))
            .addInput(new Rete.Input('lat','Lat', dataSocket))
            .addInput(new Rete.Input('lon','Lon', dataSocket))
            .addInput(new Rete.Input('geometry', 'Geometry', pointGeometrySocket))
            .addInput(new Rete.Input('elevation', 'Elevation', dataSocket))
            .addInput(new Rete.Input('color', 'Color', dataSocket))
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
        const weightInput = new Rete.Input('weight','Weight', dataSocket);
        weightInput.addControl(new NumControl(this.editor, 'weight', node, 'weight'));

        node
            .addInput(new Rete.Input('lat','Lat', dataSocket))
            .addInput(new Rete.Input('lon','Lon', dataSocket))
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
    worker(node, inputs, outputs, state){
        if(!node.data.id){
            state.maps++;
            node.data.id = state.maps;
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
        node
            .addInput(new Rete.Input('x', 'X', dataSocket))
            .addInput(new Rete.Input('y', 'Y', dataSocket))
            .addInput(new Rete.Input('colors', 'Colors', colorSocket))
            .addInput(new Rete.Input('size','Size', dataSocket));
    }
    worker(node, inputs, outputs){
        console.log(inputs.colors)
        if( inputs.x.length && inputs.y.length ){
            node.data.DATA = inputs.x[0].map((x, i)=> ({
                x: inputs.x[0][i],
                y: inputs.y[0][i],
                ...(!inputs.colors.length  ? {} : inputs.colors[0].data ? { color: inputs.colors[0].data[i] } : { color: inputs.colors[0].value }),
                ...(inputs.size.length ? {size: +inputs.size[0][i]} : {}),
            }));
        }
        
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
        const strength = new Rete.Input('strength', 'Strength', dataSocket);
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
        const strength = new Rete.Input('strength', 'Strength', dataSocket);
        strength.addControl(new RangeControl(this.editor, 'strength', [0, 1], node));
        const radius = new Rete.Input('radius', 'Radius', dataSocket);
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
        const strength = new Rete.Input('strength', 'Strength', dataSocket);
        strength.addControl(new RangeControl(this.editor, 'strength', [-1, 1], node));
        const x = new Rete.Input('x', 'X', dataSocket);
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
        const strength = new Rete.Input('strength', 'Strength', dataSocket);
        strength.addControl(new RangeControl(this.editor, 'strength', [-1, 1], node));
        const y = new Rete.Input('y', 'Y', dataSocket);
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
        const distance = new Rete.Input('distance', 'Distance', dataSocket);
        distance.addControl(new RangeControl(this.editor, 'distance', [0, 100], node));

        node
            .addInput(new Rete.Input('source', 'source', dataSocket))
            .addInput(new Rete.Input('target', 'target', dataSocket))
            .addControl(new RangeControl(this.editor, 'iterations', [1, 10], node))
            .addInput(distance)
            .addOutput(new Rete.Output('links', 'Links', linksSocket));
    }
    worker(node, inputs, outputs){
        if( inputs.source.length && inputs.target.length ){
            outputs.links = {
                iterations: node.data.iterations,
                links: inputs.source.map((d,i)=>{
                    return {
                        source: d,
                        target: inputs.target[0][i],
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
        const radius = new Rete.Input('radius', 'Radius', dataSocket);
        radius.addControl(new NumControl(this.editor, 'radius', node, 'radius'));
        node
            .addInput(new Rete.Input('id', 'id', dataSocket))
            .addInput(new Rete.Input('x', 'Force X', forceXSocket))
            .addInput(new Rete.Input('y', 'Force Y', forceYSocket))
            .addInput(new Rete.Input('charge', 'Force Many Body', forceManyBodySocket))
            .addInput(new Rete.Input('radial', 'Force Radial', forceRadialSocket))
            .addInput(new Rete.Input('colors', 'Colors', colorSocket))
            .addInput(radius)
            .addInput(new Rete.Input('links', 'Links', linksSocket));
    }
    worker(node, inputs, outputs){
        if( inputs.id.length ){
            node.data.GRAPH = {
                radialCenter: inputs.radial.length ? inputs.radial[0].center : [],
                iterations: inputs.links.length ?  inputs.links[0].iterations : null,
                ...(inputs.links.length ? {links: inputs.links[0].links} : {}),
                nodes: inputs.id[0].map((d, i)=>{
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

export {
    MultiplyComponent, RangeComponent,
    ColorComponent,
    //ColorCategoryComponent, ColorRangeComponent,
    ParseComponent, DatasetComponent,
    PointLayerComponent, LineLayerComponent,
    ArcLayerComponent, PolygonLayerComponent,
    GridMapLayerComponent, HeatMapLayerComponent,
    HeatMapComponent, MapComponent,
    ScatterComponent, ForceManyBodyComponent,
    ForceRadialComponent, ForceXComponent,
    ForceYComponent, LinksComponent,
    GraphComponent
}