### 1、ReactFiber

[查看 React 源代码](https://github.com/lqr-hy/react)

```javascript
function FiberNode(tag: WorkTag, pendingProps: mixed, key: null | string, mode: TypeOfMode) {
  // 标识 Fiber 节点类型的标签（如函数组件、类组件、原生组件等）
  this.tag = tag
  // React 元素的 key 属性，用于优化更新过程
  this.key = key
  // 元素的类型，如 'div', MyComponent 等
  this.elementType = null
  // 对于类组件，指向类构造函数；对于原生组件，指向标签名
  this.type = null
  // 指向与 Fiber 关联的实际 DOM 节点或组件实例
  this.stateNode = null

  // Fiber 树结构相关
  // 指向父 Fiber 节点
  this.return = null
  // 指向第一个子 Fiber 节点
  this.child = null
  // 指向下一个兄弟 Fiber 节点
  this.sibling = null
  // 在兄弟节点中的索引
  this.index = 0

  // ref 相关
  this.ref = null
  this.refCleanup = null

  // 即将更新的 props
  this.pendingProps = pendingProps
  // 上一次渲染使用的 props
  this.memoizedProps = null
  // 更新队列，存储组件的状态更新
  this.updateQueue = null
  // 上一次渲染后的 state
  this.memoizedState = null
  // 用于 Context 和 useEffect 的依赖项
  this.dependencies = null

  // 渲染模式（如 Strict Mode）
  this.mode = mode

  // 副作用标记，表示节点需要进行的操作（如更新、删除等）
  this.flags = NoFlags
  // 子树中的副作用标记
  this.subtreeFlags = NoFlags
  // 需要删除的子节点列表
  this.deletions = null

  // 调度优先级相关
  this.lanes = NoLanes
  this.childLanes = NoLanes

  // 指向对应的 workInProgress Fiber 或 current Fiber
  this.alternate = null

  // ... 其他属性和开发模式下的属性
}
```

1. 节点类型和标识：tag, key, elementType, type

2. DOM 或组件实例引用：stateNode

3. Fiber 树结构：return, child, sibling, index

4. Ref 相关：ref, refCleanup

5. Props 和 State：pendingProps, memoizedProps, updateQueue, memoizedState

6. 依赖项和模式：dependencies, mode

7. 副作用相关：flags, subtreeFlags, deletions

8. 调度优先级：lanes, childLanes

9. 双缓存机制：alternate

这些属性共同构成了 Fiber 节点的完整结构，支持 React 的协调过程、更新机制和渲染优化。

### 2、createWorkInProgress

```javascript
// 创建或更新 workInProgress Fiber
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  // 尝试获取当前 Fiber 的 alternate
  let workInProgress = current.alternate

  if (workInProgress === null) {
    // 如果没有 alternate，创建新的 Fiber
    // 这通常发生在首次渲染或者 Fiber 被卸载后重新挂载时
    workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode)

    // 复制 current Fiber 的一些不变属性
    workInProgress.elementType = current.elementType
    workInProgress.type = current.type
    workInProgress.stateNode = current.stateNode

    if (__DEV__) {
      // 开发模式下，复制调试相关的属性
      workInProgress._debugOwner = current._debugOwner
      if (enableOwnerStacks) {
        workInProgress._debugStack = current._debugStack
        workInProgress._debugTask = current._debugTask
      }
      workInProgress._debugHookTypes = current._debugHookTypes
    }

    // 建立双向链接，实现双缓存
    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    // 如果已有 alternate，更新现有的 workInProgress Fiber
    // 这种情况在后续的更新中更常见
    workInProgress.pendingProps = pendingProps
    // Needed because Blocks store data on type.
    workInProgress.type = current.type

    // 重置 effect 标记，准备新的更新
    workInProgress.flags = NoFlags
    workInProgress.subtreeFlags = NoFlags
    workInProgress.deletions = null

    if (enableProfilerTimer) {
      // 重置性能计时器相关属性
      // 这防止了时间在新的提交中无限累积
      workInProgress.actualDuration = 0
      workInProgress.actualStartTime = -1
    }
  }

  // 复制 current Fiber 的一些属性到 workInProgress
  // 保留静态 flags，这些不特定于某次渲染
  workInProgress.flags = current.flags & StaticMask
  workInProgress.childLanes = current.childLanes
  workInProgress.lanes = current.lanes

  // 复制子树结构
  workInProgress.child = current.child
  workInProgress.memoizedProps = current.memoizedProps
  workInProgress.memoizedState = current.memoizedState
  workInProgress.updateQueue = current.updateQueue

  // 克隆依赖对象
  // 这是因为依赖对象在渲染阶段可能会被修改，不能共享
  const currentDependencies = current.dependencies
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
          lanes: currentDependencies.lanes,
          firstContext: currentDependencies.firstContext
        }

  // 这些属性将在父节点的协调过程中被覆盖
  workInProgress.sibling = current.sibling
  workInProgress.index = current.index
  workInProgress.ref = current.ref
  workInProgress.refCleanup = current.refCleanup

  if (enableProfilerTimer) {
    // 复制性能分析相关属性
    workInProgress.selfBaseDuration = current.selfBaseDuration
    workInProgress.treeBaseDuration = current.treeBaseDuration
  }

  if (__DEV__) {
    // 开发模式下，复制额外的调试信息
    workInProgress._debugInfo = current._debugInfo
    workInProgress._debugNeedsRemount = current._debugNeedsRemount
    // 根据组件类型解析热重载后的类型
    // 这确保了在开发过程中的热重载能正确更新组件类型
    switch (workInProgress.tag) {
      case FunctionComponent:
      case SimpleMemoComponent:
        workInProgress.type = resolveFunctionForHotReloading(current.type)
        break
      case ClassComponent:
        workInProgress.type = resolveClassForHotReloading(current.type)
        break
      case ForwardRef:
        workInProgress.type = resolveForwardRefForHotReloading(current.type)
        break
      default:
        break
    }
  }

  return workInProgress
}
```

1. 双缓存技术：

   - React 使用双缓存来处理更新，`current` 表示当前渲染的 Fiber 树，`workInProgress` 是正在构建的新 Fiber 树。

2. 复用 Fiber 节点：

   - 如果 `alternate` 已存在，就复用它而不是创建新的，这有助于提高内存效率。

3. 属性复制：

   - 大部分属性从 `current` 复制到 `workInProgress`，这样可以保留之前的状态和结构。

4. 重置 flags：

   - 清除之前的副作用标记，为新的更新做准备。

5. 性能优化：

   - 重置性能计时器相关的属性，防止时间无限累积。

6. 开发模式支持：

   - 在开发模式下，额外处理了热重载相关的逻辑，确保组件类型能够正确更新。

7. 依赖克隆：
   - 克隆依赖对象而不是直接复用，因为这些对象在渲染过程中可能会被修改。

这个函数是 React Fiber 架构中实现增量渲染和高效更新的关键部分。通过创建或更新 `workInProgress` Fiber，React 可以在后台准备新的渲染树，而不影响当前显示的内容，从而实现更流畅的用户体验和更好的性能。

### 3、resetWorkInProgress

```javascript
// 用于重置 workInProgress Fiber 以进行第二次渲染
export function resetWorkInProgress(workInProgress: Fiber, renderLanes: Lanes): Fiber {
  // 这个函数将 Fiber 重置为 createFiber 或 createWorkInProgress 在第一次渲染时设置的值
  // 理想情况下，这不应该是必要的，但许多代码路径在应该读取 current 和写入 workInProgress 时
  // 却从 workInProgress 读取

  // 我们假设 pendingProps, index, key, ref, return 仍然未被触及
  // 以避免进行另一次协调

  // 重置 effect flags，但保留任何 Placement 标记
  // 因为这是子 Fiber 设置的，而不是协调过程
  workInProgress.flags &= StaticMask | Placement

  // 副作用不再有效

  const current = workInProgress.alternate
  if (current === null) {
    // 重置为 createFiber 的初始值
    workInProgress.childLanes = NoLanes
    workInProgress.lanes = renderLanes

    workInProgress.child = null
    workInProgress.subtreeFlags = NoFlags
    workInProgress.memoizedProps = null
    workInProgress.memoizedState = null
    workInProgress.updateQueue = null

    workInProgress.dependencies = null

    workInProgress.stateNode = null

    if (enableProfilerTimer) {
      // 注意：我们不重置 actualTime 计数
      // 在多次渲染过程中累积实际时间是有用的
      workInProgress.selfBaseDuration = 0
      workInProgress.treeBaseDuration = 0
    }
  } else {
    // 重置为 createWorkInProgress 会克隆的值
    workInProgress.childLanes = current.childLanes
    workInProgress.lanes = current.lanes

    workInProgress.child = current.child
    workInProgress.subtreeFlags = NoFlags
    workInProgress.deletions = null
    workInProgress.memoizedProps = current.memoizedProps
    workInProgress.memoizedState = current.memoizedState
    workInProgress.updateQueue = current.updateQueue
    // 需要这个，因为 Blocks 在 type 上存储数据
    workInProgress.type = current.type

    // 克隆依赖对象。这在渲染阶段被修改，所以不能与当前 fiber 共享
    const currentDependencies = current.dependencies
    workInProgress.dependencies =
      currentDependencies === null
        ? null
        : {
            lanes: currentDependencies.lanes,
            firstContext: currentDependencies.firstContext
          }

    if (enableProfilerTimer) {
      // 注意：我们不重置 actualTime 计数
      // 在多次渲染过程中累积实际时间是有用的
      workInProgress.selfBaseDuration = current.selfBaseDuration
      workInProgress.treeBaseDuration = current.treeBaseDuration
    }
  }

  return workInProgress
}
```

1. 重置目的：

   - 这个函数用于在需要进行第二次渲染时重置 `workInProgress` Fiber。这种情况可能发生在第一次渲染被中断或无效时。

2. 保留关键属性：

   - 函数假设某些属性（如 `pendingProps`, `index`, `key`, `ref`, `return`）没有被更改，以避免不必要的协调。

3. 重置 flags：

   - 清除大部分副作用标记，但保留 `Placement` 标记，因为这通常是由子 Fiber 设置的。

4. 处理两种情况：

   - 如果没有 `alternate`（即 `current === null`），将 Fiber 重置为初始状态。
   - 如果有 `alternate`，则从 `current` Fiber 复制大部分属性。

5. 性能优化：

   - 对于 Profiler 计时器，不重置 `actualTime` 计数，因为在多次渲染中累积实际时间是有用的。

6. 依赖处理：

   - 克隆依赖对象而不是直接复用，因为这些对象在渲染过程中可能会被修改。

7. 保持一致性：
   - 确保 `workInProgress` Fiber 的状态与 `current` Fiber 保持一致，或者在没有 `current` 时恢复到初始状态。

这个函数在 React 的渲染过程中扮演着重要角色，特别是在需要重新开始渲染时。它确保了 `workInProgress` Fiber 处于正确的状态，可以进行新的渲染周期，同时保留了必要的信息以提高效率。这种机制有助于 React 在复杂的更新场景中保持高效和一致性。

### 4、Fiber 架构的优势

1.  **增量渲染（Incremental Rendering）**

    - Fiber 允许 React 将渲染工作分割为小块，以便在空闲时间进行处理。这样可以避免阻塞主线程，提升用户体验。

2.  **调度优先级（Prioritized Scheduling）**

    - Fiber 引入了任务优先级调度机制，允许 React 根据任务的重要性来调整渲染顺序。高优先级任务（如用户交互）可以优先处理，而低优先级任务（如动画）可以推迟。

3.  **Fiber 树（Fiber Tree）**

    - Fiber 架构引入了 Fiber 树，每个 Fiber 节点代表一个 React 元素。每个节点包含组件的状态、上下文和其他相关信息，使得 React 更容易在不同的渲染阶段进行跟踪和管理。

4.  **上下文管理**

    - Fiber 使得上下文的管理更加灵活，可以轻松处理复杂的组件嵌套和状态传递。

5.  **错误处理**

    - Fiber 改进了错误边界的处理机制，能够更好地捕获和处理渲染过程中的错误，提高了应用的稳定性。

6.  **协作调度（Cooperative Scheduling）**

    - Fiber 允许 React 在渲染时中断和恢复任务，这样可以在需要时做出响应，而不会丢失当前的渲染进度。

7.  **提升可扩展性**
    - Fiber 架构的设计使得未来的功能（如 Suspense 和 Concurrent Mode）更容易集成和实现，提高了 React 的可扩展性。

### 6、总结

ReactFiber 是 React 性能优化的关键部分,它通过增量渲染和优先级调度大大提高了 React 应用的性能和用户体验。虽然其内部实现复杂,但它为 React 提供了强大的基础,支持更高级的特性如并发模式和 Suspense。
