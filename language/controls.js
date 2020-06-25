import Rete from 'rete';

import VueNumControl from '~/components/controls/VueNumControl'
import VueSelectControl from '~/components/controls/VueSelectControl'
import VueColorControl from '~/components/controls/VueColorControl'
import VueClosedColorControl from '~/components/controls/VueClosedColorControl'
import VueFileLoadControl from '~/components/controls/VueFileLoadControl'
import VueTwoColorControl from '~/components/controls/VueTwoColorControl'
import VueTwoRangeControl from '~/components/controls/VueTwoRangeControl'
import VueLoadControl from '~/components/controls/VueLoadControl.vue'
import VueRangeControl from '~/components/controls/VueRangeControl.vue'
import VueCheckBoxControl from '~/components/controls/VueCheckBoxControl.vue'
import VueColorRangeControl from '~/components/controls/VueColorRangeControl.vue'

class FileLoadControl extends Rete.Control {
    constructor(emitter, key, name, node){
        super(key)
        this.render = 'vue';
        this.component = VueFileLoadControl;
        this.props = { emitter, DATA: key, name, node }
    }
}
class ColorControl extends Rete.Control {
    constructor(emitter, key, node){
        super(key);
        this.render = 'vue';
        this.component = VueColorControl;
        this.props = { emitter, ikey: key, node};
    }
}
class ClosedColorControl extends Rete.Control{
    constructor(emitter, key, node){
        super(key)
        this.render = 'vue';
        this.component = VueClosedColorControl;
        this.props = { emitter, ikey: key, node};
    }
}
class TwoColorControl extends Rete.Control{
    constructor(emitter, key, node){
        super(key)
        this.render = 'vue';
        this.component = VueTwoColorControl;
        this.props = { emitter, ikey: key, node};
    }
}
class ColorRangeControl extends Rete.Control{
    constructor(emitter, key, node){
        super(key)
        this.render = 'vue';
        this.component = VueColorRangeControl;
        this.props = { emitter, ikey: key, node};
    }
}
class CheckBoxControl extends Rete.Control{
    constructor(emitter, key, label, node){
        super(key)
        this.render = 'vue';
        this.component = VueCheckBoxControl;
        this.props = { emitter, ikey: key, label, node };
    }
}
class RangeControl extends Rete.Control{
    constructor(emitter, key, range, node){
        super(key)
        this.render = 'vue';
        this.component = VueRangeControl;
        this.props = { emitter, ikey: key, range, node};
    }
}
class TwoRangeControl extends Rete.Control{
    constructor(emitter, key, range, node){
        super(key)
        this.render = 'vue';
        this.component = VueTwoRangeControl;
        this.props = { emitter, ikey: key, range, node};
    }
}
class NumControl extends Rete.Control {
    constructor(emitter, key, node, placeholder) {
        super(key);
        this.render = 'vue';
        this.component = VueNumControl;
        this.props = { emitter, ikey: key, node, placeholder };
    }

    setValue(val) {
        this.vueContext.value = val;
    }
}
class LoadControl extends Rete.Control {
    constructor(emitter, key, placeholder, node) {
        super(key);
        this.render = 'vue';
        this.component = VueLoadControl;
        this.props = { emitter, ikey: key, placeholder, node };
    }
}
class SelectControl extends Rete.Control {
    constructor(emitter, key, options, node) {
        super(key);
        this.render = 'vue';
        this.component = VueSelectControl;
        this.props = { emitter, ikey: key, options, node };
    }

    setValue(val) {
        this.vueContext.value = val;
    }
}

export {
    FileLoadControl, ColorControl,
    ClosedColorControl, TwoColorControl,
    ColorRangeControl, CheckBoxControl,
    RangeControl, TwoRangeControl, NumControl,
    LoadControl, SelectControl
}