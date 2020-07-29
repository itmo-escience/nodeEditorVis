<template>
  <div>
    <nuxt/>
  </div>
</template>

<style>
html {
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*, *:before, *:after {
  box-sizing: border-box;
  margin: 0;
}
.connection.socket-output-encode > path{ stroke: #aaff00 !important; }
.connection.socket-output-string-array > path{ stroke: #a002a0 !important; }
.connection.socket-output-number > path{ stroke: #9acd32 !important; }
.connection.socket-output-layer > path { stroke: #0000FF !important; }
.connection.socket-output-field > path{ stroke: #FF00FF !important; }
.connection.socket-output-axis > path{ stroke: #6699ff !important; }
.connection.socket-output-mark > path{ stroke: #e6e6e6 !important; }
.connection.socket-output-scale > path{ stroke: #091580 !important; }
.connection.socket-output-color > path{ stroke: #ee0063 !important; }
.connection.socket-output-heatmap > path{ stroke: #f70469 !important; }
.connection.socket-output-point-geometry > path{ stroke: #afaea6 !important; }
.connection.socket-output-line-geometry > path{ stroke: #b3b3b3 !important; }
.connection.socket-output-polygon-geometry > path{ stroke: #fffef7 !important; }
.connection.socket-output-links > path{ stroke: #3463fd !important; }
.connection.socket-output-force-x > path{ stroke: #04c0f0 !important; }
.connection.socket-output-force-y > path{ stroke: #8be8ff !important; }
.connection.socket-output-force-many-body > path{ stroke: #237083 !important; }
.connection.socket-output-force-radial > path{ stroke: #92b2b9 !important; }
.connection.socket-output-links > path{ stroke: #c8f3fd !important; }
.connection.socket-output-data > path{ stroke: #2697b1 !important; }
.connection.socket-output-date > path{ stroke: #b4a200 !important; }

.socket.output.encode, .socket.input.encode { background: #aaff00; }
.socket.output.string-array, .socket.input.string-array { background: #a002a0; }
.socket.output.number, .socket.input.number { background: #9acd32; }
.socket.output.layer, .socket.input.layer { background: #0000FF; }
.socket.output.field, .socket.input.field { background: #FF00FF; }
.socket.output.axis, .socket.input.axis { background: #6699ff; }
.socket.output.mark, .socket.input.mark { background: #e6e6e6; }
.socket.output.scale, .socket.input.scale { background: #091580; }
.socket.output.color, .socket.input.color { background: #ee0063; }
.socket.output.heatmap, .socket.input.heatmap { background: #f70469; }
.socket.output.point-geometry, .socket.input.point-geometry { background: #afaea6; }
.socket.output.line-geometry, .socket.input.line-geometry { background: #b3b3b3; }
.socket.output.polygon-geometry, .socket.input.polygon-geometry { background: #fffef7; }
.socket.output.nodes, .socket.input.nodes { background: #ffe604; }
.socket.output.links, .socket.input.links { background: #3463fd; }
.socket.output.force-x, .socket.input.force-x { background: #04c0f0; }
.socket.output.force-y, .socket.input.force-y { background: #8be8ff; }
.socket.output.force-many-body, .socket.input.force-many-body { background: #237083; }
.socket.output.force-radial, .socket.input.force-radial { background: #92b2b9; }
.socket.output.links, .socket.input.links { background: #c8f3fd; }
.socket.output.data, .socket.input.data { background: #2697b1; }
.socket.output.date, .socket.input.date { background: #b4a200; }

body{ color: #d5d6d6; }

.node{
    background: #353535 !important;
    border: 1px solid #d5d6d6 !important;
    border-radius: 10px;
    height: auto;
    min-width: 180px;
    text-align: center;
    padding: 10px 0;
}
.title{
  font-size: 20px;
  color: #fff;
  margin: 5px 20px;
}

.arrow.up:after{ content: url(~assets/arrow-up.svg); }
.arrow.down:after{ content: url(~assets/arrow-down.svg); }

.node.selected{ border-color: #e3c000 !important; }
.connection .main-path { stroke: #d5d6d6 !important; }
.socket{ border: 0 !important; }
.control{ padding: 6px 18px; }

.fg-1{ flex-grow: 1; }
.fg-9{ flex-grow: .9; }
.w-173{ width: 250px; }
.mrr-20{ margin-right: 20px; }
.mrl-20{ margin-left: 20px; }
.mrv-10{ margin: 10px 0; }
.align-left{ text-align: left; } 
.space-between{ justify-content: space-between; }
.align-center{ align-items: center; }
.justify-center{ justify-content: center; }
.justify-end{ justify-content: flex-end }
.cursor-pointer{ cursor: pointer; }
.d-flex{ display: flex; }
.hidden{ visibility: hidden; }
.relative{ position: relative; }

.file-input { 
  visibility: hidden; 
  width: 0; height: 0; 
  padding: 0; 
}
.btn{
  background-color: #353535;
  padding: 10px;
  border: 1px solid #d5d6d6;
  border-radius: 4px;
}

/* .l7-ctrl-logo { visibility: hidden; }
.l7-marker-container { height: 0 !important; }*/

.mapbox {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #e5e9ec;
  overflow: hidden;
}
.deck-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

#preview-map:focus, .mapboxgl-canvas-container, .mapboxgl-canvas{
  outline: none;
}

.context-menu{
  position: fixed;
  background: #292929;
  z-index: 3;
  color: #d5d6d6;
}
.context-menu.child{
  position: absolute;
  left: 200px;
  top: 0;
}
.context-menu-item{
  position: relative;
  padding: 10px;
  width: 200px;
  border-bottom: 1px solid #d5d6d6;
  line-height: 19px;
}
.search + .context-menu-item{ margin-top: 40px; }
.context-menu-item:hover{
  color: #e3c000;
}
.context-menu-item.has-children{
  font-weight: bold;
}
.context-menu-item:first-child{
  border-radius: 4px 4px 0px 0px;
}
.context-menu-item:last-child{
  border-bottom: 0px;
  border-radius: 0px 0px 4px 4px;
}
.search{
  position: fixed;
  padding: 10px;
  border-radius: 4px;
  width: 200px;
  height: 40px;
}

::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: #d5d6d6; 
}
::-webkit-scrollbar-thumb {
  background: #353535;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #292929; 
}

input{
    color: #d5d6d6;
    border: 1px solid #d5d6d6;
    padding: 5px;
    background: #353535;
    border-radius: 4px;
}
input:focus{
  outline: none;
}
a{
  text-decoration: none;
  color: #d5d6d6;
}

#save{
  position: fixed;
  top: -50px; left: calc(50% - 100px);
  background: rgba(19, 164, 142, 0.58);
  border-radius: 4px;
  padding: 10px 68px;
  color: #fff;
  z-index: 100;
  display: block;
}
#save.red{
  background: rgba(240, 52, 52, 1);
}
#save.active{
    animation: one 6s;
}
@keyframes one {
    0% { top: 0px; }   
    10% { top: 10px; }
    90% { top: 10px; }
    100% { top: -50px; }
}

.range-control{ 
  width: 300px;
  margin-right: 10px;
}
.range-selector{ width: 200px; }
.container{
  height: 20px;
  flex-grow: 1;
  margin: 0px 35px;
}
.slider{
  position: relative;
  top: 10px;
  width: 100%;
  height: 2px;
  border-radius: 5px;
  background: #d5d6d6;
  margin-right: 10px;
}
.plus{
  height: 10px;
  position: relative;
  top: -7px;
}
.plus:after{
  content: url(~assets/plus.svg);
}
.circle{
  position: absolute;
  top: -7px;
}
.circle circle{ fill: #d5d6d6; }
.picker{
  height: 10px;
  width: 100%;
  position: relative;
  top: -6px;
}
.min, .max{ 
  position: absolute;
  top: 2px; 
}
.max{ right: 0; }

#pallet{
  position: absolute;
  top: 10px;
}

.download:after{
  content: url(~assets/download.svg);
}
.save:after{
  content: url(~assets/save.svg);
}
.upload:after{
  content: url(~assets/upload.svg);
}
#load{
  position: fixed;
  top: 0; left: 0;
  margin: 10px;
  z-index: 3;
}
#editor{
  position: fixed;
  left: 0; bottom: 0;
  width: 100%;
  height: 100% !important;
  z-index: 2;
  background: #292929;
}
#preview{
  position: fixed;
  right: 0; bottom: 0;
  z-index: 2;
  width: 900px;
  height: 100%;
}
.preview-item{
  border: 1px solid #d5d6d6;
  color: #d5d6d6;
  border-radius: 4px 4px 0 0;
  background: #353535;
  padding: 10px;
}
.preview-item.selected{
  border-color: #e3c000;
  color: #e3c000;
}

.container-preview{
  width: 100%;
  height: 100%;
  position: relative;
}
.map-preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #e5e9ec;
    overflow: hidden;
}
.deck-preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

#preview.hidden{ visibility: hidden; }
.logo{
  position: fixed;
  left: 0; bottom: 0;
  z-index: 2;
}
.logo:after{
  content: url(~assets/logo.svg);
}

.absolute.r-0 {
  position: absolute;
  right: 0;
}
</style>

