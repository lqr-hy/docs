### 1、completeWork

```javascript
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  // 获取待处理的 props
  const newProps = workInProgress.pendingProps

  // 根据 workInProgress 的标签类型进行不同的处理
  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      // 对于这些类型，只需要冒泡子树的属性
      bubbleProperties(workInProgress)
      return null
    case ClassComponent: {
      // 处理类组件
      const Component = workInProgress.type
      if (isLegacyContextProvider(Component)) {
        popLegacyContext(workInProgress)
      }
      bubbleProperties(workInProgress)
      return null
    }
    case HostRoot: {
      // 处理根节点
      const fiberRoot = (workInProgress.stateNode: FiberRoot)

      // 处理过渡和缓存
      if (enableTransitionTracing) {
        // ... 处理过渡追踪逻辑
      }
      if (enableCache) {
        // ... 处理缓存逻辑
      }

      // 弹出各种上下文
      popHostContainer(workInProgress)
      popTopLevelLegacyContextObject(workInProgress)
      // ... 处理待处理的上下文

      // 更新主机容器
      updateHostContainer(current, workInProgress)
      bubbleProperties(workInProgress)
      return null
    }
    case HostComponent: {
      // 处理宿主组件（如 DOM 元素）
      popHostContext(workInProgress)
      const rootContainerInstance = getRootHostContainer()
      const type = workInProgress.type

      if (current !== null && workInProgress.stateNode != null) {
        // 更新现有的宿主组件
        updateHostComponent(current, workInProgress, type, newProps, rootContainerInstance)

        if (current.ref !== workInProgress.ref) {
          markRef(workInProgress)
        }
      } else {
        // 创建新的宿主组件
        if (!newProps) {
          // 如果没有新的 props，可能是一个占位符
          bubbleProperties(workInProgress)
          return null
        }

        const currentHostContext = getHostContext()
        // 创建宿主组件实例
        const instance = createInstance(
          type,
          newProps,
          rootContainerInstance,
          currentHostContext,
          workInProgress
        )

        // 将子节点附加到新创建的实例上
        appendAllChildren(instance, workInProgress, false, false)

        workInProgress.stateNode = instance

        // 初始化宿主组件的属性
        if (
          finalizeInitialChildren(
            instance,
            type,
            newProps,
            rootContainerInstance,
            currentHostContext
          )
        ) {
          markUpdate(workInProgress)
        }

        if (workInProgress.ref !== null) {
          markRef(workInProgress)
        }
      }
      bubbleProperties(workInProgress)
      return null
    }
    // ... 其他类型的处理（如 HostText, SuspenseComponent 等）

    case OffscreenComponent:
    case LegacyHiddenComponent: {
      // 处理 Offscreen 和 LegacyHidden 组件
      popRenderLanes(workInProgress)
      const nextState: OffscreenState | null = workInProgress.memoizedState
      const nextIsHidden = nextState !== null

      if (current !== null) {
        const prevState: OffscreenState | null = current.memoizedState
        const prevIsHidden = prevState !== null
        if (prevIsHidden !== nextIsHidden && newProps.mode !== 'unstable-defer-without-hiding') {
          workInProgress.flags |= Visibility
        }
      }

      if (!nextIsHidden || (workInProgress.mode & ConcurrentMode) === NoMode) {
        bubbleProperties(workInProgress)
      } else {
        // 不要冒泡隐藏的属性
        bubbleProperties(workInProgress)
      }
      return null
    }
  }

  // 如果到达这里，说明遇到了未知的工作类型
  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      'React. Please file an issue.'
  )
}
```

1. 主要职责：

   1. 创建或更新 `DOM` 节点：

      - 对于宿主组件（如 `div、span` 等），创建或更新实际的 `DOM` 节点。
      - 设置 `DOM` 节点的属性、事件监听器等。

   2. 处理副作用：

      - 收集和标记需要在 `commit` 阶段执行的副作用（如 `DOM` 更新、生命周期方法调用等）。

   3. 冒泡属性：

      - 将子节点的副作用标志向上冒泡到父节点，确保父节点能够正确处理子节点的变化。

   4. 处理上下文：

      - 对于某些特殊的组件类型（如 `ContextProvider`），处理上下文的变化。

   5. 性能优化：

      - 实现一些优化策略，如复用已有的 DOM 节点以减少不必要的创建和删除操作。

   6. 处理特殊情况：

      - 对不同类型的组件（如函数组件、类组件、宿主组件等）进行特殊处理。

   7. 准备 `commit` 阶段：

      - 为 `commit` 阶段做准备，确保所有必要的信息都已收集和处理。

2. 关键步骤：

   - 根据 `Fiber` 节点的类型执行相应的完成逻辑：

   - 处理 `HostComponent`（宿主组件）：

     > 创建或更新 DOM 节点

     > 处理 `props` 和事件监听器

   - 处理 `ContextProvider`：

     > 处理上下文的变化

   - 处理 `SuspenseComponent`：

     > 管理挂起状态和水合过程

   - 冒泡属性和副作用标志：

     > `bubbleProperties`

3. 优化策略：

   - 复用已有的 DOM 节点
   - 智能地处理属性更新，避免不必要的操作
   - 使用标志系统来高效地标记和处理副作用

4. 重要的辅助函数：

   - `bubbleProperties`: 用于向上冒泡属性和副作用标志
   - `markUpdate`: 标记需要更新的节点
   - `prepareUpdate`: 准备更新信息

5. 性能考虑：

   - 智能地决定是否需要创建新的 DOM 节点或更新现有节点
   - 使用位运算来高效地处理标志

`completeWork` 函数是 React 协调过程的另一个核心部分，代表了 Fiber 树的"归"阶段。它负责处理每个 Fiber 节点的完成工作，为 commit 阶段做准备，并确保所有必要的信息都被正确收集和处理。通过智能地处理 DOM 更新和副作用，这个函数在很大程度上影响了 React 的性能和渲染效率。

### 2、bubbleProperties

```js
function bubbleProperties(completedWork: Fiber) {
  const didBailout = // 定义一个常量，表示是否进行了bailout（跳过）操作
    completedWork.alternate !== null && // 检查是否存在备用fiber
    completedWork.alternate.child === completedWork.child // 检查备用fiber的子节点是否与当前fiber的子节点相同

  let newChildLanes: Lanes = NoLanes // 初始化新的子Lane，用于跟踪子树中的优先级
  let subtreeFlags = NoFlags // 初始化子树标志，用于收集子树中的副作用

  if (!didBailout) {
    // 如果没有进行bailout操作
    if (enableProfilerTimer && (completedWork.mode & ProfileMode) !== NoMode) {
      // 如果启用了分析器计时器且当前fiber处于分析模式
      let actualDuration = completedWork.actualDuration // 获取实际持续时间
      let treeBaseDuration = ((completedWork.selfBaseDuration: any): number) // 获取树基础持续时间

      let child = completedWork.child // 获取第一个子节点
      while (child !== null) {
        // 遍历所有子节点
        newChildLanes = mergeLanes(
          // 合并Lane
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes)
        )

        subtreeFlags |= child.subtreeFlags // 合并子树标志
        subtreeFlags |= child.flags // 合并子节点标志

        actualDuration += child.actualDuration // 累加实际持续时间

        treeBaseDuration += child.treeBaseDuration // 累加树基础持续时间
        child = child.sibling // 移动到下一个兄弟节点
      }

      completedWork.actualDuration = actualDuration // 更新完成工作的实际持续时间
      completedWork.treeBaseDuration = treeBaseDuration // 更新完成工作的树基础持续时间
    } else {
      // 如果不在分析模式下
      let child = completedWork.child // 获取第一个子节点
      while (child !== null) {
        // 遍历所有子节点
        newChildLanes = mergeLanes(
          // 合并Lane
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes)
        )

        subtreeFlags |= child.subtreeFlags // 合并子树标志
        subtreeFlags |= child.flags // 合并子节点标志

        child.return = completedWork // 更新子节点的返回指针

        child = child.sibling // 移动到下一个兄弟节点
      }
    }

    completedWork.subtreeFlags |= subtreeFlags // 更新完成工作的子树标志
  } else {
    // 如果进行了bailout操作
    // Bubble up the earliest expiration time.
    if (enableProfilerTimer && (completedWork.mode & ProfileMode) !== NoMode) {
      // 如果启用了分析器计时器且当前fiber处于分析模式
      let treeBaseDuration = ((completedWork.selfBaseDuration: any): number) // 获取树基础持续时间

      let child = completedWork.child // 获取第一个子节点
      while (child !== null) {
        // 遍历所有子节点
        newChildLanes = mergeLanes(
          // 合并Lane
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes)
        )

        subtreeFlags |= child.subtreeFlags & StaticMask // 合并静态子树标志
        subtreeFlags |= child.flags & StaticMask // 合并静态子节点标志

        treeBaseDuration += child.treeBaseDuration // 累加树基础持续时间
        child = child.sibling // 移动到下一个兄弟节点
      }

      completedWork.treeBaseDuration = treeBaseDuration // 更新完成工作的树基础持续时间
    } else {
      // 如果不在分析模式下
      let child = completedWork.child // 获取第一个子节点
      while (child !== null) {
        // 遍历所有子节点
        newChildLanes = mergeLanes(
          // 合并Lane
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes)
        )

        subtreeFlags |= child.subtreeFlags & StaticMask // 合并静态子树标志
        subtreeFlags |= child.flags & StaticMask // 合并静态子节点标志

        child.return = completedWork // 更新子节点的返回指针

        child = child.sibling // 移动到下一个兄弟节点
      }
    }

    completedWork.subtreeFlags |= subtreeFlags // 更新完成工作的子树标志
  }

  completedWork.childLanes = newChildLanes // 更新完成工作的子Lane

  return didBailout // 返回是否进行了bailout操作
}
```

`bubbleProperties` 函数是 React Fiber 架构中的一个重要函数，主要负责将子节点的属性和副作用向上冒泡到父节点。根据提供的代码，我们可以总结出 `bubbleProperties` 的主要功能：

1. 合并子节点的副作用标志：

   - 将子节点的 `subtreeFlags` 和 `flags` 合并到父节点的 `subtreeFlags` 中。
   - 这确保了父节点能够感知到其所有子孙节点的副作用。

2. 更新 `childLanes`：

   - 将子节点的 `childLanes` 合并到父节点的 `childLanes` 中。
   - 这有助于跟踪哪些优先级的更新需要在子树中进行。

3. 处理 `deletions`：

   - 如果子节点有需要删除的内容，将其添加到父节点的 `deletions` 数组中。
   - 这确保了在提交阶段能正确处理需要删除的节点。

4. 更新 `subtreeFlags`：

   - 将子节点的特定标志（如 `ForceUpdateForLegacySuspense`）添加到父节点的 `subtreeFlags` 中。

5. 性能优化：
   - 使用位运算来高效地合并标志。
   - 只在必要时创建 `deletions` 数组，以节省内存。

通过这种方式，`bubbleProperties` 确保了父节点能够正确地反映其整个子树的状态，这对于 React 的协调过程和后续的提交阶段都是至关重要的。它帮助 React 高效地确定哪些部分的树需要更新，以及如何更新。
