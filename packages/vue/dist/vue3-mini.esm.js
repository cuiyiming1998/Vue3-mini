function toDisplayString(value) {
    return String(value);
}

// | 两位都为0 才为0 用作赋值
// & 两位都为1 才为1 用作判断
var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN"; // 1000
})(ShapeFlags || (ShapeFlags = {}));

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = val => {
    return val !== null && typeof val === 'object';
};
const hasChanged = (value, newValue) => {
    return !Object.is(value, newValue);
};
const hasOwn = (val, key) => {
    return Object.prototype.hasOwnProperty.call(val, key);
};
// 横杠转驼峰add-foo -> addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
// 首字母大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// 驼峰加on
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};
const isString = (val) => { return typeof val === 'string'; };

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode'
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push(`return `);
    genNode(ast.codegenNode, context);
    push(`}`);
    return { code: context.code };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    const aliasHelper = s => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
    }
    push(`\n`);
    push('return ');
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // genNode(children, context)
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || 'null');
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith('{{')) {
            // 插值类型
            node = parseInterpolation(context);
        }
        else if ('<' === s[0]) {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        // 如果node没有值 需要把它当成text来解析
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    return !s;
    // 2. 当遇到结束标签的时候
    // 1. source有值的时候
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith('</') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ['<', '{{'];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content
    };
}
function parseTextData(context, length) {
    // 1. 获取content
    const content = context.source.slice(0, length);
    // 2. 推进
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    // 解析element
    // 这里删除了左侧的<div>
    const element = parseTag(context, 0 /* TagType.Start */);
    // 收集tag名称
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    // 再次调用删除</div>
    // 弹出tag名称
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签: ${element.tag}`);
    }
    return element;
}
function parseTag(context, type) {
    // 1. 解析tag
    // < 开头 a-z忽略大小写
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 2. 删除处理完成的代码
    advanceBy(context, match[0].length);
    // 再删除剩下的 >
    advanceBy(context, 1);
    if (1 /* TagType.End */ === type) {
        return;
    }
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag
    };
}
function parseInterpolation(context) {
    // 解析插值
    // {{ message }}
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    // 寻找后面的 }}
    const closeIndex = context.source.indexOf(closeDelimiter, closeDelimiter.length);
    // 推进指针
    // 也就是执行删除
    // 去除前面的 {{
    advanceBy(context, openDelimiter.length);
    // 截取
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    // 处理后需要删除掉
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content
        }
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */
    };
}
function createParserContext(content) {
    return {
        source: content
    };
}

function transform(root, options = {}) {
    // 1. 遍历
    // 深度优先搜索ast树
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    // 2. 修改
    // root.codegenNode
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function traverseNode(node, context) {
    // 由外部传入的transforms来驱动
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    const vnodeElement = {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children
    };
    return vnodeElement;
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    let currentContainer;
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
/*
  type -> 'div' / 'span'
  props -> attribute
  children
*/
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        component: null,
        children,
        shapeFlag: getShapeFlag(type),
        key: props && props.key,
        el: null // 当前实例
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof children === 'object') {
            // 如果是组件类型 且children为object
            // 则当前节点属于slotChildren
            // 暂时只有 element 类型和 component 类型的组件
            // 所以这里除了 element ，那么只要是 component 的话，那么children 肯定就是 slots 了
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
        }
    }
    return vnode;
}
function createTextVnode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    // 如果类型是string则为element类型
    // 否则为component类型
    return typeof type === 'string'
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

/**
 * Compiler runtime helper for rendering `<slot/>`
 * 用来 render slot 的
 * 之前是把 slot 的数据都存在 instance.slots 内(可以看 componentSlot.ts)，
 * 这里就是取数据然后渲染出来的点
 * 这个是由 compiler 模块直接渲染出来的 -可以参看这个 demo https://vue-next-template-explorer.netlify.app/#%7B%22src%22%3A%22%3Cdiv%3E%5Cn%20%20%3Cslot%3E%3C%2Fslot%3E%5Cn%3C%2Fdiv%3E%22%2C%22ssr%22%3Afalse%2C%22options%22%3A%7B%22mode%22%3A%22module%22%2C%22prefixIdentifiers%22%3Afalse%2C%22optimizeImports%22%3Afalse%2C%22hoistStatic%22%3Afalse%2C%22cacheHandlers%22%3Afalse%2C%22scopeId%22%3Anull%2C%22inline%22%3Afalse%2C%22ssrCssVars%22%3A%22%7B%20color%20%7D%22%2C%22bindingMetadata%22%3A%7B%22TestComponent%22%3A%22setup-const%22%2C%22setupRef%22%3A%22setup-ref%22%2C%22setupConst%22%3A%22setup-const%22%2C%22setupLet%22%3A%22setup-let%22%2C%22setupMaybeRef%22%3A%22setup-maybe-ref%22%2C%22setupProp%22%3A%22props%22%2C%22vMySetupDir%22%3A%22setup-const%22%7D%2C%22optimizeBindings%22%3Afalse%7D%7D
 * 其最终目的就是在 render 函数中调用 renderSlot 取 instance.slots 内的数据
 * TODO 这里应该是一个返回一个 block ,但是暂时还没有支持 block ，所以这个暂时只需要返回一个 vnode 即可
 * 因为 block 的本质就是返回一个 vnode
 *
 * @private
 */
function renderSlots(slots, name, props) {
    // 寻找slots[name]
    // 如果存在 则使用Fragment创建虚拟节点 传入Props
    const slot = slots[name];
    if (slot) {
        // 因为 slot 是一个返回 vnode 的函数，我们只需要把这个结果返回出去即可
        // slot 就是一个函数，所以就可以把当前组件的一些数据给传出去，这个就是作用域插槽
        // 参数就是 props
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

let activeEffect; // 代表当前的副作用对象 ReactiveEffect
let shouldTrack = false; // 代表当前是否需要 track 收集依赖
const targetMap = new WeakMap();
class ReactiveEffect {
    constructor(_fn, scheduler) {
        this.active = true;
        this.deps = [];
        console.log("创建 ReactiveEffect 对象");
        this._fn = _fn;
        this.scheduler = scheduler;
    }
    run() {
        // 将this赋值给activeEffect 当前正在执行的effect
        activeEffect = this;
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        // shouldTrack为true
        // 执行fn收集依赖
        // 执行的时候给全局的 activeEffect 赋值
        // 利用全局属性来获取当前的 effect
        activeEffect = this;
        const result = this._fn();
        // 收集完依赖将关闭shouldTrack
        shouldTrack = false;
        return result;
    }
    stop() {
        // 停止响应式
        if (this.active) {
            // 清空dep
            cleanupEffect(this);
            if (this.onStop) {
                // 执行生命周期函数
                this.onStop();
            }
            // 修改active状态为false
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    // 清除effect.deps
    // 找到所有依赖这个 effect 的响应式对象
    // 从这些响应式对象里面把 effect 给删除掉
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function track(target, key) {
    if (!isTracking()) {
        return;
    }
    console.log(`触发 track -> target: ${target} key:${key}`);
    // 从targetMap中获取depsMap
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    // 寻找到当前target, key的dep后添加effect
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect)) {
        return;
    }
    // dep添加effect
    // activeEffect的上层依赖中也添加dep
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
/*
  * 没有被 effect 包裹时，由于没有副作用函数（即没有依赖，activeEffect === undefined），不应该收集依赖
  * 只有在 effect内部的情况下才会收集依赖
  * 某些特殊情况，即使包裹在 effect，也不应该收集依赖（即 shouldTrack === false）。如：组件生命周期执行、组件 setup 执行
*/
function isTracking() {
    return shouldTrack && undefined !== activeEffect;
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    // 获取target key对应的dep
    triggerEffects(dep);
}
function triggerEffects(dep) {
    // 循环dep 如果有scheduler 则执行
    // 否则run
    for (const effect of dep) {
        if (effect.scheduler) {
            // scheduler 可以让用户自己选择调用的时机
            // 这样就可以灵活的控制调用了
            // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 创建activeEffect
    extend(_effect, options);
    // 创建时执行一次
    _effect.run();
    // 创建返回值 effect会返回内部函数
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    // 把 _effect.run 这个方法返回
    // 让用户可以自行选择调用的时机（调用 fn）
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}

class ComputedRefImpl {
    constructor(getter) {
        this._dirty = true; // 初始化dirty时为true
        this._getter = getter;
        // 当依赖的响应式对象的值发生改变的时候 会通过scheduler 将dirty设置成true
        this._effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
            }
        });
    }
    get value() {
        // 如果dirty为true 则说明依赖发生过改变 或初始化状态
        // 这个时候需要重新执行effect.run() 获取最新的值
        if (this._dirty) {
            this._dirty = false;
            // 第一次run的时候会触发响应式对象 get -> 收集依赖
            this._value = this._effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRefImpl(getter);
}

class RefImpl {
    constructor(value) {
        this.__v_ifRef = true;
        this._rawValue = value;
        // 如果value是对象 --> 转成reactive
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 这时被effect包裹时 访问.value 会触发track收集依赖
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 如果ref是对象 则_value为proxy 需要用一个raw值来代替判断
        if (hasChanged(newValue, this._rawValue)) {
            // 先修改value的值
            this._rawValue = newValue;
            this._value = convert(newValue);
            // 执行trigger更新
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!(ref === null || ref === void 0 ? void 0 : ref.__v_ifRef);
}
function unRef(ref) {
    // 判断是否是ref 如果是返回ref.value 否则直接返回值
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // get -> 如果是ref 返回.value
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // 如果原来的值是ref 且新值不是ref 则替换原来的值的.value
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

const get = createGetter();
const readonlyGet = createGetter(true); // readonly的get
const set = createSetter();
const shallowReadonlyGet = createGetter(true, true); // shallowReadonly的get
/**
 * description
 * 创建getter
 *
 * @param isReadonly 是否readonly
 * @param isShallow 是否shallow
 * @return
 *
 */
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        if ("__v_isReactive" /* ReactiveFlags.IS_REACTIVE */ === key) {
            // 如果调用isReactive 返回!isReadonly
            return !isReadonly;
        }
        else if ("__v_isReadonly" /* ReactiveFlags.IS_READONLY */ === key) {
            // 如果调用isReadonly 返回isReadonly
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 如果是shallow 则直接返回res
        if (isShallow) {
            return res;
        }
        // 如果res是对象
        // 则继续对res进行readonly或reactive操作
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // 如果不是readonly 进行track
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
/**
 * @description: 创建setter
 * @param { Void }
 * @return { set }
 */
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发trigger
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} set 失败, 因为target为 readonly, ${target}`);
        return true;
    }
};
// shallowReadonly继承readonlyHandlers
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function isReactive(value) {
    return !!value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function isReadonly(value) {
    return !!value["__v_isReadonly" /* ReactiveFlags.IS_READONLY */];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function createActiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return;
    }
    return new Proxy(target, baseHandlers);
}

/**
 * description
 * emit方法
 *
 * @param instance 当前实例
 * @param event 事件名
 * @param args 传递的参数
 * @return void
 *
 */
function emit(instance, event, ...args) {
    // 如果要调用emit 则props里需要有onXXX这个Prop
    // 找到instance.props -> 寻找event
    const { props } = instance;
    // 格式化event名称 将add-two / addTwo转化成 onAddTwo
    const handlerName = toHandlerKey(camelize(event));
    // 在Props里寻找转化后的propName
    const handler = props[handlerName];
    // 如果寻找到了就去执行
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    // 将props赋值给instance.props
    console.log('初始化 props');
    // TODO
    // 应该还有 attrs 的概念
    // attrs
    // 如果组件声明了 props 的话，那么才可以进入 props 属性内
    // 不然的话是需要存储在 attrs 内
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: i => i.vnode.el,
    $slots: i => i.slots,
    $props: i => i.props
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        console.log(`触发 proxy hook , key -> : ${key}`);
        // 通过this可以获取setup返回值或prop
        if (key[0] !== '$') {
            // 说明不是访问 public api
            // 先检测访问的 key 是否存在于 setupState 中, 是的话直接返回
            if (hasOwn(setupState, key)) {
                return setupState[key];
            }
            else if (hasOwn(props, key)) {
                return props[key];
            }
        }
        const publicGetter = publicPropertiesMap[key];
        // 其他代理对象 $el等
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    // 初始化slots
    const { vnode } = instance;
    console.log('初始化 slots');
    // 判断当前节点类型是否为slotChildren
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeSlotValue(value) {
    // 把 function 返回的值转换成 array ，这样 slot 就可以支持多个元素了
    return Array.isArray(value) ? value : [value];
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // 父组件是 header: (age) => h('div', {}, age) 传参
        // value需要执行下value(props)才能得到返回结果
        // 在renderSlots时需要用函数调用的方式获取prop 所以slots[key]也是一个函数的形式
        slots[key] = props => normalizeSlotValue(value(props));
    }
}

function createComponentInstance(vnode, parent) {
    // 创建组件实例
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { }, // emit方法
    };
    // 赋值 emit
    // 这里使用 bind 把 instance 和 component 进行绑定
    // 后面用户使用的时候只需要给 event 和参数即可
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // 初始化props
    // 将instance.vnode.props赋值到instance上
    initProps(instance, instance.vnode.props);
    // 初始化slots
    initSlots(instance, instance.vnode.children);
    // 初始化有状态的component
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 创建代理对象 -> 通过this访问props/$el/$slots等
    // 1. 创建代理对象
    console.log("创建 proxy");
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    // 2. 调用setup
    // 调用 setup 的时候传入 props
    const { setup } = Component;
    if (setup) {
        // 赋值currentInstance
        // 必须要在调用 setup 之前
        setCurrentInstance(instance);
        // 调用setup 获取setup的返回值
        // 第一个参数为shallowReadonly属性的props
        // 第二个参数为 { emit }
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // 处理setup的返回值
    // TODO 后续实现function
    if (typeof setupResult === 'object') {
        // setup的返回值用proxyRef包裹
        // proxyRefs 的作用就是把 setupResult 对象做一层代理
        // 方便用户直接访问 ref 类型的值
        // 比如 setupResult 里面有个 count 是个 ref 类型的对象，用户使用的时候就可以直接使用 count 了，而不需要在 count.value
        // 这里也就是官网里面说到的自动结构 Ref 类型
        instance.setupState = proxyRefs(setupResult);
    }
    // 完成组件setup
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    // template
    if (!instance.render) {
        // render赋值
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    // 获取当前组件instance实例
    // 因为是在setup阶段赋值, 所以只能在setup阶段获取到currentInstance
    return currentInstance;
}
function setCurrentInstance(instance) {
    // 赋值currentInstance
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    // 存
    // 获取当前组件实例
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        // 当父级 key 和 爷爷级别的 key 重复的时候，对于子组件来讲，需要取最近的父级别组件的值
        // 那这里的解决方案就是利用原型链来解决
        // provides 初始化的时候是在 createComponent 时处理的，当时是直接把 parent.provides 赋值给组件的 provides 的
        // 所以，如果说这里发现 provides 和 parentProvides 相等的话，那么就说明是第一次做 provide(对于当前组件来讲)
        // 我们就可以把 parent.provides 作为 currentInstance.provides 的原型重新赋值
        // 至于为什么不在 createComponent 的时候做这个处理，可能的好处是在这里初始化的话，是有个懒执行的效果（优化点，只有需要的时候在初始化）
        // 更改prototype 使provide能够嵌套使用
        // 如果parent没有 则向上寻找
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            // 如果第一次 则通过继承父provides进行初始化
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 因为provides是层层继承的 所以只需找到parent的provide 即为所有的provides
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            // 如果没有找到 且有default 则赋值
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        // rootComponent根组件
        return {
            mount(rootContainer) {
                // component -> vnode
                // 所有的逻辑操作 都会基于vnode
                // 创建根组件vnode
                console.log("基于根组件创建 vnode");
                const vnode = createVNode(rootComponent);
                // 渲染
                console.log("调用 render，基于 vnode 进行开箱");
                render(vnode, rootContainer);
            }
        };
    };
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    //   const emits = component!.emitsOptions;
    // 这里主要是检测组件的 props
    // 核心：只要是 props 发生改变了，那么这个 component 就需要更新
    // 1. props 没有变化，那么不需要更新
    if (prevProps === nextProps) {
        return false;
    }
    // 如果之前没有 props，那么就需要看看现在有没有 props 了
    // 所以这里基于 nextProps 的值来决定是否更新
    if (!prevProps) {
        return !!nextProps;
    }
    // 之前有值，现在没值，那么肯定需要更新
    if (!nextProps) {
        return true;
    }
    // 以上都是比较明显的可以知道 props 是否是变化的
    // 在 hasPropsChanged 会做更细致的对比检测
    return hasPropsChanged(prevProps, nextProps);
}
function hasPropsChanged(prevProps, nextProps) {
    // 依次对比每一个 props.key
    // 提前对比一下 length ，length 不一致肯定是需要更新的
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }
    // 只要现在的 prop 和之前的 prop 不一样那么就需要更新
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
const p = Promise.resolve();
let isFlushPending = false;
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    // 执行所有的job
    queueFlush();
}
function queueFlush() {
    // 如果同时触发了两个组件的更新的话
    // 这里就会触发两次 then （微任务逻辑）
    // 但是着是没有必要的
    // 我们只需要触发一次即可处理完所有的 job 调用
    // 所以需要判断一下 如果已经触发过 nextTick 了
    // 那么后面就不需要再次触发一次 nextTick 逻辑了
    if (isFlushPending) {
        return;
    }
    isFlushPending = true;
    // 创建微任务
    nextTick(flushJobs);
}
function flushJobs() {
    // isFlushPending 置为false 重新记录job
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    // 传入自定义渲染方法
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, createText: hostCreateText, setText: hostSetText } = options;
    function render(vnode, container) {
        // 调用patch方法
        // 一开始没有n1新节点 传null
        patch(null, vnode, container, null, null);
    }
    // n1 老节点
    // n2 新节点
    function patch(n1, n2, container, parentComponent, anchor) {
        // 因为n2是新节点
        // 需要基于新节点的类型来判断
        const { type, shapeFlag } = n2;
        // 其中还有几个类型比如： static fragment comment
        switch (type) {
            case Fragment:
                // Fragment -> 只渲染children
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                // Text -> 渲染为textNode节点
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    // 处理element类型
                    console.log('处理 Element 类型');
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    // 处理component类型
                    console.log('处理 Component 类型');
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        // 如果是text类型 则children为text: string
        console.log('处理 Text 节点');
        if (null === n1) {
            // 如果n1没有 说明是初始化阶段
            // 使用hostCreateText创建text节点 然后insert
            console.log('初始化 Text 节点');
            hostInsert((n2.el = hostCreateText(n2.children)), container);
        }
        else {
            // update
            // 先对比一下 updated 之后的内容是否和之前的不一样
            // 在不一样的时候才需要 update text
            // 这里抽离出来的接口是 setText
            // 注意，这里一定要记得把 n1.el 赋值给 n2.el, 不然后续是找不到值的
            const el = (n2.el = n1.el);
            if (n2.children !== n1.children) {
                console.log('更新 Text 节点');
                hostSetText(el, n2.children);
            }
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        // 如果是Fragment类型 就跳过当前节点 直接mount他的子节点children
        console.log('初始化 Fragment 类型的节点');
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // 如果没有老节点 则直接mount新节点
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            // 有老节点 调用patchElement进行对比
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('应该更新 element');
        console.log('旧的 vnode', n1);
        console.log('新的 vnode', n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 获取el 供hostPatchProps使用
        const el = (n2.el = n1.el);
        // 更新props
        patchProps(el, oldProps, newProps);
        // 更新子节点children
        patchChildren(n1, n2, el, parentComponent, anchor);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        // 进行对比新老children
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 如果 n2 的 children 是 text 类型的话
            // 就看看和之前的 n1 的 children 是不是一样的
            // 如果不一样的话直接重新设置一下 text 即可
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 如果n1的children是array 那么需要清空children
                unmountChildren(n1.children);
            }
        }
        else {
            // 新节点为array类型
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                // 老节点为text
                // 1. 清空text
                hostSetElementText(container, '');
                // 2. mountChildren
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // 如果之前是 array_children
                // 现在还是 array_children 的话
                // 那么我们就需要对比两个 children 走diff算法了
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        // i 头指针
        // e1 e2分别为两个数组的尾指针
        // 头部如果相同 i ++ 一直找到不同的位置为止
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSameVNodeType(n1, n2) {
            // 基于type和key判断两个节点是否一样
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                // 如果type key相同 则调用patch去对比props和children
                console.log('两个 child 相等，接下来对比这两个 child 节点(从左往右比对)');
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                console.log('两个 child 不相等(从左往右比对)');
                console.log(`prevChild:${n1}`);
                console.log(`nextChild:${n2}`);
                break;
            }
            // 移动左侧指针
            i++;
        }
        // 右侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                // 如果type key相同 则调用patch去对比props和children
                console.log('两个 child 相等，接下来对比这两个 child 节点(从右往左比对)');
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                console.log('两个 child 不相等(从右往左比对)');
                console.log(`prevChild:${n1}`);
                console.log(`nextChild:${n2}`);
                break;
            }
            // 移动右侧指针
            e1--;
            e2--;
        }
        // 新的比老的长 创建
        // i > e1
        if (i > e1) {
            if (i <= e2) {
                // 如果是这种情况的话就说明 e2 也就是新节点的数量大于旧节点的数量
                // 也就是说新增了 vnode
                // 应该循环 c2
                // 锚点的计算：新的节点有可能需要添加到尾部，也可能添加到头部，所以需要指定添加的问题
                // 要添加的位置是当前的位置(e2 开始)+1
                // 因为对于往左侧添加的话，应该获取到 c2 的第一个元素
                // 所以我们需要从 e2 + 1 取到锚点的位置
                // 如果大于c2.length 则说明是右侧加 锚点为null 否则是左侧加 锚点为i + 1
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    // 创建新的节点 此时n1为null
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 新的比老的短
            // i > e2
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 乱序的部分 中间对比
            // 左右两边都比对完了，然后剩下的就是中间部位顺序变动的
            // 例如下面的情况
            // a,b,[c,d,e],f,g
            // a,b,[e,c,d],f,g
            // i -> 左侧 e1 -> 更新前的e  e2 -> 更新后的e
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1; // 需要patch的新节点的数量
            let patched = 0; // 已经patch过的数量
            // 通过key建立映射表
            // key -> i
            const keyToNewIndex = new Map();
            // 初始化 从新的index映射为老的index
            // 创建数组的时候给定数组的长度，这个是性能最快的写法
            const newIndexToOldIndexMap = new Array(toBePatched);
            // 初始化为 0 , 后面处理的时候 如果发现是 0 的话，那么就说明新值在老的里面不存在
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            // 是否移动了位置
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndex.set(nextChild.key, i);
            }
            // 去map里查找更新后是否存在
            // 遍历老节点
            // 1. 需要找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
            // 2. 新老节点都有的，—> 需要 patch
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 如果patch过的数量 >= 需要patch的数量
                // 说明所有新节点都已经patch过了, 老节点直接删除掉 不需要再走下面的逻辑了
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    // 这里就可以通过key快速的查找了， 看看在新的里面这个节点存在不存在
                    newIndex = keyToNewIndex.get(prevChild.key);
                }
                else {
                    // 如果没key 的话，那么只能是遍历所有的新节点来确定当前节点存在不存在了
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            // 如果是same 则说明此节点更新后也存在
                            // 给newIndex的值更新成j 然后跳出循环
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 因为有可能 nextIndex 的值为0（0也是正常值）
                // 所以需要通过值是不是 undefined 或者 null 来判断
                if (newIndex === undefined) {
                    // 如果newIndex没有被赋值, 则说明节点被删除了
                    hostRemove(prevChild.el);
                }
                else {
                    // 老节点还存在
                    console.log("新老节点都存在");
                    // 这里是确定中间的节点是不是需要移动
                    // 新的 newIndex 如果一直是升序的话，那么就说明没有移动
                    // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
                    // 不是升序的话，我们就可以确定节点移动过了
                    if (newIndex >= maxNewIndexSoFar) {
                        // 大于等于记录的点, 说明相对位置没有改变
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        // 新得到的index比记录的点小 说明需要移动位置
                        moved = true;
                    }
                    // 赋值新老节点位置的映射关系 从0开始
                    // index -> 位置
                    // 0 代表没有 所以等号右侧需要 + 1
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 调用patch深度对比
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 求最长递增子序列
            // 最长递增子序列为稳定的序列 不需要进行移动
            // [4, 2, 3] -> [1, 2]
            // 利用最长递增子序列来优化移动逻辑
            // 因为元素是升序的话，那么这些元素就是不需要移动的
            // 而我们就可以通过最长递增子序列来获取到升序的列表
            // 在移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
            // 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
            // getSequence 返回的是 newIndexToOldIndexMap 的索引值
            // 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // 创建指针
            let j = increasingNewIndexSequence.length - 1;
            // 遍历新节点
            // 1. 需要找出老节点没有，而新节点有的 -> 需要把这个节点创建
            // 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]
            // 这里倒循环是因为在 insert 的时候，需要保证锚点是处理完的节点（也就是已经确定位置了）
            // 因为 insert 逻辑是使用的 insertBefore()
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 新节点新增的
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 需要移动
                        // 1. j 已经没有了 说明剩下的都需要移动了
                        // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 在最长递增子序列内, 直接移动指针
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        // 循环children 删除子节点
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 对比 props 有以下几种情况
            // 1. oldProps 有，newProps 也有，但是 val 值变更了
            // 举个栗子
            // 之前: oldProps.id = 1 ，更新后：newProps.id = 2
            // key 存在 oldProps 里 也存在 newProps 内
            // 以 newProps 作为基准
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                // 获取改变前后的prop 进行更新
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // 2. oldProps 有，而 newProps 没有了
            // 之前： {id:1,tId:2}  更新后： {id:1}
            // 这种情况下我们就应该以 oldProps 作为基准，因为在 newProps 里面是没有的 tId 的
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    // 如果更新后key不在newProps里 删除
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(n2, container, parentComponent, anchor) {
        // 创建element节点
        const el = (n2.el = hostCreateElement(n2.type));
        const { children, props, shapeFlag } = n2;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 举个栗子
            // render(){
            //     return h("div",{},"test")
            // }
            // 这里 children 就是 test ，只需要渲染一下就完事了
            console.log(`处理文本 ${children}`);
            hostSetElementText(el, children);
        }
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 如果是array类型 调用mountChildren
            // 举个栗子
            // render(){
            // Hello 是个 component
            //     return h("div",{},[h("p"),h(Hello)])
            // }
            // 这里 children 就是个数组了，就需要依次调用 patch 递归来处理
            mountChildren(n2.children, el, parentComponent, anchor);
        }
        if (props) {
            // 循环节点的props 进行props的赋值
            // TODO
            // 需要过滤掉vue自身用的key
            // 比如生命周期相关的 key: beforeMount、mounted
            for (const key in props) {
                const val = props[key];
                hostPatchProp(el, key, null, val);
            }
        }
        // 触发beforeMount()
        console.log('vnodeHook  -> onVnodeBeforeMount');
        console.log('DirectiveHook  -> beforeMount');
        console.log('transition  -> beforeEnter');
        // 生成真实DOM 添加到页面中
        hostInsert(el, container, anchor);
        // 触发mounted()
        console.log('vnodeHook  -> onVnodeMounted');
        console.log('DirectiveHook  -> mounted');
        console.log('transition  -> enter');
    }
    function mountChildren(children, container, parentComponent, anchor) {
        // 循环children, 再次调用patch
        children.forEach(v => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // 如果没有n1 那么就是初始化mount
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        // 如果props相等 就不需要更新
        if (shouldUpdateComponent(n1, n2)) {
            console.log(`组件需要更新: ${instance}`);
            // 下次要更新的节点
            instance.next = n2;
            // 这里的 update 是在 setupRenderEffect 里面初始化的，update 函数除了当内部的响应式对象发生改变的时候会调用
            // 还可以直接主动的调用(这是属于 effect 的特性)
            // 调用 update 再次更新调用 patch 逻辑
            // 在update 中调用的 next 就变成了 n2了
            // TODO 需要在 update 中处理支持 next 的逻辑
            instance.update();
        }
        else {
            // 不执行update的话 还是需要给el vnode重新赋值的
            console.log(`组件不需要更新: ${instance}`);
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 创建组件实例
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        console.log(`创建组件实例:${instance.type.name}`);
        // 初始化组件
        setupComponent(instance);
        // 设置effect 收集依赖 获取subTree虚拟节点树
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // 调用render时 会触发响应式对象ref/reactive的get收集依赖
        // 响应式对象改变了 会触发内部的函数 自动调用render生成新的subTree
        // 保存更新函数
        instance.update = effect(() => {
            if (!instance.isMounted) {
                // 组件初始化的时候会执行这里
                // 为什么要在这里调用 render 函数呢
                // 是因为在 effect 内调用 render 才能触发依赖收集
                // 等到后面响应式的值变更后会再次触发这个函数
                console.log(`setupRenderEffect -> ${instance.type.name} -> init`);
                console.log(`${instance.type.name}:调用 render,获取 subTree`);
                const { proxy } = instance;
                // 可在 render 函数中通过 this 来使用 proxy
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // 这里触发beforeMount
                console.log(`${instance.type.name}:触发 beforeMount hook`);
                console.log(`${instance.type.name}:触发 onVnodeBeforeMount hook`);
                // 这里基于 subTree 再次调用 patch
                // 基于 render 返回的 vnode ，再次进行渲染
                // 这里我把这个行为隐喻成开箱
                // 一个组件就是一个箱子
                // 里面有可能是 element （也就是可以直接渲染的）
                // 也有可能还是 component
                // 这里就是递归的开箱
                // 而 subTree 就是当前的这个箱子（组件）装的东西
                // 箱子（组件）只是个概念，它实际是不需要渲染的
                // 要渲染的是箱子里面的 subTree
                patch(null, subTree, container, instance, anchor);
                // 更新el
                // 把 root element 赋值给 组件的vnode.el ，为后续调用 $el 的时候获取值
                initialVNode.el = subTree.el;
                // 这里触发mounted
                console.log(`${instance.type.name}:触发 mounted hook`);
                // 更新instance的状态为isMounted 依赖变更时进入else分支
                instance.isMounted = true;
            }
            else {
                // 响应式对象发生改变时会进到这里
                // 拿到新的 vnode ，然后和之前的 vnode 进行对比
                console.log(`setupRenderEffect -> ${instance.type.name} -> update`);
                console.log(`${instance.type.name}:调用更新逻辑`);
                // vnode是更新之前的 next是更新之后的
                const { proxy, next, vnode } = instance;
                // 如果有 next 的话， 说明需要更新组件的数据（props，slots 等）
                // 先更新组件的数据，然后更新完成后，在继续对比当前组件的子元素
                // 更新el
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                // 获取虚拟节点树
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                // 更新subTree
                instance.subTree = subTree;
                // 触发 beforeUpdated hook
                console.log(`${instance.type.name}:触发 beforeUpdated hook`);
                console.log(`${instance.type.name}:触发 onVnodeBeforeUpdate hook`);
                // 新旧虚拟节点数进行对比, 重新patch
                patch(prevSubTree, subTree, container, instance, anchor);
                // 触发 updated hook
                console.log(`${instance.type.name}:触发 updated hook`);
                console.log(`${instance.type.name}:触发 onVnodeUpdated hook`);
            }
        }, {
            // 如果组件中有循环的话, 那么就会多次update组件造成性能浪费
            // 将所有update作为job存储在一个队列中
            // 当所有的同步任务结束之后 再统一拿出来执行
            scheduler() {
                console.log('组件更新 ---- 执行scheduler储存jobs');
                queueJobs(instance.update);
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        // 更新 nextVNode 的组件实例
        // 现在 instance.vnode 是组件实例更新前的
        // 所以之前的 props 就是基于 instance.vnode.props 来获取
        // 接着需要更新 vnode ，方便下一次更新的时候获取到正确的值
        instance.vnode = nextVNode;
        instance.next = null;
        // 更新props
        instance.props = nextVNode.props;
    }
    return {
        createApp: createAppAPI(render)
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    // 创建element
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    // 处理prop
    // 如果是on开头的 则添加eventListener
    console.log(`PatchProp 设置属性:${key} 值:${nextVal}`);
    console.log(`key: ${key} 之前的值是:${prevVal}`);
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        // 其余的是attribute
        if (undefined === nextVal || null === nextVal) {
            // 如果prop删除了(赋值undefined或null) 则removeAttr
            el.removeAttribute(key, nextVal);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    // 添加到DOM的方法
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    // 删除的方法
    // 寻找parentNode
    // 通过parentNode.removeChild删除
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    // 设置text节点
    el.textContent = text;
}
function createText(text) {
    return document.createTextNode(text);
}
function setText(node, text) {
    node.nodeValue = text;
}
// 默认HTML DOM中的render
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
    createText,
    setText
});
function createApp(...args) {
    // main.js使用的createApp在这里
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVnode: createTextVnode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    Text: Text,
    Fragment: Fragment,
    toDisplayString: toDisplayString,
    effect: effect,
    track: track,
    trigger: trigger,
    stop: stop,
    trackEffects: trackEffects,
    triggerEffects: triggerEffects,
    isTracking: isTracking,
    computed: computed,
    ref: ref,
    isRef: isRef,
    unRef: unRef,
    proxyRefs: proxyRefs,
    reactive: reactive,
    readonly: readonly,
    isReactive: isReactive,
    isReadonly: isReadonly,
    shallowReadonly: shallowReadonly,
    isProxy: isProxy
});

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    console.log('生成render函数---------------------------------------', render);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { Fragment, Text, computed, createApp, createVNode as createElementVNode, createRenderer, createTextVnode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, isTracking, nextTick, provide, proxyRefs, reactive, readonly, ref, registerRuntimeCompiler, renderSlots, shallowReadonly, stop, toDisplayString, track, trackEffects, trigger, triggerEffects, unRef };
