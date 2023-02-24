import { Fragment, Text } from './vnode'
import { ShapeFlags, EMPTY_OBJ } from '@vue3-mini/shared'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { effect } from '@vue3-mini/reactivity'
import { shouldUpdateComponent } from './componentUpdateUtils'
import { queueJobs } from './scheduler'

export function createRenderer(options) {
  // 传入自定义渲染方法
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    createText: hostCreateText,
    setText: hostSetText
  } = options
  function render(vnode, container) {
    // 调用patch方法
    // 一开始没有n1新节点 传null
    patch(null, vnode, container, null, null)
  }

  // n1 老节点
  // n2 新节点
  function patch(n1, n2, container, parentComponent, anchor) {
    // 因为n2是新节点
    // 需要基于新节点的类型来判断
    const { type, shapeFlag } = n2
    // 其中还有几个类型比如： static fragment comment
    switch (type) {
      case Fragment:
        // Fragment -> 只渲染children
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        // Text -> 渲染为textNode节点
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理element类型
          console.log('处理 Element 类型')
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理component类型
          console.log('处理 Component 类型')
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  function processText(n1, n2: any, container: any) {
    // 如果是text类型 则children为text: string
    console.log('处理 Text 节点')
    if (null === n1) {
      // 如果n1没有 说明是初始化阶段
      // 使用hostCreateText创建text节点 然后insert
      console.log('初始化 Text 节点')
      hostInsert((n2.el = hostCreateText(n2.children as string)), container)
    } else {
      // update
      // 先对比一下 updated 之后的内容是否和之前的不一样
      // 在不一样的时候才需要 update text
      // 这里抽离出来的接口是 setText
      // 注意，这里一定要记得把 n1.el 赋值给 n2.el, 不然后续是找不到值的
      const el = (n2.el = n1.el!)
      if (n2.children !== n1.children) {
        console.log('更新 Text 节点')
        hostSetText(el, n2.children as string)
      }
    }
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 如果是Fragment类型 就跳过当前节点 直接mount他的子节点children
    console.log('初始化 Fragment 类型的节点')
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      // 如果没有老节点 则直接mount新节点
      mountElement(n2, container, parentComponent, anchor)
    } else {
      // 有老节点 调用patchElement进行对比
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log('应该更新 element')
    console.log('旧的 vnode', n1)
    console.log('新的 vnode', n2)

    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    // 获取el 供hostPatchProps使用
    const el = (n2.el = n1.el)

    // 更新props
    patchProps(el, oldProps, newProps)

    // 更新子节点children
    patchChildren(n1, n2, el, parentComponent, anchor)
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag, children: c2 } = n2

    // 进行对比新老children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果 n2 的 children 是 text 类型的话
      // 就看看和之前的 n1 的 children 是不是一样的
      // 如果不一样的话直接重新设置一下 text 即可
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 如果n1的children是array 那么需要清空children
        unmountChildren(n1.children)
      }
    } else {
      // 新节点为array类型
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老节点为text
        // 1. 清空text
        hostSetElementText(container, '')
        // 2. mountChildren
        mountChildren(c2, container, parentComponent, anchor)
      } else {
        // 如果之前是 array_children
        // 现在还是 array_children 的话
        // 那么我们就需要对比两个 children 走diff算法了
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    // i 头指针
    // e1 e2分别为两个数组的尾指针
    // 头部如果相同 i ++ 一直找到不同的位置为止
    let i = 0
    const l2 = c2.length
    const l1 = c1.length
    let e1 = l1 - 1
    let e2 = l2 - 1

    function isSameVNodeType(n1, n2) {
      // 基于type和key判断两个节点是否一样
      return n1.type === n2.type && n1.key === n2.key
    }

    // 左侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSameVNodeType(n1, n2)) {
        // 如果type key相同 则调用patch去更新props和children
        console.log(
          '两个 child 相等，接下来对比这两个 child 节点(从左往右比对)'
        )
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        console.log('两个 child 不相等(从左往右比对)')
        console.log(`prevChild:${n1}`)
        console.log(`nextChild:${n2}`)
        break
      }
      // 移动左侧指针
      i++
    }

    // 右侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      if (isSameVNodeType(n1, n2)) {
        // 如果type key相同 则调用patch去对比props和children
        console.log(
          '两个 child 相等，接下来对比这两个 child 节点(从右往左比对)'
        )
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        console.log('两个 child 不相等(从右往左比对)')
        console.log(`prevChild:${n1}`)
        console.log(`nextChild:${n2}`)
        break
      }
      // 移动右侧指针
      e1--
      e2--
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
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        // 循环patch创建
        while (i <= e2) {
          // 创建新的节点 此时n1为null
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 新的比老的短
      // i > e2
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // 乱序的部分 中间对比
      // 左右两边都比对完了，然后剩下的就是中间部位顺序变动的
      // 例如下面的情况
      // a,b,[c,d,e],f,g
      // a,b,[e,c,d],f,g
      // i -> 左侧 e1 -> 更新前的e  e2 -> 更新后的e
      let s1 = i
      let s2 = i
      const toBePatched = e2 - s2 + 1 // 需要patch的新节点的数量
      let patched = 0 // 已经patch过的数量
      // 通过key建立映射表
      // key -> i
      const keyToNewIndex = new Map()
      // 初始化 从新的index映射为老的index
      // 创建数组的时候给定数组的长度，这个是性能最快的写法
      const newIndexToOldIndexMap = new Array(toBePatched)
      // 初始化为 0 , 后面处理的时候 如果发现是 0 的话，那么就说明新值在老的里面不存在
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0
      }

      // 是否移动了位置
      let moved = false
      let maxNewIndexSoFar = 0

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndex.set(nextChild.key, i)
      }

      // 去map里查找更新后是否存在
      // 遍历老节点
      // 1. 需要找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
      // 2. 新老节点都有的，—> 需要 patch
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        // 如果patch过的数量 >= 需要patch的数量
        // 说明所有新节点都已经patch过了, 老节点直接删除掉 不需要再走下面的逻辑了
        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }
        let newIndex
        if (prevChild.key != null) {
          // 这里就可以通过key快速的查找了， 看看在新的里面这个节点存在不存在
          newIndex = keyToNewIndex.get(prevChild.key)
        } else {
          // 如果没key 的话，那么只能是遍历所有的新节点来确定当前节点存在不存在了
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              // 如果是same 则说明此节点更新后也存在
              // 给newIndex的值更新成j 然后跳出循环
              newIndex = j
              break
            }
          }
        }

        // 因为有可能 nextIndex 的值为0（0也是正常值）
        // 所以需要通过值是不是 undefined 或者 null 来判断
        if (newIndex === undefined) {
          // 如果newIndex没有被赋值, 则说明节点被删除了
          hostRemove(prevChild.el)
        } else {
          // 老节点还存在
          console.log('新老节点都存在')

          // 这里是确定中间的节点是不是需要移动
          // 新的 newIndex 如果一直是升序的话，那么就说明没有移动
          // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
          // 不是升序的话，我们就可以确定节点移动过了
          if (newIndex >= maxNewIndexSoFar) {
            // 大于等于记录的点, 说明相对位置没有改变
            maxNewIndexSoFar = newIndex
          } else {
            // 新得到的index比记录的点小 说明需要移动位置
            moved = true
          }
          // 赋值新老节点位置的映射关系 从0开始
          // index -> 位置
          // 0 代表没有 所以等号右侧需要 + 1
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          // 调用patch深度对比
          patch(prevChild, c2[newIndex], container, parentComponent, null)
          patched++
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
        : []
      // 创建指针
      let j = increasingNewIndexSequence.length - 1

      // 遍历新节点
      // 1. 需要找出老节点没有，而新节点有的 -> 需要把这个节点创建
      // 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]
      // 这里倒循环是因为在 insert 的时候，需要保证锚点是处理完的节点（也就是已经确定位置了）
      // 因为 insert 逻辑是使用的 insertBefore()
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
        if (newIndexToOldIndexMap[i] === 0) {
          // 新节点新增的
          patch(null, nextChild, container, parentComponent, anchor)
        }
        if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // 需要移动
            // 1. j 已经没有了 说明剩下的都需要移动了
            // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
            hostInsert(nextChild.el, container, anchor)
          } else {
            // 在最长递增子序列内, 直接移动指针
            j--
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    // 循环children 删除子节点
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      hostRemove(el)
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
        const prevProp = oldProps[key]
        const nextProp = newProps[key]
        // 获取改变前后的prop 进行更新
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }
      // 2. oldProps 有，而 newProps 没有了
      // 之前： {id:1,tId:2}  更新后： {id:1}
      // 这种情况下我们就应该以 oldProps 作为基准，因为在 newProps 里面是没有的 tId 的
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          // 如果更新后key不在newProps里 删除
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  function mountElement(n2: any, container: any, parentComponent, anchor) {
    // 创建element节点
    const el = (n2.el = hostCreateElement(n2.type))
    const { children, props, shapeFlag } = n2

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 举个栗子
      // render(){
      //     return h("div",{},"test")
      // }
      // 这里 children 就是 test ，只需要渲染一下就完事了
      console.log(`处理文本 ${children}`)
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果是array类型 调用mountChildren
      // 举个栗子
      // render(){
      // Hello 是个 component
      //     return h("div",{},[h("p"),h(Hello)])
      // }
      // 这里 children 就是个数组了，就需要依次调用 patch 递归来处理
      mountChildren(n2.children, el, parentComponent, anchor)
    }
    if (props) {
      // 循环节点的props 进行props的赋值
      // TODO
      // 需要过滤掉vue自身用的key
      // 比如生命周期相关的 key: beforeMount、mounted
      for (const key in props) {
        const val = props[key]
        hostPatchProp(el, key, null, val)
      }
    }

    // 触发beforeMount()
    console.log('vnodeHook  -> onVnodeBeforeMount')
    console.log('DirectiveHook  -> beforeMount')
    console.log('transition  -> beforeEnter')

    // 生成真实DOM 添加到页面中
    hostInsert(el, container, anchor)

    // 触发mounted()
    console.log('vnodeHook  -> onVnodeMounted')
    console.log('DirectiveHook  -> mounted')
    console.log('transition  -> enter')
  }

  function mountChildren(children, container, parentComponent, anchor) {
    // 循环children, 再次调用patch
    children.forEach(v => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      // 如果没有n1 那么就是初始化mount
      mountComponent(n2, container, parentComponent, anchor)
    } else {
      updateComponent(n1, n2)
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component)
    // 如果props相等 就不需要更新
    if (shouldUpdateComponent(n1, n2)) {
      console.log(`组件需要更新: ${instance}`)
      // 下次要更新的节点
      instance.next = n2
      // 这里的 update 是在 setupRenderEffect 里面初始化的，update 函数除了当内部的响应式对象发生改变的时候会调用
      // 还可以直接主动的调用(这是属于 effect 的特性)
      // 调用 update 再次更新调用 patch 逻辑
      // 在update 中调用的 next 就变成了 n2了
      // TODO 需要在 update 中处理支持 next 的逻辑
      instance.update()
    } else {
      // 不执行update的话 还是需要给el vnode重新赋值的
      console.log(`组件不需要更新: ${instance}`)
      n2.el = n1.el
      instance.vnode = n2
    }
  }

  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 创建组件实例
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ))
    console.log(`创建组件实例:${instance.type.name}`)
    // 初始化组件
    setupComponent(instance)
    // 设置effect 收集依赖 获取subTree虚拟节点树
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  function setupRenderEffect(
    instance: any,
    initialVNode: any,
    container: any,
    anchor
  ) {
    // 调用render时 会触发响应式对象ref/reactive的get收集依赖
    // 响应式对象改变了 会触发内部的函数 自动调用render生成新的subTree
    // 保存更新函数
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          // 组件初始化的时候会执行这里
          // 为什么要在这里调用 render 函数呢
          // 是因为在 effect 内调用 render 才能触发依赖收集
          // 等到后面响应式的值变更后会再次触发这个函数
          console.log(`setupRenderEffect -> ${instance.type.name} -> init`)
          console.log(`${instance.type.name}:调用 render,获取 subTree`)
          const { proxy } = instance
          // 可在 render 函数中通过 this 来使用 proxy
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          ))

          // 这里触发beforeMount
          console.log(`${instance.type.name}:触发 beforeMount hook`)
          console.log(`${instance.type.name}:触发 onVnodeBeforeMount hook`)

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
          patch(null, subTree, container, instance, anchor)

          // 更新el
          // 把 root element 赋值给 组件的vnode.el ，为后续调用 $el 的时候获取值
          initialVNode.el = subTree.el

          // 这里触发mounted
          console.log(`${instance.type.name}:触发 mounted hook`)
          // 更新instance的状态为isMounted 依赖变更时进入else分支
          instance.isMounted = true
        } else {
          // 响应式对象发生改变时会进到这里
          // 拿到新的 vnode ，然后和之前的 vnode 进行对比
          console.log(`setupRenderEffect -> ${instance.type.name} -> update`)
          console.log(`${instance.type.name}:调用更新逻辑`)
          // vnode是更新之前的 next是更新之后的
          const { proxy, next, vnode } = instance
          // 如果有 next 的话， 说明需要更新组件的数据（props，slots 等）
          // 先更新组件的数据，然后更新完成后，在继续对比当前组件的子元素
          // 更新el
          if (next) {
            next.el = vnode.el
            updateComponentPreRender(instance, next)
          }
          // 获取虚拟节点树
          const subTree = instance.render.call(proxy, proxy)
          const prevSubTree = instance.subTree
          // 更新subTree
          instance.subTree = subTree

          // 触发 beforeUpdated hook
          console.log(`${instance.type.name}:触发 beforeUpdated hook`)
          console.log(`${instance.type.name}:触发 onVnodeBeforeUpdate hook`)

          // 新旧虚拟节点数进行对比, 重新patch
          patch(prevSubTree, subTree, container, instance, anchor)

          // 触发 updated hook
          console.log(`${instance.type.name}:触发 updated hook`)
          console.log(`${instance.type.name}:触发 onVnodeUpdated hook`)
        }
      },
      {
        // 如果组件中有循环的话, 那么就会多次update组件造成性能浪费
        // 将所有update作为job存储在一个队列中
        // 当所有的同步任务结束之后 再统一拿出来执行
        scheduler() {
          console.log('组件更新 ---- 执行scheduler储存jobs')
          queueJobs(instance.update)
        }
      }
    )
  }

  function updateComponentPreRender(instance, nextVNode) {
    // 更新 nextVNode 的组件实例
    // 现在 instance.vnode 是组件实例更新前的
    // 所以之前的 props 就是基于 instance.vnode.props 来获取
    // 接着需要更新 vnode ，方便下一次更新的时候获取到正确的值
    instance.vnode = nextVNode
    instance.next = null
    // 更新props
    instance.props = nextVNode.props
  }

  return {
    createApp: createAppAPI(render)
  }
}

function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
