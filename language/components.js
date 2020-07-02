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
const layerSocket = new Rete.Socket('Layer');

const dataSocket = new Rete.Socket('Data');

const heatMapSocket = new Rete.Socket('HeatMap');

const forceXSocket = new Rete.Socket('Force X');
const forceYSocket = new Rete.Socket('Force Y');
const forceManyBodySocket = new Rete.Socket('Force Many Body');
const forceRadialSocket = new Rete.Socket('Force Radial');

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
        outputs.result = inputs.nums.map(d=> !isNaN(+d) ? d*node.data.multiplier : d );
    }
}
class ColorComponent extends Rete.Component {
    constructor(){
        super('Color')
        this.data.component = CategoryNode;
        this.path = []
    }
    build(node){
        node.data.colors  = node.data.colors || {};
        const val = new Rete.Input('values', 'Values', dataSocket);
        val.addControl(new ColorControl(this.editor, 'color', node))
        node
            .addInput( val )
            .addOutput(new Rete.Output('colors', 'Colors', colorSocket)); 
    }
    async worker(node, inputs, outputs){
        // pallets
        // d3.schemePaired // 12 dark
        // d3.schemeSet3 // 12 light
        // d3.schemeCategory10 // 10 dark
        // d3.schemeAccent // 8 light
        // d3.schemeDark2 // 8 dark
        // d3.schemeSet1 // 9 light

        const data = node.data;
        data.values = inputs.values ? [...new Set( inputs.values )] : [];
        
        if(!data.values.length){
            outputs.colors = { value: data.color };
            return;
        }
        if(data.values.length > 12){
            data.values = d3.extent( data.values ); 
        }
        this.editor.nodes.find(n=>n.id===node.id).update();

        const colors = data.colors;
        const color = d3.scaleLinear(d3.extent( data.values ), Object.values(colors));
        
        outputs.colors = {
            data: inputs.values.map(d=> isNaN(d) ? colors[d] : color(d) ),
            value: null,
        }
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

        node.addControl( new SelectControl( this.editor, 'dataset', ['', 'cars', 'sea-ice','branches', 'arcs', 'nodes', 'links'], node ) )
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
            outputs['range'] = inputs.nums.map(v=>{
                v = v > domainTo ? domainTo : v;
                v = v < domainFrom ? domainFrom : v;
                return (((v - domainFrom) * (rangeTo - rangeFrom)) / (domainTo - domainFrom)) + rangeFrom
            });
            if(JSON.stringify(node.data.values) != JSON.stringify(inputs.nums)){
                node.data.values = null;
            }
        }
        
        if(!node.data.values && inputs.nums){
            const values = inputs.nums;
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
        if( (inputs.lat && inputs.lon) || inputs.geometry ){
            let data = [];
            const props = {
                radius: inputs.radius ?  inputs.radius[i] : null,
                color: inputs.colors ?  inputs.colors.data[i] : null,
            };

            if( (inputs.lat && inputs.lon) && 
                inputs.lat.length === inputs.lon.length )
            {
                data = {
                    type: "FeatureCollection",
                    features: inputs.lat.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: {
                            type: "Point",
                            coordinates: [inputs.lon[i], inputs.lat[i]]
                        }
                    }))
                }
            }else if(inputs.geometry){
                data = {
                    type: "FeatureCollection",
                    features: inputs.geometry.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: g 
                    }))
                }
            }
            
            outputs['layer'] = {
                type: 'point',
                data: data,
                radius: inputs.radius ? null : node.data.radius,
                color: inputs.colors ? inputs.colors.value : 'rgba(160, 160, 180, 250)',
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
        if( (inputs.x && inputs.y && inputs.x1 && inputs.y1) || inputs.geometry ){
            let data = [];
            const props = {
                color: inputs.colors ?  inputs.colors.data[i] : null,
            };
            if( (inputs.x && inputs.y && inputs.x1 && inputs.y1) && 
                (inputs.x.length === inputs.y.length) &&
                (inputs.x.length === inputs.x1.length) &&
                (inputs.x.length === inputs.y1.length) )
            {   
                data = {
                    type: "FeatureCollection",
                    features: inputs.x.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: {
                            type: "LineString",
                            coordinates: [
                                [inputs.x[i], inputs.y[i]],
                                [inputs.x1[i], inputs.y1[i]]
                            ]
                        }
                    }))
                }
            }else if(inputs.geometry.length){
                data = {
                    type: "FeatureCollection",
                    features: inputs.geometry.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: g 
                    }))
                }
            }

            outputs['layer'] = {
                type: 'line',
                data: data,
                color: inputs.colors ? inputs.colors.value : 'rgba(160, 160, 180, 250)',
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
        if( (inputs.x && inputs.y && inputs.x1 && inputs.y1) || inputs.geometry ){
            let data = [];
            const props = {
                color: inputs.colors ? inputs.colors.value || inputs.colors.data[i] : null,
                width: inputs.width ? inputs.width[i] : null,
            };

            if( (inputs.x && inputs.y && inputs.x1 && inputs.y1) && 
                (inputs.x.length === inputs.y.length) &&
                (inputs.x.length === inputs.x1.length) &&
                (inputs.x.length === inputs.y1.length) )
            {   
                data = {
                    type: "FeatureCollection",
                    features: inputs.x.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: {
                            type: "LineString",
                            coordinates: [
                                [inputs.x[i], inputs.y[i]],
                                [inputs.x1[i], inputs.y1[i]]
                            ]
                        }
                    }))
                }
            }else if(inputs.geometry.length){
                data = {
                    type: "FeatureCollection",
                    features: inputs.geometry[0].map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: g 
                    }))
                }
            }

            outputs['layer'] = {
                type: 'arc',
                data: data,
                width: inputs.width ? null : node.data.width,
                color: inputs.colors ? inputs.colors.value : 'rgba(160, 160, 180, 250)'
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
                features: inputs.geometry.map((g, i)=>({ 
                    type: "Feature",
                    properties: { 
                        color: inputs.colors ? inputs.colors.value || inputs.colors.data[i] : null,
                        width: inputs.height ? inputs.height[i] : null,
                    },
                    geometry: g
                }))
            }
            outputs['layer'] = {
                type: 'polygon',
                data: data,
                extruded: node.data.shape === 'extrude',
                color: inputs.colors ? inputs.colors.value : 'rgba(160, 160, 180, 250)',
                height: inputs.height ? null : node.data.height
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
            .addInput(new Rete.Input('color', 'Color', colorSocket))
            .addOutput(new Rete.Output('layer', 'Layer', layerSocket));
    }
    worker(node, inputs, outputs){
        if( (inputs.lat && inputs.lon) || inputs.geometry ){
            let data = [];
            const props = {
                color: inputs.colors ? inputs.colors.value || inputs.colors.data[i] : null,
                elevation: inputs.elevation ? inputs.elevation[i] : null,
            }
            if( (inputs.lat && inputs.lon) && inputs.lat.length === inputs.lon.length )
            {
                data = {
                    type: "FeatureCollection",
                    features: inputs.lat.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: {
                            type: "Point",
                            coordinates: [inputs.lon[i], inputs.lat[i]]
                        }
                    }))
                }

            }else if(inputs.geometry.length){
                data = {
                    type: "FeatureCollection",
                    features: inputs.geometry.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
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
        if( (inputs.lat && inputs.lon) || inputs.geometry ){
            
            let data = {};
            const props = {
                weight: inputs.weight ? inputs.weight[i] : null
            }
            if( (inputs.lat && inputs.lon) && 
            inputs.lat.length === inputs.lon.length )
            {
                data = {
                    type: "FeatureCollection",
                    features: inputs.lat.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: {
                            type: "Point",
                            coordinates: [inputs.lon[i], inputs.lat[i]]
                        }
                    }))
                }
            }else if(inputs.geometry.length){
                data = {
                    type: "FeatureCollection",
                    features: inputs.geometry.map((g, i)=>({ 
                        type: "Feature",
                        properties: props,
                        geometry: g 
                    }))
                }
            }

            outputs['layer'] = {
                type: 'heatmap',
                data: data,
                weight: inputs.weight ? null : node.data.weight,
                radius: inputs.heatmap ? inputs.heatmap.radius : null,
                intensity: inputs.heatmap ? inputs.heatmap.intensity : null,
                threshold: inputs.heatmap ? inputs.heatmap.threshold : null,
                colorRange: inputs.heatmap ? inputs.heatmap.colors : null
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
        if( inputs.x && inputs.y ){
            node.data.type = 'point';
            node.data.DATA = inputs.x.map((x, i)=> ({
                x: inputs.x[i],
                y: inputs.y[i],
                color: inputs.color ? inputs.color.value || inputs.color.data[i] : '#e3c000',
                size: inputs.size ? +inputs.size[i] : {},
            }));
        }
        this.editor.nodes.find(n=>n.id===node.id).update();
    }
}
class LineComponent extends Rete.Component {
    constructor() {
        super('Line')
        this.data.component = ChartNode;
        this.path = [];
    }
    builder(node){
        node
            .addInput(new Rete.Input('x', 'X', dataSocket))
            .addInput(new Rete.Input('y', 'Y', dataSocket))
            .addInput(new Rete.Input('i', 'Index', dataSocket))
            .addInput(new Rete.Input('color', 'Colors', colorSocket));
    }
    worker(node, inputs, outputs){
        if( inputs.x.length && inputs.y.length ){
            node.data.type = 'line';
            console.log(inputs);
            node.data.DATA = inputs.x.map((x, i)=> ({
                x: inputs.x[i],
                y: inputs.y[i],
                index: inputs.i ? inputs.i[i] : 0,
                color: inputs.color ? inputs.color.value || inputs.color.data[i] : '#e3c000'
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
            strength: inputs.strength || node.data.strength
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
            strength: inputs.strength || node.data.strength,
            radius: inputs.radius || node.data.radius,
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
            strength: inputs.strength || node.data.strength,
            x: inputs.x || node.data.x
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
            strength: inputs.strength || node.data.strength,
            y: inputs.y || node.data.y
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
        if( inputs.source && inputs.target ){
            outputs.links = {
                iterations: node.data.iterations,
                links: inputs.source.map((d,i)=>{
                    return {
                        source: d,
                        target: inputs.target[i],
                        ldis: inputs.distance[i] || node.data.distance,
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
        if( inputs.id ){
            node.data.GRAPH = {
                radialCenter: inputs.radial ? inputs.radial.center : [],
                iterations: inputs.links ?  inputs.links.iterations : null,
                links: inputs.links ? inputs.links.links : null,
                nodes: inputs.id.map((d, i)=>{
                    return {
                        id: d,
                        radius: inputs.radius ?  inputs.radius[i] : node.data.radius || null,
                        color: inputs.colors ? inputs.colors.value || inputs.colors.data[i] : null,
                        xstr: inputs.x ? inputs.x.strength.length ? inputs.x.strength[i] : inputs.x.strength : null,
                        xpos: inputs.x ? inputs.x.length ? inputs.x[i] : inputs.x : null,
                        ypos: inputs.y ? inputs.y.length ? inputs.y[i] : inputs.y : null,
                        ystr: inputs.y ? inputs.y.strength.length ? inputs.y.strength[i] : inputs.y.strength : null,

                        cstr: inputs.charge ? inputs.charge.strength.length ? inputs.charge.strength[i] : inputs.charge.strength : null,
                        rstr: inputs.radial ? inputs.radial.strength.length ? inputs.radial.strength[i] : inputs.radial.strength : null,

                        rad: inputs.radial ? inputs.radial.radius.length ? inputs.radial.radius[i] : inputs.radial.radius : null,
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
    ScatterComponent, LineComponent,
    ForceManyBodyComponent,
    ForceRadialComponent, ForceXComponent,
    ForceYComponent, LinksComponent,
    GraphComponent
}