<template>
  <div class="d-flex space-between">
      <div class="mrr-20">{{ ikey }}</div>
      <div class="dropdown fg-1" @mouseleave="close">
      <div class="dropdown-control" :class="{opened: opened}" @click="toggle">
        {{ value }}
        <div class="ghost">{{ options.reduce((a,b)=> a.length > b.length ? a : b,'') }}</div>
      </div>
      <div class="dropdown-menu" v-if="opened">
          <div class="dropdown-menu-item" v-for="(option, index) in options" :key="index" @click="change(option)" :class="{selected: option === value}">{{ option }}</div>
        </div>
    </div>
  </div>
</template>
<script>
    export default { 
        props: ['options', 'emitter', 'ikey', 'getData', 'putData'],
        data() {
          return {
            opened: false,
            value: null
          }
        },
        methods: {
          close(){
            this.opened = false;
          },
          toggle(){
            this.opened = !this.opened;
          },
          change(option){
            this.value = option;
            this.toggle();
            this.update();
          },
          update() {
            this.putData(this.ikey, this.value)
            this.emitter.trigger('process');
          }
        },
        mounted() {
          this.value = this.getData(this.ikey) || this.options[0];
          this.update();
        }
    }
</script>
<style>
  .dropdown{ position: relative; }
  .ghost{ visibility: hidden; }
  .dropdown-control, .dropdown-menu{
    background: #353535;
    color: #d5d6d6;
  }
  .dropdown-control{
    border: 1px solid #d5d6d6;
    border-radius: 4px;
  }
  .dropdown-control.opened{ border-radius: 4px 4px 0 0; }
  .dropdown-control, .dropdown-menu-item{ 
    padding: 5px; 
    height: 30px;
  }
  .dropdown-menu{
    position: absolute;
    width: 100%;
    z-index: 3;
    border-radius: 0 0 4px 4px;
  }
  .dropdown-menu-item:hover{ color: #e3c000; }
  .dropdown-menu-item.selected{
    background: #d5d6d6;
    color: #353535;
  }
</style>