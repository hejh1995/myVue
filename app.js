function myVue(options) {
  // 构造函数
  this._init(options);
}
myVue.prototype._init = function(options) {
  this.$options = options;
  this.$el = document.querySelector(options.el);
  this.$data = options.data;
  this.$methods = options.methods;
  this._binding = {}; // _dinding 保存model与view的映射关系，当model更新，就会触发其中的指令更新，保证view实时更新
  this._obverse(this.$data);
  this._complie(this.$el);
}
myVue.prototype._obverse = function(obj) {
  var value;
  for (key in obj) {
    // 递归对对象的每一个属性设置get和set方法
    // get和set方法在数据get或set的时候会自动调用，所以在set的时候修改数据
    if (obj.hasOwnProperty(key)) {
      this._binding[key] = {
        _directives: []
      };
      value=obj[key];
      if (typeof value === 'object') {
        this._obverse(value);
      }
      var binding = this._binding[key];
      Object.defineProperty(this.$data, key, {
        enumerable: true,
        configurable: true,
        get: function() {
          console.log(`获取${value}`);
          return value;
        },
        set: function (newvalue) {
          console.log(`更新${newvalue}`);
          if (value !== newvalue) {
            value = newvalue;
            binding._directives.forEach(item => {
              item.update();
            })
          }
        }
      })
    }
  }
}
function Watcher(name, el, vm, exp, attr) {
  // 指令类，用于对DOM元素的绑定
  this.name = name;
  this.el = el;
  this.vm = vm;
  this.exp = exp;
  this.attr = attr;
  this.update();
}
Watcher.prototype.update = function() {
  this.el[this.attr] = this.vm.$data[this.exp];
}
myVue.prototype._complie = function (root) {
  // root 为 id为app的Element元素，也就是我们的根元素
  var _this = this;
  var nodes = root.children;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.children.length) this._complie(node);
    // 如果有事件需要监听，设置立即执行的函数，把点击事件绑定在元素上，下次点击直接执行点击事件
    if (node.hasAttribute('v-click')) {
      node.onclick = (function() {
        var attrVal = nodes[i].getAttribute('v-click')
        return _this.$methods[attrVal].bind(_this.$data);
      })();
    }
    // v-model 和 v-bind 都需要改变DOM，用watcher类
    if (node.hasAttribute('v-model') && (node.tagName == 'INPUT' || node.tagName == 'TEXTAREA')) {
      node.addEventListener('input', (function(key) {
        var attrVal = node.getAttribute('v-model');
        // attrVal data里面的key值。
        _this._binding[attrVal]._directives.push(new Watcher(
          // 更新node节点的'value'为，data的attrval。
          'input',
          node,
          _this,
          attrVal,
          'value'
        ))
        return function() {
          console.log('我输入了');
          _this.$data[attrVal] = nodes[key].value;
          // 不是立即执行，每次输入值时执行，触发set，改变绑定的DOM值
        }
      })(i));
    }

    if (node.hasAttribute('v-bind')) {
      var attrVal = node.getAttribute('v-bind');
      _this._binding[attrVal]._directives.push(new Watcher(
        'text',
        node,
        _this,
        attrVal,
        'innerHTML'
      ))
    }
  }
}

window.onload = function() {
  var app = new myVue({
    el: '#app',
    data: {
      number: 0
    },
    methods: {
      increment() {
        console.log('我点击了');
        // 在点击事件里设置number的值，会触发该值的set函数，更新绑定该值的节点值，即改变DOM
        this.number++;
      }
    }
  })
}
