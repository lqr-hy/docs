### 1、beginWork

```js
function beginWork(
  current: Fiber | null,  // 当前 Fiber 节点，可能为 null
  workInProgress: Fiber,  // 正在进行工作的 Fiber 节点
  renderLanes: Lanes,  // 渲染优先级
): Fiber | null {  // 返回类型为 Fiber 或 null
  if (__DEV__) {  // 如果是开发环境
    if (workInProgress._debugNeedsRemount && current !== null) {  // 如果需要重新挂载且 current 不为 null
      // 这将使用新的 fiber 重新启动开始阶段。
      const copiedFiber = createFiberFromTypeAndProps(  // 创建一个新的 Fiber
        workInProgress.type,
        workInProgress.key,
        workInProgress.pendingProps,
        workInProgress._debugOwner || null,
        workInProgress.mode,
        workInProgress.lanes,
      );
      if (enableOwnerStacks) {  // 如果启用了所有者堆栈
        copiedFiber._debugStack = workInProgress._debugStack;  // 复制调试堆栈
        copiedFiber._debugTask = workInProgress._debugTask;  // 复制调试任务
      }
      return remountFiber(current, workInProgress, copiedFiber);  // 重新挂载 Fiber
    }
  }

  if (current !== null) {  // 如果 current 不为 null
    const oldProps = current.memoizedProps;  // 获取旧的 props
    const newProps = workInProgress.pendingProps;  // 获取新的 props

    if (
      oldProps !== newProps ||  // 如果 props 发生变化
      hasLegacyContextChanged() ||  // 或者遗留上下文发生变化
      // 强制重新渲染，如果实现因热重载而改变：
      (__DEV__ ? workInProgress.type !== current.type : false)  // 开发环境下，类型发生变化
    ) {
      // 如果 props 或上下文发生变化，将 fiber 标记为已执行工作。
      // 这可能稍后会被取消设置，如果 props 被确定为相等（memo）。
      didReceiveUpdate = true;  // 设置接收更新标志
    } else {
      // props 和遗留上下文都没有变化。检查是否有待处理的更新或上下文变化。
      const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes,
      );
      if (
        !hasScheduledUpdateOrContext &&  // 如果没有计划的更新或上下文变化
        // 如果这是错误或 suspense 边界的第二次传递，
        // 可能在 `current` 上没有计划工作，所以我们检查这个标志。
        (workInProgress.flags & DidCapture) === NoFlags  // 且没有捕获标志
      ) {
        // 没有待处理的更新或上下文。现在退出。
        didReceiveUpdate = false;  // 设置未接收更新
        return attemptEarlyBailoutIfNoScheduledUpdate(  // 尝试提前退出
          current,
          workInProgress,
          renderLanes,
        );
      }
      if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {  // 如果有强制更新标志
        // 这是一个只存在于遗留模式的特殊情况。
        // 参见 https://github.com/facebook/react/pull/19216。
        didReceiveUpdate = true;  // 设置接收更新标志
      } else {
        // 在这个 fiber 上计划了一个更新，但没有新的 props
        // 也没有遗留上下文。将其设置为 false。如果更新队列或上下文
        // 消费者产生了变化的值，它会将其设置为 true。否则，
        // 组件将假设子组件没有变化并退出。
        didReceiveUpdate = false;  // 设置未接收更新
      }
    }
  } else {
    didReceiveUpdate = false;  // 设置未接收更新

    if (getIsHydrating() && isForkedChild(workInProgress)) {  // 如果正在水合且是分叉子节点
      // 检查这个子节点是否属于其父节点中的多个子节点列表。
      //
      // 在真正的多线程实现中，我们会在并行线程上渲染子节点。
      // 这将代表这个子树的新渲染线程的开始。
      //
      // 我们只在水合期间使用这个进行 id 生成，这就是为什么
      // 逻辑位于这个特殊分支中。
      const slotIndex = workInProgress.index;  // 获取槽索引
      const numberOfForks = getForksAtLevel(workInProgress);  // 获取分叉数量
      pushTreeId(workInProgress, numberOfForks, slotIndex);  // 推送树 ID
    }
  }

  // 在进入开始阶段之前，清除待处理的更新优先级。
  // TODO: 这假设我们即将评估组件并处理
  // 更新队列。然而，有一个例外：SimpleMemoComponent
  // 有时在开始阶段的后期退出。这表明我们应该
  // 将这个赋值移出公共路径并放入每个分支中。
  workInProgress.lanes = NoLanes;  // 清除优先级

  switch (workInProgress.tag) {  // 根据 workInProgress 的标签进行分支处理
    case LazyComponent: {  // 懒加载组件
      const elementType = workInProgress.elementType;  // 获取元素类型
      return mountLazyComponent(  // 挂载懒加载组件
        current,
        workInProgress,
        elementType,
        renderLanes,
      );
    }
    case FunctionComponent: {  // 函数组件
      const Component = workInProgress.type;  // 获取组件类型
      const unresolvedProps = workInProgress.pendingProps;  // 获取未解析的 props
      const resolvedProps =
        disableDefaultPropsExceptForClasses ||
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultPropsOnNonClassComponent(Component, unresolvedProps);  // 解析 props
      return updateFunctionComponent(  // 更新函数组件
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case ClassComponent: {  // 类组件
      const Component = workInProgress.type;  // 获取组件类型
      const unresolvedProps = workInProgress.pendingProps;  // 获取未解析的 props
      const resolvedProps = resolveClassComponentProps(  // 解析类组件 props
        Component,
        unresolvedProps,
        workInProgress.elementType === Component,
      );
      return updateClassComponent(  // 更新类组件
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case HostRoot:  // 宿主根
      return updateHostRoot(current, workInProgress, renderLanes);  // 更新宿主根
    case HostHoistable:  // 可提升宿主组件
      if (supportsResources) {  // 如果支持资源
        return updateHostHoistable(current, workInProgress, renderLanes);  // 更新可提升宿主组件
      }
    // 继续执行
    case HostSingleton:  // 宿主单例
      if (supportsSingletons) {  // 如果支持单例
        return updateHostSingleton(current, workInProgress, renderLanes);  // 更新宿主单例
      }
    // 继续执行
    case HostComponent:  // 宿主组件
      return updateHostComponent(current, workInProgress, renderLanes);  // 更新宿主组件
    case HostText:  // 宿主文本
      return updateHostText(current, workInProgress);  // 更新宿主文本
    case SuspenseComponent:  // Suspense 组件
      return updateSuspenseComponent(current, workInProgress, renderLanes);  // 更新 Suspense 组件
    case HostPortal:  // 宿主门户
      return updatePortalComponent(current, workInProgress, renderLanes);  // 更新门户组件
    case ForwardRef: {  // 转发引用
      const type = workInProgress.type;  // 获取类型
      const unresolvedProps = workInProgress.pendingProps;  // 获取未解析的 props
      const resolvedProps =
        disableDefaultPropsExceptForClasses ||
        workInProgress.elementType === type
          ? unresolvedProps
          : resolveDefaultPropsOnNonClassComponent(type, unresolvedProps);  // 解析 props
      return updateForwardRef(  // 更新转发引用
        current,
        workInProgress,
        type,
        resolvedProps,
        renderLanes,
      );
    }
    case Fragment:  // 片段
      return updateFragment(current, workInProgress, renderLanes);  // 更新片段
    case Mode:  // 模式
      return updateMode(current, workInProgress, renderLanes);  // 更新模式
    case Profiler:  // 分析器
      return updateProfiler(current, workInProgress, renderLanes);  // 更新分析器
    case ContextProvider:  // 上下文提供者
      return updateContextProvider(current, workInProgress, renderLanes);  // 更新上下文提供者
    case ContextConsumer:  // 上下文消费者
      return updateContextConsumer(current, workInProgress, renderLanes);  // 更新上下文消费者
    case MemoComponent: {  // Memo 组件
      const type = workInProgress.type;  // 获取类型
      const unresolvedProps = workInProgress.pendingProps;  // 获取未解析的 props
      // 首先解析外部 props，然后解析内部 props。
      let resolvedProps = disableDefaultPropsExceptForClasses
        ? unresolvedProps
        : resolveDefaultPropsOnNonClassComponent(type, unresolvedProps);  // 解析外部 props
      resolvedProps = disableDefaultPropsExceptForClasses
        ? resolvedProps
        : resolveDefaultPropsOnNonClassComponent(type.type, resolvedProps);  // 解析内部 props
      return updateMemoComponent(  // 更新 Memo 组件
        current,
        workInProgress,
        type,
        resolvedProps,
        renderLanes,
      );
    }
    case SimpleMemoComponent: {  // 简单 Memo 组件
      return updateSimpleMemoComponent(  // 更新简单 Memo 组件
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        renderLanes,
      );
    }
    case IncompleteClassComponent: {  // 不完整的类组件
      if (disableLegacyMode) {  // 如果禁用了遗留模式
        break;  // 跳出
      }
      const Component = workInProgress.type;  // 获取组件类型
      const unresolvedProps = workInProgress.pendingProps;  // 获取未解析的 props
      const resolvedProps = resolveClassComponentProps(  // 解析类组件 props
        Component,
        unresolvedProps,
        workInProgress.elementType === Component,
      );
      return mountIncompleteClassComponent(  // 挂载不完整的类组件
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case IncompleteFunctionComponent: {  // 不完整的函数组件
      if (disableLegacyMode) {  // 如果禁用了遗留模式
        break;  // 跳出
      }
      const Component = workInProgress.type;  // 获取组件类型
      const unresolvedProps = workInProgress.pendingProps;  // 获取未解析的 props
      const resolvedProps = resolveClassComponentProps(  // 解析类组件 props
        Component,
        unresolvedProps,
        workInProgress.elementType === Component,
      );
      return mountIncompleteFunctionComponent(  // 挂载不完整的函数组件
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case SuspenseListComponent: {  // SuspenseList 组件
      return updateSuspenseListComponent(current, workInProgress, renderLanes);  // 更新 SuspenseList 组件
    }
    case ScopeComponent: {  // Scope 组件
      if (enableScopeAPI) {  // 如果启用了 Scope API
        return updateScopeComponent(current, workInProgress, renderLanes);  // 更新 Scope 组件
      }
      break;  // 跳出
    }
    case OffscreenComponent: {  // Offscreen 组件
      return updateOffscreenComponent(current, workInProgress, renderLanes);  // 更新 Offscreen 组件
    }
    case LegacyHiddenComponent: {  // 遗留隐藏组件
      if (enableLegacyHidden) {  // 如果启用了遗留隐藏
        return updateLegacyHiddenComponent(  // 更新遗留隐藏组件
          current,
          workInProgress,
          renderLanes,
        );
      }
      break;  // 跳出
    }
    case CacheComponent: {  // 缓存组件
      if (enableCache) {  // 如果启用了缓存
        return updateCacheComponent(current, workInProgress, renderLanes);  // 更新缓存组件
      }
      break;  // 跳出
    }
    case TracingMarkerComponent: {  // 追踪标记组件
      if (enableTransitionTracing) {  // 如果启用了过渡追踪
        return updateTracingMarkerComponent(  // 更新追踪标记组件
          current,
          workInProgress,
          renderLanes,
        );
      }
      break;  // 跳出
    }
    case Throw: {  // 抛出
      // 这表示在协调阶段抛出的组件。
      // 所以我们会在这里重新抛出。这可能是一个 Thenable。
    case Throw: {
      // This represents a Component that threw in the reconciliation phase.
      // So we'll rethrow here. This might be a Thenable.
      throw workInProgress.pendingProps;
    }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      'React. Please file an issue.',
  );
}
```

`beginWork` 是 React Fiber 架构中的一个核心函数，它负责开始处理一个 Fiber 节点的工作。这个函数在 reconciliation 过程中被调用，用于创建或更新子 Fiber 节点。让我们深入分析这个函数：

1. 主要职责：

   - 根据 Fiber 节点的类型（如函数组件、类组件、宿主组件等）执行相应的更新逻辑。
   - 创建或更新子 Fiber 节点。
   - 处理优化路径，如提前退出或重用现有子树。

2. 关键步骤：

   a. 开发模式下的特殊处理：

   - 检查是否需要重新挂载组件。

   b. 更新检查：

   - 比较新旧 props，检查上下文是否变化。
   - 设置 `didReceiveUpdate` 标志。

   c. 优化路径：

   - 如果没有待处理的更新，尝试提前退出（bailout）。

   d. 清除待处理的更新优先级。

   e. 根据 Fiber 标签（tag）执行不同的更新逻辑： 

   - 对于函数组件，调用 `updateFunctionComponent`。
   - 对于类组件，调用 `updateClassComponent`。
   - 对于宿主组件（如 DOM 元素），调用 `updateHostComponent`。
   - 处理特殊类型，如 Fragment、Suspense 等。

   f. 返回子 Fiber 节点或 null。

3. 优化策略：

   - 使用 `bailoutOnAlreadyFinishedWork` 函数来跳过不需要更新的子树。
   - 对于某些组件类型（如 Suspense），实现特殊的优化逻辑。

4. 重要的辅助函数：

   - `attemptEarlyBailoutIfNoScheduledUpdate`: 尝试提前退出。
   - `bailoutOnAlreadyFinishedWork`: 对已完成工作的优化处理。
   - 各种特定组件类型的更新函数（如 `updateFunctionComponent`, `updateClassComponent` 等）。

5. 性能考虑：

   - 函数开始时清除待处理的更新优先级，以准确反映当前工作状态。
   - 使用条件检查来避免不必要的工作。

6. 开发模式支持：
   - 包含额外的检查和警告。
   - 支持热重载和调试。

**主要目的：**

1. 增量渲染：
   它是实现 React 增量渲染的关键部分，允许 React 逐个处理 Fiber 节点。

2. 差异化更新：
   通过比较新旧 props 和上下文，决定是否需要更新组件。

3. 组件生命周期管理：
   触发适当的生命周期方法或 hooks。

4. 子树协调：
   创建或更新组件的子树结构。

5. 性能优化：
   通过 bailout 机制避免不必要的工作，提高渲染效率。

6. 副作用管理：
   标记需要在提交阶段处理的副作用。

`beginWork` 函数是 React 协调过程的核心， Fiber 树的"递" 阶段。 它决定了如何处理每个 Fiber 节点，并负责构建或更新 Fiber 树的结构。通过智能地决定是否需要更新子树，以及如何更新，这个函数在很大程度上影响了 React 的性能和效率。

### 2、reconcileChildren

```js
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes
) {
  if (current === null) {
    // 如果是新组件，使用 mountChildFibers
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderLanes)
  } else {
    // 如果是更新，使用 reconcileChildFibers
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    )
  }
}
```

1. 根据当前 Fiber 的状态，决定是挂载新组件还是更新现有组件。
2. 如果是新组件，使用 mountChildFibers 挂载新组件。
3. 如果是更新，使用 reconcileChildFibers 更新现有组件。

这两个函数本质上调用的都是 createChildReconciler

:::details createChildReconciler

```js
function createChildReconciler(
  shouldTrackSideEffects: boolean,
): ChildReconciler {
  function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {  // 定义删除子节点的函数，接收父 Fiber 和要删除的子 Fiber
    if (!shouldTrackSideEffects) {  // 如果不需要跟踪副作用
      // Noop.
      return;  // 直接返回，不执行任何操作
    }
    const deletions = returnFiber.deletions;  // 获取父 Fiber 的 deletions 数组
    if (deletions === null) {  // 如果 deletions 数组为空
      returnFiber.deletions = [childToDelete];  // 创建新的 deletions 数组，包含要删除的子节点
      returnFiber.flags |= ChildDeletion;  // 给父 Fiber 添加 ChildDeletion 标志
    } else {  // 如果 deletions 数组已存在
      deletions.push(childToDelete);  // 将要删除的子节点添加到 deletions 数组中
    }
  }

  /**
   * deleteRemainingChildren 函数主要完成以下任务:
   *
   * 1. 如果不需要跟踪副作用，则直接返回 null。
   * 2. 初始化要删除的子节点为第一个子节点。
   * 3. 循环遍历所有子节点，删除它们。
   * 4. 返回 null。
   *
   * 总的来说，deleteRemainingChildren 函数是 React 协调算法的一部分，
   * 专门用于删除所有剩余的子节点，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function deleteRemainingChildren(  // 定义删除剩余子节点的函数
    returnFiber: Fiber,  // 父 Fiber
    currentFirstChild: Fiber | null,  // 当前第一个子节点
  ): null {  // 返回 null
    if (!shouldTrackSideEffects) {  // 如果不需要跟踪副作用
      // Noop.
      return null;  // 直接返回 null，不执行任何操作
    }

    // TODO: For the shouldClone case, this could be micro-optimized a bit by
    // assuming that after the first child we've already added everything.
    let childToDelete = currentFirstChild;  // 初始化要删除的子节点为第一个子节点
    while (childToDelete !== null) {  // 循环遍历所有子节点
      deleteChild(returnFiber, childToDelete);  // 删除当前子节点
      childToDelete = childToDelete.sibling;  // 移动到下一个兄弟节点
    }
    return null;  // 返回 null
  }

  /**
   * mapRemainingChildren 函数主要完成以下任务:
   *
   * 1. 创建一个 Map 来存储当前 Fiber 的剩余子节点。
   * 2. 遍历所有子节点，将它们添加到 Map 中。
   * 3. 返回包含所有剩余子节点的 Map。
   *
   * 总的来说，mapRemainingChildren 函数是 React 协调算法的一部分，
   * 专门用于处理剩余子节点的映射，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function mapRemainingChildren(  // 定义映射剩余子节点的函数
    currentFirstChild: Fiber,  // 当前第一个子节点
  ): Map<string | number, Fiber> {  // 返回一个 Map，键为 string 或 number，值为 Fiber
    // Add the remaining children to a temporary map so that we can find them by
    // keys quickly. Implicit (null) keys get added to this set with their index
    // instead.
    const existingChildren: Map<string | number, Fiber> = new Map();  // 创建一个新的 Map 来存储现有的子节点

    let existingChild: null | Fiber = currentFirstChild;  // 初始化现有子节点为第一个子节点
    while (existingChild !== null) {  // 循环遍历所有子节点
      if (existingChild.key !== null) {  // 如果子节点有 key
        existingChildren.set(existingChild.key, existingChild);  // 使用 key 作为 Map 的键
      } else {  // 如果子节点没有 key
        existingChildren.set(existingChild.index, existingChild);  // 使用 index 作为 Map 的键
      }
      existingChild = existingChild.sibling;  // 移动到下一个兄弟节点
    }
    return existingChildren;  // 返回包含所有子节点的 Map
  }

  /**
   * useFiber 函数主要完成以下任务:
   *
   * 1. 创建一个新的 work-in-progress fiber。
   * 2. 设置 index 为 0。
   * 3. 设置 sibling 为 null。
   * 4. 返回克隆的 fiber。
   */
  function useFiber(fiber: Fiber, pendingProps: mixed): Fiber {  // 定义 useFiber 函数，接收 fiber 和 pendingProps 参数，返回 Fiber
    // We currently set sibling to null and index to 0 here because it is easy
    // to forget to do before returning it. E.g. for the single child case.
    const clone = createWorkInProgress(fiber, pendingProps);    // 创建一个新的 work-in-progress fiber
    clone.index = 0;                                            // 设置 index 为 0
    clone.sibling = null;                                       // 设置 sibling 为 null
    return clone;                                               // 返回克隆的 fiber
  }

  /**
   * placeChild 函数主要完成以下任务:
   *
   * 1. 设置新 Fiber 的索引。
   * 2. 如果不需要跟踪副作用，则添加 Forked 标志。
   * 3. 在开发环境下，添加 Placement 和 PlacementDEV 标志。
   * 4. 返回上一个放置的索引。
   *
   * 总的来说，placeChild 函数是 React 协调算法的一部分，
   * 专门用于处理子元素的插入，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function placeChild(                                          // 定义 placeChild 函数
    newFiber: Fiber,                                            // 参数：新的 Fiber
    lastPlacedIndex: number,                                    // 参数：上一个放置的索引
    newIndex: number,                                           // 参数：新的索引
  ): number {                                                   // 返回类型：number
    newFiber.index = newIndex;                                  // 设置新 Fiber 的索引
    if (!shouldTrackSideEffects) {                              // 如果不需要跟踪副作用
      // During hydration, the useId algorithm needs to know which fibers are
      // part of a list of children (arrays, iterators).
      newFiber.flags |= Forked;                                 // 添加 Forked 标志
      return lastPlacedIndex;                                   // 返回上一个放置的索引
    }
    const current = newFiber.alternate;                         // 获取当前 Fiber 的 alternate
    if (current !== null) {                                     // 如果 alternate 存在
      const oldIndex = current.index;                           // 获取旧的索引
      if (oldIndex < lastPlacedIndex) {                         // 如果旧索引小于上一个放置的索引
        // This is a move.
        newFiber.flags |= Placement | PlacementDEV;             // 添加 Placement 和 PlacementDEV 标志
        return lastPlacedIndex;                                 // 返回上一个放置的索引
      } else {
        // This item can stay in place.
        return oldIndex;                                        // 返回旧索引
      }
    } else {
      // This is an insertion.
      newFiber.flags |= Placement | PlacementDEV;               // 添加 Placement 和 PlacementDEV 标志
      return lastPlacedIndex;                                   // 返回上一个放置的索引
    }
  }

  /**
   * placeSingleChild 函数主要完成以下任务:
   *
   * 1. 检查是否需要跟踪副作用，并且当前 Fiber 是否有 alternate。
   * 2. 如果需要跟踪副作用且没有 alternate，则添加 Placement 和 PlacementDEV 标志。
   * 3. 返回新的 Fiber。
   *
   * 总的来说，placeSingleChild 函数是 React 协调算法的一部分，
   * 专门用于处理单个子元素的插入，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function placeSingleChild(newFiber: Fiber): Fiber {           // 定义 placeSingleChild 函数，接收 newFiber 参数，返回 Fiber
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    if (shouldTrackSideEffects && newFiber.alternate === null) {  // 如果需要跟踪副作用且没有 alternate
      newFiber.flags |= Placement | PlacementDEV;               // 添加 Placement 和 PlacementDEV 标志
    }
    return newFiber;                                            // 返回新的 Fiber
  }

  /**
   * updateTextNode 函数主要完成以下任务:
   *
   * 1. 检查当前 Fiber 是否存在或不是文本节点。
   * 2. 如果当前 Fiber 不存在或不是文本节点，则创建新的文本 Fiber。
   * 3. 在开发环境下，设置调试信息。
   * 4. 返回创建的 Fiber。
   *
   * 总的来说，updateTextNode 函数是 React 协调算法的一部分，
   * 专门用于更新文本类型的子元素，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   *
  function updateTextNode(                                      // 定义 updateTextNode 函数
    returnFiber: Fiber,                                         // 参数：父 Fiber
    current: Fiber | null,                                      // 参数：当前 Fiber 或 null
    textContent: string,                                        // 参数：文本内容
    lanes: Lanes,                                               // 参数：优先级 lanes
  ) {
    if (current === null || current.tag !== HostText) {         // 如果当前 Fiber 不存在或不是文本节点
      // Insert
      const created = createFiberFromText(textContent, returnFiber.mode, lanes);  // 创建新的文本 Fiber
      created.return = returnFiber;                             // 设置父 Fiber
      if (__DEV__) {                                            // 开发环境下
        // We treat the parent as the owner for stack purposes.
        created._debugOwner = returnFiber;                      // 设置调试用的 owner
        if (enableOwnerStacks) {                                // 如果启用了 owner 堆栈
          created._debugTask = returnFiber._debugTask;          // 设置调试任务
        }
        created._debugInfo = currentDebugInfo;                  // 设置调试信息
      }
      return created;                                           // 返回创建的 Fiber
    } else {
      // Update
      const existing = useFiber(current, textContent);          // 复用现有 Fiber
      existing.return = returnFiber;                            // 设置父 Fiber
      if (__DEV__) {                                            // 开发环境下
        existing._debugInfo = currentDebugInfo;                 // 设置调试信息
      }
      return existing;                                          // 返回更新的 Fiber
    }
  }

  /**
   * updateElement 函数主要完成以下任务:
   *
   * 1. 检查当前 Fiber 是否存在或不是元素。
   * 2. 如果当前 Fiber 不存在或不是元素，则创建新的元素 Fiber。
   * 3. 在开发环境下，设置调试信息。
   * 4. 返回创建的 Fiber。
   *
   * 总的来说，updateElement 函数是 React 协调算法的一部分，
   * 专门用于更新元素类型的子元素，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function updateElement(                                       // 定义 updateElement 函数
    returnFiber: Fiber,                                         // 参数：父 Fiber
    current: Fiber | null,                                      // 参数：当前 Fiber 或 null
    element: ReactElement,                                      // 参数：React 元素
    lanes: Lanes,                                               // 参数：优先级 lanes
  ): Fiber {                                                    // 返回类型：Fiber
    const elementType = element.type;                           // 获取元素类型
    if (elementType === REACT_FRAGMENT_TYPE) {                  // 如果是 Fragment 类型
      const updated = updateFragment(                           // 更新 Fragment
        returnFiber,
        current,
        element.props.children,
        lanes,
        element.key,
      );
      validateFragmentProps(element, updated, returnFiber);     // 验证 Fragment 属性
      return updated;                                           // 返回更新后的 Fiber
    }
    if (current !== null) {                                     // 如果当前 Fiber 存在
      if (
        current.elementType === elementType ||                  // 元素类型相同
        // Keep this check inline so it only runs on the false path:
        (__DEV__
          ? isCompatibleFamilyForHotReloading(current, element)  // 开发环境下检查热重载兼容性
          : false) ||
        // Lazy types should reconcile their resolved type.
        // We need to do this after the Hot Reloading check above,
        // because hot reloading has different semantics than prod because
        // it doesn't resuspend. So we can't let the call below suspend.
        (typeof elementType === 'object' &&                     // 处理 lazy 类型
          elementType !== null &&
          elementType.$$typeof === REACT_LAZY_TYPE &&
          resolveLazy(elementType) === current.type)
      ) {
        // Move based on index
        const existing = useFiber(current, element.props);      // 复用现有 Fiber
        coerceRef(returnFiber, current, existing, element);     // 处理 ref
        existing.return = returnFiber;                          // 设置父 Fiber
        if (__DEV__) {                                          // 开发环境下
          existing._debugOwner = element._owner;                // 设置调试用的 owner
          existing._debugInfo = currentDebugInfo;               // 设置调试信息
        }
        return existing;                                        // 返回更新的 Fiber
      }
    }
    // Insert
    const created = createFiberFromElement(element, returnFiber.mode, lanes);  // 创建新的元素 Fiber
    coerceRef(returnFiber, current, created, element);          // 处理 ref
    created.return = returnFiber;                               // 设置父 Fiber
    if (__DEV__) {                                              // 开发环境下
      created._debugInfo = currentDebugInfo;                    // 设置调试信息
    }
    return created;                                             // 返回创建的 Fiber
  }

  /**
   * updatePortal 函数主要完成以下任务:
   *
   * 1. 检查当前 Fiber 是否存在或不是 Portal。
   * 2. 如果当前 Fiber 不存在或不是 Portal，则创建新的 Portal Fiber。
   * 3. 在开发环境下，设置调试信息。
   * 4. 返回创建的 Fiber。
   *
   * 总的来说，updatePortal 函数是 React 协调算法的一部分，
   * 专门用于更新 Portal 类型的子元素，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function updatePortal(                                        // 定义 updatePortal 函数
    returnFiber: Fiber,                                         // 参数：父 Fiber
    current: Fiber | null,                                      // 参数：当前 Fiber 或 null
    portal: ReactPortal,                                        // 参数：Portal
    lanes: Lanes,                                               // 参数：优先级 lanes
  ): Fiber {                                                    // 返回类型：Fiber
    if (
      current === null ||                                       // 当前 Fiber 不存在
      current.tag !== HostPortal ||                             // 不是 HostPortal 类型
      current.stateNode.containerInfo !== portal.containerInfo ||  // 容器信息不同
      current.stateNode.implementation !== portal.implementation   // 实现不同
    ) {
      // Insert
      const created = createFiberFromPortal(portal, returnFiber.mode, lanes);  // 创建新的 Portal Fiber
      created.return = returnFiber;                             // 设置父 Fiber
      if (__DEV__) {                                            // 开发环境下
        created._debugInfo = currentDebugInfo;                  // 设置调试信息
      }
      return created;                                           // 返回创建的 Fiber
    } else {
      // Update
      const existing = useFiber(current, portal.children || []);  // 复用现有 Fiber
      existing.return = returnFiber;                            // 设置父 Fiber
      if (__DEV__) {                                            // 开发环境下
        existing._debugInfo = currentDebugInfo;                 // 设置调试信息
      }
      return existing;                                          // 返回更新的 Fiber
    }
  }

  /**
   * updateFragment 函数主要完成以下任务:
   *
   * 1. 检查当前 Fiber 是否存在或不是 Fragment。
   * 2. 如果当前 Fiber 不存在或不是 Fragment，则创建新的 Fragment Fiber。
   * 3. 在开发环境下，设置调试信息。
   * 4. 返回创建的 Fiber。
   *
   * 总的来说，updateFragment 函数是 React 协调算法的一部分，
   * 专门用于更新 Fragment 类型的子元素，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function updateFragment(                                      // 定义 updateFragment 函数
    returnFiber: Fiber,                                         // 参数：父 Fiber
    current: Fiber | null,                                      // 参数：当前 Fiber 或 null
    fragment: Iterable<React$Node>,                             // 参数：Fragment 内容
    lanes: Lanes,                                               // 参数：优先级 lanes
    key: null | string,                                         // 参数：key
  ): Fiber {                                                    // 返回类型：Fiber
    if (current === null || current.tag !== Fragment) {         // 如果当前 Fiber 不存在或不是 Fragment
      // Insert
      const created = createFiberFromFragment(                  // 创建新的 Fragment Fiber
        fragment,
        returnFiber.mode,
        lanes,
        key,
      );
      created.return = returnFiber;                             // 设置父 Fiber
      if (__DEV__) {                                            // 开发环境下
        // We treat the parent as the owner for stack purposes.
        created._debugOwner = returnFiber;                      // 设置调试用的 owner
        if (enableOwnerStacks) {                                // 如果启用了 owner 堆栈
          created._debugTask = returnFiber._debugTask;          // 设置调试任务
        }
        created._debugInfo = currentDebugInfo;                  // 设置调试信息
      }
      return created;                                           // 返回创建的 Fiber
    } else {
      // Update
      const existing = useFiber(current, fragment);             // 复用现有 Fiber
      existing.return = returnFiber;                            // 设置父 Fiber
      if (__DEV__) {                                            // 开发环境下
        existing._debugInfo = currentDebugInfo;                 // 设置调试信息
      }
      return existing;                                          // 返回更新的 Fiber
    }
  }

  /**
   * createChild 函数主要完成以下任务:
   *
   * 1. 根据新的子元素创建一个新的 Fiber 节点。
   * 2. 在开发环境下，设置调试信息。
   * 3. 返回创建的 Fiber 节点。
   *
   * 总的来说，createChild 函数是 React 协调算法的一部分，
   * 专门用于创建新的子 Fiber 节点，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function createChild(                                        // 定义 createChild 函数
    returnFiber: Fiber,                                        // 参数：父 Fiber
    newChild: any,                                             // 参数：新的子元素
    lanes: Lanes,                                              // 参数：优先级 lanes
  ): Fiber | null {                                            // 返回类型：Fiber 或 null
    if (                                                       // 检查 newChild 是否为非空字符串、数字或 bigint
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number' ||
      typeof newChild === 'bigint'
    ) {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      const created = createFiberFromText(                     // 创建文本 Fiber
        // $FlowFixMe[unsafe-addition] Flow doesn't want us to use `+` operator with string and bigint
        '' + newChild,                                         // 将 newChild 转换为字符串
        returnFiber.mode,                                      // 使用父 Fiber 的模式
        lanes,                                                 // 传入优先级 lanes
      );
      created.return = returnFiber;                            // 设置父 Fiber
      if (__DEV__) {                                           // 开发环境下
        // We treat the parent as the owner for stack purposes.
        created._debugOwner = returnFiber;                     // 设置调试用的 owner
        if (enableOwnerStacks) {                               // 如果启用了 owner 堆栈
          created._debugTask = returnFiber._debugTask;         // 设置调试任务
        }
        created._debugInfo = currentDebugInfo;                 // 设置调试信息
      }
      return created;                                          // 返回创建的 Fiber
    }

    if (typeof newChild === 'object' && newChild !== null) {   // 如果 newChild 是非 null 对象
      switch (newChild.$$typeof) {                             // 根据 $$typeof 属性判断元素类型
        case REACT_ELEMENT_TYPE: {                             // 如果是 React 元素
          const created = createFiberFromElement(              // 创建元素 Fiber
            newChild,
            returnFiber.mode,
            lanes,
          );
          coerceRef(returnFiber, null, created, newChild);     // 处理 ref
          created.return = returnFiber;                        // 设置父 Fiber
          if (__DEV__) {                                       // 开发环境下
            const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
            created._debugInfo = currentDebugInfo;             // 设置调试信息
            currentDebugInfo = prevDebugInfo;                  // 恢复之前的调试信息
          }
          return created;                                      // 返回创建的 Fiber
        }
        case REACT_PORTAL_TYPE: {                              // 如果是 Portal
          const created = createFiberFromPortal(               // 创建 Portal Fiber
            newChild,
            returnFiber.mode,
            lanes,
          );
          created.return = returnFiber;                        // 设置父 Fiber
          if (__DEV__) {                                       // 开发环境下
            created._debugInfo = currentDebugInfo;             // 设置调试信息
          }
          return created;                                      // 返回创建的 Fiber
        }
        case REACT_LAZY_TYPE: {                                // 如果是 Lazy 组件
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
          let resolvedChild;                                   // 声明 resolvedChild 变量
          if (__DEV__) {                                       // 开发环境下
            resolvedChild = callLazyInitInDEV(newChild);       // 调用 lazy 初始化函数
          } else {                                             // 生产环境下
            const payload = newChild._payload;                 // 获取 payload
            const init = newChild._init;                       // 获取 init 函数
            resolvedChild = init(payload);                     // 初始化 lazy 组件
          }
          const created = createChild(returnFiber, resolvedChild, lanes);  // 递归创建子 Fiber
          currentDebugInfo = prevDebugInfo;                    // 恢复之前的调试信息
          return created;                                      // 返回创建的 Fiber
        }
      }

      if (                                                     // 检查 newChild 是否为数组、可迭代对象或异步可迭代对象
        isArray(newChild) ||
        getIteratorFn(newChild) ||
        (enableAsyncIterableChildren &&
          typeof newChild[ASYNC_ITERATOR] === 'function')
      ) {
        const created = createFiberFromFragment(               // 创建 Fragment Fiber
          newChild,
          returnFiber.mode,
          lanes,
          null,
        );
        created.return = returnFiber;                          // 设置父 Fiber
        if (__DEV__) {                                         // 开发环境下
          // We treat the parent as the owner for stack purposes.
          created._debugOwner = returnFiber;                   // 设置调试用的 owner
          if (enableOwnerStacks) {                             // 如果启用了 owner 堆栈
            created._debugTask = returnFiber._debugTask;       // 设置调试任务
          }
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
          created._debugInfo = currentDebugInfo;               // 设置调试信息
          currentDebugInfo = prevDebugInfo;                    // 恢复之前的调试信息
        }
        return created;                                        // 返回创建的 Fiber
      }

      // Usable node types
      //
      // Unwrap the inner value and recursively call this function again.
      if (typeof newChild.then === 'function') {               // 如果 newChild 是 Promise
        const thenable: Thenable<any> = (newChild: any);       // 类型断言
        const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
        const created = createChild(                           // 递归创建子 Fiber
          returnFiber,
          unwrapThenable(thenable),                            // 解包 thenable
          lanes,
        );
        currentDebugInfo = prevDebugInfo;                      // 恢复之前的调试信息
        return created;                                        // 返回创建的 Fiber
      }

      if (newChild.$$typeof === REACT_CONTEXT_TYPE) {          // 如果 newChild 是 React Context
        const context: ReactContext<mixed> = (newChild: any);  // 类型断言
        return createChild(                                    // 递归创建子 Fiber
          returnFiber,
          readContextDuringReconciliation(returnFiber, context, lanes),  // 读取 Context 值
          lanes,
        );
      }

      throwOnInvalidObjectType(returnFiber, newChild);         // 抛出无效对象类型错误
    }

    if (__DEV__) {                                             // 开发环境下
      if (typeof newChild === 'function') {                    // 如果 newChild 是函数
        warnOnFunctionType(returnFiber, newChild);             // 警告函数类型
      }
      if (typeof newChild === 'symbol') {                      // 如果 newChild 是 symbol
        warnOnSymbolType(returnFiber, newChild);               // 警告 symbol 类型
      }
    }

    return null;                                               // 如果都不匹配，返回 null
  }

  /xr
   * updateSlot 函数主要完成以下任务:
   *
   * 1. 检查新的子元素是否与旧的 Fiber 节点匹配。
   * 2. 如果匹配，则更新该 Fiber 节点。
   * 3. 如果不匹配，则返回 null。
   * 4. 在开发环境下，检查 key 的唯一性，避免重复 key。
   * 5. 返回协调后的 Fiber 节点。
   *
   * 总的来说，updateSlot 函数是 React 协调算法的一部分，
   * 专门用于处理单个子元素的更新，确保高效地更新子元素，同时尽量减少不必要的 DOM 操作。
   */
  function updateSlot(                                         // 定义 updateSlot 函数
    returnFiber: Fiber,                                        // 参数：父 Fiber
    oldFiber: Fiber | null,                                    // 参数：旧的 Fiber，可能为 null
    newChild: any,                                             // 参数：新的子元素
    lanes: Lanes,                                              // 参数：优先级lanes
  ): Fiber | null {                                            // 返回类型：Fiber 或 null
    // Update the fiber if the keys match, otherwise return null.
    const key = oldFiber !== null ? oldFiber.key : null;       // 获取旧 Fiber 的 key，如果存在的话

    if (                                                       // 检查 newChild 是否为字符串、数字或 bigint
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number' ||
      typeof newChild === 'bigint'
    ) {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      if (key !== null) {                                      // 如果旧 Fiber 有 key，则不能更新为文本节点
        return null;
      }
      return updateTextNode(                                   // 更新文本节点
        returnFiber,
        oldFiber,
        // $FlowFixMe[unsafe-addition] Flow doesn't want us to use `+` operator with string and bigint
        '' + newChild,                                         // 将 newChild 转换为字符串
        lanes,
      );
    }

    if (typeof newChild === 'object' && newChild !== null) {   // 如果 newChild 是非 null 对象
      switch (newChild.$$typeof) {                             // 根据 $$typeof 属性判断元素类型
        case REACT_ELEMENT_TYPE: {                             // 如果是 React 元素
          if (newChild.key === key) {                          // 如果 key 匹配
            const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
            const updated = updateElement(                     // 更新元素
              returnFiber,
              oldFiber,
              newChild,
              lanes,
            );
            currentDebugInfo = prevDebugInfo;                  // 恢复调试信息
            return updated;
          } else {
            return null;                                       // key 不匹配，返回 null
          }
        }
        case REACT_PORTAL_TYPE: {                              // 如果是 Portal
          if (newChild.key === key) {                          // 如果 key 匹配
            return updatePortal(returnFiber, oldFiber, newChild, lanes);  // 更新 Portal
          } else {
            return null;                                       // key 不匹配，返回 null
          }
        }
        case REACT_LAZY_TYPE: {                                // 如果是 Lazy 组件
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
          let resolvedChild;
          if (__DEV__) {                                       // 在开发环境中
            resolvedChild = callLazyInitInDEV(newChild);       // 调用懒加载初始化函数
          } else {
            const payload = newChild._payload;                 // 获取 payload
            const init = newChild._init;                       // 获取初始化函数
            resolvedChild = init(payload);                     // 执行初始化
          }
          const updated = updateSlot(                          // 递归更新解析后的子元素
            returnFiber,
            oldFiber,
            resolvedChild,
            lanes,
          );
          currentDebugInfo = prevDebugInfo;                    // 恢复调试信息
          return updated;
        }
      }

      if (                                                     // 检查是否为数组或可迭代对象
        isArray(newChild) ||
        getIteratorFn(newChild) ||
        (enableAsyncIterableChildren &&
          typeof newChild[ASYNC_ITERATOR] === 'function')
      ) {
        if (key !== null) {                                    // 如果有 key，则不能更新为 fragment
          return null;
        }

        const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
        const updated = updateFragment(                        // 更新 fragment
          returnFiber,
          oldFiber,
          newChild,
          lanes,
          null,
        );
        currentDebugInfo = prevDebugInfo;                      // 恢复调试信息
        return updated;
      }

      // Usable node types
      //
      // Unwrap the inner value and recursively call this function again.
      if (typeof newChild.then === 'function') {               // 如果是 Promise
        const thenable: Thenable<any> = (newChild: any);       // 类型断言
        const prevDebugInfo = pushDebugInfo((thenable: any)._debugInfo);  // 保存调试信息
        const updated = updateSlot(                            // 递归更新 Promise 解析后的值
          returnFiber,
          oldFiber,
          unwrapThenable(thenable),
          lanes,
        );
        currentDebugInfo = prevDebugInfo;                      // 恢复调试信息
        return updated;
      }

      if (newChild.$$typeof === REACT_CONTEXT_TYPE) {          // 如果是 Context
        const context: ReactContext<mixed> = (newChild: any);  // 类型断言
        return updateSlot(                                     // 递归更新 Context 的值
          returnFiber,
          oldFiber,
          readContextDuringReconciliation(returnFiber, context, lanes),
          lanes,
        );
      }

      throwOnInvalidObjectType(returnFiber, newChild);         // 抛出无效对象类型错误
    }

    if (__DEV__) {                                             // 在开发环境中
      if (typeof newChild === 'function') {                    // 如果 newChild 是函数
        warnOnFunctionType(returnFiber, newChild);             // 警告函数类型
      }
      if (typeof newChild === 'symbol') {                      // 如果 newChild 是 symbol
        warnOnSymbolType(returnFiber, newChild);               // 警告 symbol 类型
      }
    }

    return null;                                               // 如果都不匹配，返回 null
  }

  /**
   * updateFromMap 函数主要完成以下任务:
   *
   * 1. 遍历现有子元素的 Map，尝试复用现有 Fiber 节点。
   * 2. 处理新增、删除和移动的子元素。
   * 3. 为新的子元素创建 Fiber 节点。
   * 4. 维护子元素的顺序和索引。
   * 5. 优化性能，尽可能复用现有 Fiber 节点。
   * 6. 处理 key 的唯一性，避免重复 key。
   * 7. 返回协调后的第一个子 Fiber 节点。
   *
   * 总的来说，updateFromMap 函数是 React 协调算法的一部分，
   * 专门用于处理 Map 类型的子元素，确保高效地更新子元素列表，同时尽量减少不必要的 DOM 操作。
   */
  function updateFromMap(                                      // 定义 updateFromMap 函数
    existingChildren: Map<string | number, Fiber>,             // 参数：现有子元素的 Map
    returnFiber: Fiber,                                        // 参数：父 Fiber
    newIdx: number,                                            // 参数：新的索引
    newChild: any,                                             // 参数：新的子元素
    lanes: Lanes,                                              // 参数：优先级lanes
  ): Fiber | null {                                            // 返回类型：Fiber 或 null
    if (                                                       // 检查 newChild 是否为字符串、数字或 bigint
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number' ||
      typeof newChild === 'bigint'
    ) {
      // Text nodes don't have keys, so we neither have to check the old nor
      // new node for the key. If both are text nodes, they match.
      const matchedFiber = existingChildren.get(newIdx) || null;  // 尝试获取匹配的现有 Fiber
      return updateTextNode(                                   // 更新文本节点
        returnFiber,
        matchedFiber,
        // $FlowFixMe[unsafe-addition] Flow doesn't want us to use `+` operator with string and bigint
        '' + newChild,                                         // 将 newChild 转换为字符串
        lanes,
      );
    }

    if (typeof newChild === 'object' && newChild !== null) {   // 如果 newChild 是非 null 对象
      switch (newChild.$$typeof) {                             // 根据 $$typeof 属性判断元素类型
        case REACT_ELEMENT_TYPE: {                             // 如果是 React 元素
          const matchedFiber =                                 // 尝试获取匹配的现有 Fiber
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key,
            ) || null;
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
          const updated = updateElement(                       // 更新元素
            returnFiber,
            matchedFiber,
            newChild,
            lanes,
          );
          currentDebugInfo = prevDebugInfo;                    // 恢复调试信息
          return updated;
        }
        case REACT_PORTAL_TYPE: {                              // 如果是 Portal
          const matchedFiber =                                 // 尝试获取匹配的现有 Fiber
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key,
            ) || null;
          return updatePortal(returnFiber, matchedFiber, newChild, lanes);  // 更新 Portal
        }
        case REACT_LAZY_TYPE: {                                // 如果是 Lazy 组件
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo);  // 保存调试信息
          let resolvedChild;
          if (__DEV__) {                                       // 在开发环境中
            resolvedChild = callLazyInitInDEV(newChild);       // 调用懒加载初始化函数
          } else {
            const payload = newChild._payload;                 // 获取 payload
            const init = newChild._init;                       // 获取初始化函数
            resolvedChild = init(payload);                     // 执行初始化
          }
          const updated = updateFromMap(                       // 递归更新解析后的子元素
            existingChildren,
            returnFiber,
            newIdx,
            resolvedChild,
            lanes,
          );
          currentDebugInfo = prevDebugInfo;                    // 恢复调试信息
          return updated;
        }
      }

      if (
        isArray(newChild) ||                                   // 如果 newChild 是数组
        getIteratorFn(newChild) ||                             // 或者 newChild 是可迭代对象
        (enableAsyncIterableChildren &&                        // 如果启用了异步可迭代子元素
          typeof newChild[ASYNC_ITERATOR] === 'function')      // 且 newChild 是异步可迭代对象
      ) {
        const matchedFiber = existingChildren.get(newIdx) || null;  // 尝试从现有子元素中获取匹配的 Fiber
        const prevDebugInfo = pushDebugInfo(newChild._debugInfo);   // 保存当前的调试信息
        const updated = updateFragment(                        // 更新 Fragment
          returnFiber,
          matchedFiber,
          newChild,
          lanes,
          null,
        );
        currentDebugInfo = prevDebugInfo;                      // 恢复之前的调试信息
        return updated;                                        // 返回更新后的 Fragment
      }

      // Usable node types
      //
      // Unwrap the inner value and recursively call this function again.
      if (typeof newChild.then === 'function') {               // 如果 newChild 是 Promise
        const thenable: Thenable<any> = (newChild: any);       // 将 newChild 转换为 Thenable 类型
        const prevDebugInfo = pushDebugInfo((thenable: any)._debugInfo);  // 保存当前的调试信息
        const updated = updateFromMap(                         // 更新 Promise 的结果
          existingChildren,
          returnFiber,
          newIdx,
          unwrapThenable(thenable),
          lanes,
        );
        currentDebugInfo = prevDebugInfo;                      // 恢复之前的调试信息
        return updated;                                        // 返回更新后的结果
      }

      if (newChild.$$typeof === REACT_CONTEXT_TYPE) {          // 如果 newChild 是 React Context
        const context: ReactContext<mixed> = (newChild: any);  // 将 newChild 转换为 ReactContext 类型
        return updateFromMap(                                  // 更新 Context 的值
          existingChildren,
          returnFiber,
          newIdx,
          readContextDuringReconciliation(returnFiber, context, lanes),
          lanes,
        );
      }

      throwOnInvalidObjectType(returnFiber, newChild);         // 如果 newChild 是无效的对象类型，抛出错误

    }

    if (__DEV__) {                                             // 在开发环境下
      if (typeof newChild === 'function') {                    // 如果 newChild 是函数
        warnOnFunctionType(returnFiber, newChild);             // 警告使用函数作为子元素
      }
      if (typeof newChild === 'symbol') {                      // 如果 newChild 是 symbol
        warnOnSymbolType(returnFiber, newChild);               // 警告使用 symbol 作为子元素
      }
    }

    return null;                                               // 如果所有条件都不满足，返回 null
  }

  /**
   * Warns if there is a duplicate or missing key
   */
  function warnOnInvalidKey(                                   // 警告无效的 key
    returnFiber: Fiber,                                        // 父 Fiber
    workInProgress: Fiber,                                     // 当前正在处理的 Fiber
    child: mixed,                                              // 子元素
    knownKeys: Set<string> | null,                             // 已知的 key 集合
  ): Set<string> | null {                                      // 返回更新后的 knownKeys
    if (__DEV__) {                                             // 在开发环境下
      if (typeof child !== 'object' || child === null) {       // 如果 child 不是对象或为 null
        return knownKeys;                                      // 直接返回 knownKeys
      }
      switch (child.$$typeof) {                                // 根据 child 的类型进行处理
        case REACT_ELEMENT_TYPE:                               // 如果是 React 元素
        case REACT_PORTAL_TYPE:                                // 或者是 Portal
          warnForMissingKey(returnFiber, workInProgress, child);  // 警告缺少 key
          const key = child.key;                               // 获取 child 的 key
          if (typeof key !== 'string') {                       // 如果 key 不是字符串
            break;                                             // 跳出 switch
          }
          if (knownKeys === null) {                            // 如果 knownKeys 为 null
            knownKeys = new Set();                             // 创建一个新的 Set
            knownKeys.add(key);                                // 添加 key
            break;                                             // 跳出 switch
          }
          if (!knownKeys.has(key)) {                           // 如果 knownKeys 中没有这个 key
            knownKeys.add(key);                                // 添加 key
            break;                                             // 跳出 switch
          }
          runWithFiberInDEV(workInProgress, () => {            // 在开发环境下运行
            console.error(                                     // 输出错误信息
              'Encountered two children with the same key, `%s`. ' +
                'Keys should be unique so that components maintain their identity ' +
                'across updates. Non-unique keys may cause children to be ' +
                'duplicated and/or omitted — the behavior is unsupported and ' +
                'could change in a future version.',
              key,
            );
          });
          break;                                               // 跳出 switch
        case REACT_LAZY_TYPE: {                                // 如果是 Lazy 组件
          let resolvedChild;                                   // 声明 resolvedChild 变量
          if (__DEV__) {                                       // 在开发环境下
            resolvedChild = callLazyInitInDEV((child: any));   // 调用 lazy 初始化函数
          } else {                                             // 在生产环境下
            const payload = child._payload;                    // 获取 payload
            const init = (child._init: any);                   // 获取 init 函数
            resolvedChild = init(payload);                     // 初始化 lazy 组件
          }
          warnOnInvalidKey(                                    // 递归检查 resolvedChild 的 key
            returnFiber,
            workInProgress,
            resolvedChild,
            knownKeys,
          );
          break;                                               // 跳出 switch
        }
        default:                                               // 默认情况
          break;                                               // 跳出 switch
      }
    }
    return knownKeys;                                          // 返回更新后的 knownKeys
  }

  /**
   * reconcileChildrenArray 函数主要完成以下任务:
   *
   * 1. 遍历新旧子元素数组，尝试复用现有 Fiber 节点。
   * 2. 处理新增、删除和移动的子元素。
   * 3. 为新的子元素创建 Fiber 节点。
   * 4. 维护子元素的顺序和索引。
   * 5. 优化性能，尽可能复用现有 Fiber 节点。
   * 6. 处理 key 的唯一性，避免重复 key。
   * 7. 返回协调后的第一个子 Fiber 节点。
   *
   * 总的来说，reconcileChildrenArray 函数是 React 协调算法的核心，
   * 负责高效地更新子元素列表，尽量减少不必要的 DOM 操作。
   */
  function reconcileChildrenArray(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    newChildren: Array<any>,           // 新的子元素数组
    lanes: Lanes,                      // 优先级 lanes
  ): Fiber | null {                    // 返回协调后的第一个子 Fiber 节点或 null
    // This algorithm can't optimize by searching from both ends since we
    // don't have backpointers on fibers. I'm trying to see how far we can get
    // with that model. If it ends up not being worth the tradeoffs, we can
    // add it later.

    // Even with a two ended optimization, we'd want to optimize for the case
    // where there are few changes and brute force the comparison instead of
    // going for the Map. It'd like to explore hitting that path first in
    // forward-only mode and only go for the Map once we notice that we need
    // lots of look ahead. This doesn't handle reversal as well as two ended
    // search but that's unusual. Besides, for the two ended optimization to
    // work on Iterables, we'd need to copy the whole set.

    // In this first iteration, we'll just live with hitting the bad case
    // (adding everything to a Map) in for every insert/move.

    // If you change this code, also update reconcileChildrenIterator() which
    // uses the same algorithm.

    let knownKeys: Set<string> | null = null;  // 用于存储已知的 key，防止重复

    let resultingFirstChild: Fiber | null = null;  // 最终返回的第一个子 Fiber 节点
    let previousNewFiber: Fiber | null = null;     // 上一个新创建的 Fiber 节点

    let oldFiber = currentFirstChild;  // 当前处理的旧 Fiber 节点
    let lastPlacedIndex = 0;           // 最后放置的索引
    let newIdx = 0;                    // 新元素的索引
    let nextOldFiber = null;           // 下一个旧 Fiber 节点
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {  // 遍历旧 Fiber 和新子元素
      if (oldFiber.index > newIdx) {   // 如果旧 Fiber 的索引大于当前新索引
        nextOldFiber = oldFiber;       // 保存当前旧 Fiber 为下一个
        oldFiber = null;               // 将当前旧 Fiber 设为 null
      } else {
        nextOldFiber = oldFiber.sibling;  // 否则，移动到兄弟节点
      }
      const newFiber = updateSlot(     // 更新或创建新的 Fiber
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        lanes,
      );
      if (newFiber === null) {         // 如果无法创建新的 Fiber
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        if (oldFiber === null) {       // 如果当前旧 Fiber 为 null
          oldFiber = nextOldFiber;     // 将下一个旧 Fiber 设为当前
        }
        break;                         // 跳出循环
      }

      if (__DEV__) {                   // 开发环境下
        knownKeys = warnOnInvalidKey(  // 检查并警告无效的 key
          returnFiber,
          newFiber,
          newChildren[newIdx],
          knownKeys,
        );
      }

      if (shouldTrackSideEffects) {    // 如果需要跟踪副作用
        if (oldFiber && newFiber.alternate === null) {  // 如果存在旧 Fiber 但没有复用
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          deleteChild(returnFiber, oldFiber);  // 删除旧的子节点
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);  // 放置新的 Fiber
      if (previousNewFiber === null) {  // 如果是第一个新 Fiber
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;  // 设置为结果的第一个子节点
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber;  // 否则，连接到前一个新 Fiber 的兄弟
      }
      previousNewFiber = newFiber;     // 更新前一个新 Fiber
      oldFiber = nextOldFiber;         // 移动到下一个旧 Fiber
    }

    if (newIdx === newChildren.length) {  // 如果已处理完所有新子元素
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);  // 删除剩余的旧子节点
      if (getIsHydrating()) {          // 如果正在 hydrate
        const numberOfForks = newIdx;  // 获取分叉数
        pushTreeFork(returnFiber, numberOfForks);  // 推送树分叉
      }
      return resultingFirstChild;      // 返回结果的第一个子节点
    }

    if (oldFiber === null) {           // 如果没有更多的旧 Fiber
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; newIdx < newChildren.length; newIdx++) {  // 遍历剩余的新子元素
        const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);  // 创建新的子 Fiber
        if (newFiber === null) {       // 如果创建失败
          continue;                    // 继续下一个
        }
        if (__DEV__) {                 // 开发环境下
          knownKeys = warnOnInvalidKey(  // 检查并警告无效的 key
            returnFiber,
            newFiber,
            newChildren[newIdx],
            knownKeys,
          );
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);  // 放置新的 Fiber
        if (previousNewFiber === null) {  // 如果是第一个新 Fiber
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber;  // 设置为结果的第一个子节点
        } else {
          previousNewFiber.sibling = newFiber;  // 否则，连接到前一个新 Fiber 的兄弟
        }
        previousNewFiber = newFiber;   // 更新前一个新 Fiber
      }
      if (getIsHydrating()) {          // 如果正在 hydrate
        const numberOfForks = newIdx;  // 获取分叉数
        pushTreeFork(returnFiber, numberOfForks);  // 推送树分叉
      }
      return resultingFirstChild;      // 返回结果的第一个子节点
    }

    // Add all children to a key map for quick lookups.
    const existingChildren = mapRemainingChildren(oldFiber);  // 将剩余的旧子节点映射到 key

    // Keep scanning and use the map to restore deleted items as moves.
    for (; newIdx < newChildren.length; newIdx++) {  // 遍历剩余的新子元素
      const newFiber = updateFromMap(  // 从 map 中更新或创建新的 Fiber
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes,
      );
      if (newFiber !== null) {         // 如果成功创建新的 Fiber
        if (__DEV__) {                 // 开发环境下
          knownKeys = warnOnInvalidKey(  // 检查并警告无效的 key
            returnFiber,
            newFiber,
            newChildren[newIdx],
            knownKeys,
          );
        }
        if (shouldTrackSideEffects) {  // 如果需要跟踪副作用
          if (newFiber.alternate !== null) {  // 如果新 Fiber 有替代
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren.delete(   // 从现有子节点中删除
              newFiber.key === null ? newIdx : newFiber.key,
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);  // 放置新的 Fiber
        if (previousNewFiber === null) {  // 如果是第一个新 Fiber
          resultingFirstChild = newFiber;  // 设置为结果的第一个子节点
        } else {
          previousNewFiber.sibling = newFiber;  // 否则，连接到前一个新 Fiber 的兄弟
        }
        previousNewFiber = newFiber;   // 更新前一个新 Fiber
      }
    }

    if (shouldTrackSideEffects) {      // 如果需要跟踪副作用
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      existingChildren.forEach(child => deleteChild(returnFiber, child));  // 删除未使用的子节点
    }

    if (getIsHydrating()) {            // 如果正在 hydrate
      const numberOfForks = newIdx;    // 获取分叉数
      pushTreeFork(returnFiber, numberOfForks);  // 推送树分叉
    }
    return resultingFirstChild;        // 返回结果的第一个子节点
  }

  /**
   * reconcileChildrenIteratable 函数主要完成以下任务:
   *
   * 1. 遍历新的可迭代子元素，使用迭代器代替数组。
   * 2. 调用 reconcileChildrenIterator 函数进行协调。
   * 3. 在开发环境下，检查 key 的唯一性，避免重复 key。
   * 4. 返回协调后的第一个子 Fiber 节点。
   *
   * 总的来说，reconcileChildrenIteratable 函数是 React 协调算法的一部分，
   * 专门用于处理可迭代的子元素，确保高效地更新子元素列表，同时尽量减少不必要的 DOM 操作。
   */
  function reconcileChildrenIteratable(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    newChildrenIterable: Iterable<mixed>,  // 新的可迭代子元素
    lanes: Lanes,                      // 优先级 lanes
  ): Fiber | null {                    // 返回协调后的第一个子 Fiber 节点或 null
    // This is the same implementation as reconcileChildrenArray(),
    // but using the iterator instead.

    const iteratorFn = getIteratorFn(newChildrenIterable);  // 获取迭代器函数

    if (typeof iteratorFn !== 'function') {  // 如果不是函数
      throw new Error(
        'An object is not an iterable. This error is likely caused by a bug in ' +
          'React. Please file an issue.',
      );
    }

    const newChildren = iteratorFn.call(newChildrenIterable);  // 调用迭代器函数

    if (__DEV__) {                     // 开发环境下
      if (newChildren === newChildrenIterable) {  // 如果迭代器返回自身
        // We don't support rendering Generators as props because it's a mutation.
        // See https://github.com/facebook/react/issues/12995
        // We do support generators if they were created by a GeneratorFunction component
        // as its direct child since we can recreate those by rerendering the component
        // as needed.
        const isGeneratorComponent =   // 检查是否是生成器组件
          returnFiber.tag === FunctionComponent &&
          // $FlowFixMe[method-unbinding]
          Object.prototype.toString.call(returnFiber.type) ===
            '[object GeneratorFunction]' &&
          // $FlowFixMe[method-unbinding]
          Object.prototype.toString.call(newChildren) === '[object Generator]';
        if (!isGeneratorComponent) {   // 如果不是生成器组件
          if (!didWarnAboutGenerators) {  // 如果还没有警告过
            console.error(
              'Using Iterators as children is unsupported and will likely yield ' +
                'unexpected results because enumerating a generator mutates it. ' +
                'You may convert it to an array with `Array.from()` or the ' +
                '`[...spread]` operator before rendering. You can also use an ' +
                'Iterable that can iterate multiple times over the same items.',
            );
          }
          didWarnAboutGenerators = true;  // 设置警告标志
        }
      } else if ((newChildrenIterable: any).entries === iteratorFn) {  // 如果是 Map
        // Warn about using Maps as children
        if (!didWarnAboutMaps) {       // 如果还没有警告过
          console.error(
            'Using Maps as children is not supported. ' +
              'Use an array of keyed ReactElements instead.',
          );
          didWarnAboutMaps = true;     // 设置警告标志
        }
      }
    }

    return reconcileChildrenIterator(  // 调用迭代器版本的协调函数
      returnFiber,
      currentFirstChild,
      newChildren,
      lanes,
    );
  }

  /**
   * reconcileChildrenAsyncIteratable 函数的主要职责是协调异步可迭代的子元素。
   * 它处理了以下几个主要任务：
   *
   * 1. 获取异步迭代器
   * 2. 在开发环境下进行警告检查
   * 3. 处理空迭代器的情况
   * 4. 将异步迭代器转换为同步迭代器
   * 5. 调用 reconcileChildrenIterator 进行实际的协调工作
   *
   * 这个函数允许 React 处理异步生成的子元素，同时保持与同步迭代器相同的协调逻辑。
   */
  function reconcileChildrenAsyncIteratable(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    newChildrenIterable: AsyncIterable<mixed>,  // 新的异步可迭代子元素
    lanes: Lanes,                      // 优先级 lanes
  ): Fiber | null {                    // 返回协调后的第一个子 Fiber 节点或 null
    const newChildren = newChildrenIterable[ASYNC_ITERATOR]();  // 获取异步迭代器

    if (__DEV__) {                     // 开发环境下
      if (newChildren === newChildrenIterable) {  // 如果迭代器返回自身
        // We don't support rendering AsyncGenerators as props because it's a mutation.
        // We do support generators if they were created by a AsyncGeneratorFunction component
        // as its direct child since we can recreate those by rerendering the component
        // as needed.
        const isGeneratorComponent =   // 检查是否是异步生成器组件
          returnFiber.tag === FunctionComponent &&  // 检查父 Fiber 是否为函数组件
          // $FlowFixMe[method-unbinding]
          Object.prototype.toString.call(returnFiber.type) ===  // 检查父组件类型是否为 AsyncGeneratorFunction
            '[object AsyncGeneratorFunction]' &&
          // $FlowFixMe[method-unbinding]
          Object.prototype.toString.call(newChildren) ===  // 检查子组件是否为 AsyncGenerator
            '[object AsyncGenerator]';
        if (!isGeneratorComponent) {  // 如果不是异步生成器组件
          if (!didWarnAboutGenerators) {  // 如果还没有警告过关于生成器的使用
            console.error(  // 输出错误信息
              'Using AsyncIterators as children is unsupported and will likely yield ' +
                'unexpected results because enumerating a generator mutates it. ' +
                'You can use an AsyncIterable that can iterate multiple times over ' +
                'the same items.',
            );
          }
          didWarnAboutGenerators = true;  // 设置警告标志，避免重复警告
        }
      }
    }

    if (newChildren == null) {  // 如果新的子元素为 null
      throw new Error('An iterable object provided no iterator.');  // 抛出错误
    }

    // To save bytes, we reuse the logic by creating a synchronous Iterable and
    // reusing that code path.
    const iterator: Iterator<mixed> = ({  // 创建一个同步迭代器
      next(): IteratorResult<mixed, void> {  // 定义 next 方法
        return unwrapThenable(newChildren.next());  // 解包异步迭代器的 next 结果
      },
    }: any);

    return reconcileChildrenIterator(  // 调用同步迭代器的协调函数
      returnFiber,  // 父 Fiber
      currentFirstChild,  // 当前第一个子 Fiber
      iterator,  // 新创建的同步迭代器
      lanes,  // 优先级 lanes
    );
  }
  /**
   * reconcileChildrenIterator 函数主要完成以下任务:
   *
   * 1. 遍历新的子元素迭代器和现有的子 Fiber 节点。
   * 2. 尝试复用现有的 Fiber 节点，通过调用 updateSlot 函数。
   * 3. 处理新增、删除和移动的子元素。
   * 4. 为新的子元素创建 Fiber 节点。
   * 5. 维护子元素的顺序和索引。
   * 6. 优化性能，尽可能复用现有 Fiber 节点。
   * 7. 在开发环境下，检查 key 的唯一性，避免重复 key。
   * 8. 返回协调后的第一个子 Fiber 节点。
   *
   * 这个函数是 React 协调算法的核心部分之一，专门用于处理可迭代的子元素。
   * 它确保高效地更新子元素列表，同时尽量减少不必要的 DOM 操作。
   */
  function reconcileChildrenIterator(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    newChildren: ?Iterator<mixed>,     // 新的子元素迭代器
    lanes: Lanes,                      // 优先级 lanes
  ): Fiber | null {                    // 返回协调后的第一个子 Fiber 节点或 null
    if (newChildren == null) {         // 如果新的子元素迭代器为 null
      throw new Error('An iterable object provided no iterator.'); // 抛出错误
    }

    let resultingFirstChild: Fiber | null = null; // 最终返回的第一个子 Fiber 节点
    let previousNewFiber: Fiber | null = null;    // 上一个新创建的 Fiber 节点

    let oldFiber = currentFirstChild;  // 当前处理的旧 Fiber 节点
    let lastPlacedIndex = 0;           // 最后放置的索引
    let newIdx = 0;                    // 新元素的索引
    let nextOldFiber = null;           // 下一个旧 Fiber 节点

    let knownKeys: Set<string> | null = null; // 已知的 key 集合，用于开发环境警告

    let step = newChildren.next();     // 获取迭代器的第一个元素
    for (
      ;
      oldFiber !== null && !step.done; // 当旧 Fiber 存在且迭代器未结束时
      newIdx++, step = newChildren.next() // 更新索引和获取下一个元素
    ) {
      if (oldFiber.index > newIdx) {   // 如果旧 Fiber 的索引大于当前新索引
        nextOldFiber = oldFiber;       // 保存当前旧 Fiber 为下一个
        oldFiber = null;               // 将当前旧 Fiber 设为 null
      } else {
        nextOldFiber = oldFiber.sibling; // 否则，移动到兄弟节点
      }
      const newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes); // 更新或创建新的 Fiber
      if (newFiber === null) {         // 如果无法创建新的 Fiber
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        if (oldFiber === null) {       // 如果当前旧 Fiber 为 null
          oldFiber = nextOldFiber;     // 将下一个旧 Fiber 设为当前
        }
        break;                         // 跳出循环
      }

      if (__DEV__) {                   // 开发环境下
        knownKeys = warnOnInvalidKey(  // 检查并警告无效的 key
          returnFiber,
          newFiber,
          step.value,
          knownKeys,
        );
      }

      if (shouldTrackSideEffects) {    // 如果需要追踪副作用
        if (oldFiber && newFiber.alternate === null) { // 如果存在旧 Fiber 且新 Fiber 没有替代
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          deleteChild(returnFiber, oldFiber); // 删除旧的子节点
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx); // 放置新的 Fiber
      if (previousNewFiber === null) { // 如果是第一个新 Fiber
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber; // 设置为结果的第一个子节点
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber; // 否则，链接到前一个新 Fiber 的兄弟
      }
      previousNewFiber = newFiber;     // 更新前一个新 Fiber
      oldFiber = nextOldFiber;         // 移动到下一个旧 Fiber
    }

    if (step.done) {                   // 如果迭代器已结束
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber); // 删除剩余的旧子节点
      if (getIsHydrating()) {          // 如果正在 hydrate
        const numberOfForks = newIdx;  // 获取分叉数量
        pushTreeFork(returnFiber, numberOfForks); // 推送树分叉
      }
      return resultingFirstChild;      // 返回结果的第一个子节点
    }

    if (oldFiber === null) {           // 如果没有更多的旧 Fiber
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; !step.done; newIdx++, step = newChildren.next()) { // 继续处理剩余的新元素
        const newFiber = createChild(returnFiber, step.value, lanes); // 创建新的子 Fiber
        if (newFiber === null) {       // 如果创建失败
          continue;                    // 继续下一个
        }
        if (__DEV__) {                 // 开发环境下
          knownKeys = warnOnInvalidKey( // 检查并警告无效的 key
            returnFiber,
            newFiber,
            step.value,
            knownKeys,
          );
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx); // 放置新的 Fiber
        if (previousNewFiber === null) { // 如果是第一个新 Fiber
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber; // 设置为结果的第一个子节点
        } else {
          previousNewFiber.sibling = newFiber; // 否则，链接到前一个新 Fiber 的兄弟
        }
        previousNewFiber = newFiber;   // 更新前一个新 Fiber
      }
      if (getIsHydrating()) {          // 如果正在 hydrate
        const numberOfForks = newIdx;  // 获取分叉数量
        pushTreeFork(returnFiber, numberOfForks); // 推送树分叉
      }
      return resultingFirstChild;      // 返回结果的第一个子节点
    }

    // Add all children to a key map for quick lookups.
    const existingChildren = mapRemainingChildren(oldFiber); // 将剩余的旧子节点映射到 key

    // Keep scanning and use the map to restore deleted items as moves.
    for (; !step.done; newIdx++, step = newChildren.next()) { // 继续处理剩余的新元素
      const newFiber = updateFromMap(  // 从 map 中更新或创建新的 Fiber
        existingChildren,
        returnFiber,
        newIdx,
        step.value,
        lanes,
      );
      if (newFiber !== null) {         // 如果成功创建新的 Fiber
        if (__DEV__) {                 // 开发环境下
          knownKeys = warnOnInvalidKey( // 检查并警告无效的 key
            returnFiber,
            newFiber,
            step.value,
            knownKeys,
          );
        }
        if (shouldTrackSideEffects) {  // 如果需要追踪副作用
          if (newFiber.alternate !== null) { // 如果新 Fiber 有替代
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren.delete(   // 从现有子节点 map 中删除
              newFiber.key === null ? newIdx : newFiber.key,
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx); // 放置新的 Fiber
        if (previousNewFiber === null) { // 如果是第一个新 Fiber
          resultingFirstChild = newFiber; // 设置为结果的第一个子节点
        } else {
          previousNewFiber.sibling = newFiber; // 否则，链接到前一个新 Fiber 的兄弟
        }
        previousNewFiber = newFiber;   // 更新前一个新 Fiber
      }
    }

    if (shouldTrackSideEffects) {      // 如果需要追踪副作用
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      existingChildren.forEach(child => deleteChild(returnFiber, child)); // 删除未使用的旧子节点
    }

    if (getIsHydrating()) {            // 如果正在 hydrate
      const numberOfForks = newIdx;    // 获取分叉数量
      pushTreeFork(returnFiber, numberOfForks); // 推送树分叉
    }
    return resultingFirstChild;        // 返回结果的第一个子节点
  }

  /**
   * reconcileSingleTextNode 函数主要完成以下任务:
   *
   * 1. 处理单个文本节点的协调过程。
   * 2. 如果当前第一个子节点是文本节点，尝试复用它:
   *    - 删除其他兄弟节点
   *    - 更新现有文本节点的内容
   * 3. 如果当前第一个子节点不是文本节点:
   *    - 删除所有现有子节点
   *    - 创建新的文本节点 Fiber
   * 4. 设置新的或更新后的 Fiber 节点的父节点引用
   * 5. 在开发环境下，设置额外的调试信息
   * 6. 返回协调后的文本节点 Fiber
   *
   * 总的来说，reconcileSingleTextNode 函数优化了文本节点的更新过程，
   * 尽可能复用现有节点，减少不必要的 DOM 操作。
   */
  function reconcileSingleTextNode(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    textContent: string,               // 新的文本内容
    lanes: Lanes,                      // 优先级 lanes
  ): Fiber {                           // 返回协调后的 Fiber 节点
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) { // 如果当前第一个子节点是文本节点
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling); // 删除其他兄弟节点
      const existing = useFiber(currentFirstChild, textContent); // 复用现有 Fiber，更新文本内容
      existing.return = returnFiber;   // 设置父节点
      return existing;                 // 返回更新后的 Fiber
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFiber, currentFirstChild); // 删除所有现有子节点
    const created = createFiberFromText(textContent, returnFiber.mode, lanes); // 创建新的文本 Fiber
    created.return = returnFiber;      // 设置父节点
    if (__DEV__) {                     // 开发环境下
      // We treat the parent as the owner for stack purposes.
      created._debugOwner = returnFiber; // 设置调试用的 owner
      if (enableOwnerStacks) {         // 如果启用了 owner 堆栈
        created._debugTask = returnFiber._debugTask; // 设置调试任务
      }
      created._debugInfo = currentDebugInfo; // 设置调试信息
    }
    return created;                    // 返回新创建的文本 Fiber
  }

  /**
   * reconcileSingleElement 函数主要完成以下任务:
   *
   * 1. 处理单个元素的协调过程。
   * 2. 遍历现有子节点，寻找可以复用的 Fiber 节点:
   *    - 比较 key 和元素类型
   *    - 如果找到匹配的节点，复用该节点并更新 props
   *    - 删除其他不匹配的兄弟节点
   * 3. 如果没有找到可复用的节点:
   *    - 删除所有现有子节点
   *    - 创建新的 Fiber 节点
   * 4. 处理特殊情况，如 Fragment 和 lazy 组件
   * 5. 设置新的或更新后的 Fiber 节点的父节点引用
   * 6. 在开发环境下，设置额外的调试信息
   * 7. 处理 ref
   * 8. 返回协调后的 Fiber 节点
   *
   * 总的来说，reconcileSingleElement 函数优化了单个元素的更新过程，
   * 尽可能复用现有节点，处理特殊情况，并确保正确的节点结构和引用关系。
   */
  function reconcileSingleElement(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    element: ReactElement,             // 新的 React 元素
    lanes: Lanes,                      // 优先级 lanes
  ): Fiber {                           // 返回协调后的 Fiber 节点
    const key = element.key;           // 获取新元素的 key
    let child = currentFirstChild;     // 当前处理的子节点，初始为第一个子节点
    while (child !== null) {           // 遍历当前的子节点列表
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {         // 如果找到了 key 匹配的子节点
        const elementType = element.type; // 获取新元素的类型
        if (elementType === REACT_FRAGMENT_TYPE) { // 如果新元素是 Fragment
          if (child.tag === Fragment) { // 如果当前子节点也是 Fragment
            deleteRemainingChildren(returnFiber, child.sibling); // 删除剩余的兄弟节点
            const existing = useFiber(child, element.props.children); // 复用现有 Fiber，更新 props
            existing.return = returnFiber; // 设置父节点
            if (__DEV__) {             // 开发环境下
              existing._debugOwner = element._owner; // 设置调试用的 owner
              existing._debugInfo = currentDebugInfo; // 设置调试信息
            }
            validateFragmentProps(element, existing, returnFiber); // 验证 Fragment 属性
            return existing;           // 返回复用的 Fiber 节点
          }
        } else {                       // 如果新元素不是 Fragment
          if (
            child.elementType === elementType || // 元素类型相同
            // Keep this check inline so it only runs on the false path:
            (__DEV__
              ? isCompatibleFamilyForHotReloading(child, element) // 开发环境下检查热重载兼容性
              : false) ||
            // Lazy types should reconcile their resolved type.
            // We need to do this after the Hot Reloading check above,
            // because hot reloading has different semantics than prod because
            // it doesn't resuspend. So we can't let the call below suspend.
            (typeof elementType === 'object' &&
              elementType !== null &&
              elementType.$$typeof === REACT_LAZY_TYPE &&
              resolveLazy(elementType) === child.type) // 处理 lazy 类型
          ) {
            deleteRemainingChildren(returnFiber, child.sibling); // 删除剩余的兄弟节点
            const existing = useFiber(child, element.props); // 复用现有 Fiber，更新 props
            coerceRef(returnFiber, child, existing, element); // 处理 ref
            existing.return = returnFiber; // 设置父节点
            if (__DEV__) {             // 开发环境下
              existing._debugOwner = element._owner; // 设置调试用的 owner
              existing._debugInfo = currentDebugInfo; // 设置调试信息
            }
            return existing;           // 返回复用的 Fiber 节点
          }
        }
        // Didn't match.
        deleteRemainingChildren(returnFiber, child); // 删除剩余的子节点
        break;                         // 跳出循环
      } else {
        deleteChild(returnFiber, child); // 删除不匹配的子节点
      }
      child = child.sibling;           // 移动到下一个兄弟节点
    }

    if (element.type === REACT_FRAGMENT_TYPE) { // 如果新元素是 Fragment
      const created = createFiberFromFragment( // 创建新的 Fragment Fiber
        element.props.children,
        returnFiber.mode,
        lanes,
        element.key,
      );
      created.return = returnFiber;    // 设置父节点
      if (__DEV__) {                   // 开发环境下
        // We treat the parent as the owner for stack purposes.
        created._debugOwner = returnFiber; // 设置调试用的 owner
        if (enableOwnerStacks) {
          created._debugTask = returnFiber._debugTask; // 设置调试任务
        }
        created._debugInfo = currentDebugInfo; // 设置调试信息
      }
      validateFragmentProps(element, created, returnFiber); // 验证 Fragment 属性
      return created;                  // 返回新创建的 Fiber 节点
    } else {                           // 如果新元素不是 Fragment
      const created = createFiberFromElement(element, returnFiber.mode, lanes); // 创建新的元素 Fiber
      coerceRef(returnFiber, currentFirstChild, created, element); // 处理 ref
      created.return = returnFiber;    // 设置父节点
      if (__DEV__) {                   // 开发环境下
        created._debugInfo = currentDebugInfo; // 设置调试信息
      }
      return created;                  // 返回新创建的 Fiber 节点
    }
  }

  /**
   * reconcileSinglePortal 函数主要完成以下任务:
   *
   * 1. 处理单个 Portal 的协调过程。
   * 2. 遍历现有子节点，寻找可以复用的 Portal 节点:
   *    - 比较 key 和 Portal 的容器信息及实现方式
   *    - 如果找到匹配的节点，复用该节点并更新 children
   *    - 删除其他不匹配的兄弟节点
   * 3. 如果没有找到可复用的节点:
   *    - 删除所有现有子节点
   *    - 创建新的 Portal Fiber
   * 4. 设置新的或更新后的 Fiber 节点的父节点引用
   * 5. 在开发环境下，设置额外的调试信息
   * 6. 返回协调后的 Fiber 节点
   *
   * 总的来说，reconcileSinglePortal 函数优化了单个 Portal 的更新过程，
   * 尽可能复用现有节点，处理特殊情况，并确保正确的节点结构和引用关系。
   */
  function reconcileSinglePortal(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    portal: ReactPortal,               // Portal 元素
    lanes: Lanes,                      // 优先级 lanes
  ): Fiber {                           // 返回协调后的 Fiber 节点
    const key = portal.key;            // 获取 Portal 的 key
    let child = currentFirstChild;     // 当前处理的子节点，初始为第一个子节点
    while (child !== null) {           // 遍历当前的子节点列表
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {         // 如果找到了 key 匹配的子节点
        if (
          child.tag === HostPortal &&  // 当前子节点是 Portal
          child.stateNode.containerInfo === portal.containerInfo && // 容器信息相同
          child.stateNode.implementation === portal.implementation // 实现方式相同
        ) {
          deleteRemainingChildren(returnFiber, child.sibling); // 删除剩余的兄弟节点
          const existing = useFiber(child, portal.children || []); // 复用现有 Fiber，更新 children
          existing.return = returnFiber; // 设置父节点
          return existing;             // 返回复用的 Fiber 节点
        } else {
          deleteRemainingChildren(returnFiber, child); // 删除剩余的子节点
          break;                       // 跳出循环
        }
      } else {
        deleteChild(returnFiber, child); // 删除不匹配的子节点
      }
      child = child.sibling;           // 移动到下一个兄弟节点
    }

    const created = createFiberFromPortal(portal, returnFiber.mode, lanes); // 创建新的 Portal Fiber
    created.return = returnFiber;      // 设置父节点
    return created;                    // 返回新创建的 Fiber 节点
  }

  // This API will tag the children with the side-effect of the reconciliation
  // itself. They will be added to the side-effect list as we pass through the
  // children and the parent.

  /**
   * reconcileChildFibersImpl 函数主要完成以下任务:
   *
   * 1. 处理顶层未键化的 Fragment，将其视为子元素数组。
   * 2. 根据 newChild 的类型进行不同的处理:
   *    - 如果是 React 元素，调用 reconcileSingleElement 进行协调
   *    - 如果是 Portal，调用 reconcileSinglePortal 进行协调
   *    - 如果是数组或可迭代对象，调用 reconcileChildrenArray 处理多个子元素
   *    - 如果是文本节点（字符串或数字），调用 reconcileSingleTextNode 处理
   * 3. 处理特殊情况，如 null、undefined 等
   * 4. 对于不支持的类型，抛出错误或删除剩余子元素
   * 5. 在开发环境下，进行额外的类型检查和警告
   *
   * 总的来说，reconcileChildFibersImpl 函数是协调子 Fiber 的核心，
   * 根据新旧子节点的状态决定如何更新 Fiber 树。
   */
  function reconcileChildFibersImpl(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    newChild: any,                     // 新的子节点
    lanes: Lanes,                      // 优先级lanes
  ): Fiber | null {                    // 返回新的子 Fiber 节点或 null
    // This function is only recursive for Usables/Lazy and not nested arrays.
    // That's so that using a Lazy wrapper is unobservable to the Fragment
    // convention.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.

    // Handle top level unkeyed fragments as if they were arrays.
    // This leads to an ambiguity between <>{[...]}</> and <>...</>.
    // We treat the ambiguous cases above the same.
    // We don't use recursion here because a fragment inside a fragment
    // is no longer considered "top level" for these purposes.
    const isUnkeyedTopLevelFragment =  // 检查是否为未键化的顶级 Fragment
      typeof newChild === 'object' &&  // newChild 是对象
      newChild !== null &&             // newChild 不为 null
      newChild.type === REACT_FRAGMENT_TYPE && // newChild 类型为 Fragment
      newChild.key === null;           // newChild 没有 key
    if (isUnkeyedTopLevelFragment) {   // 如果是未键化的顶级 Fragment
      validateFragmentProps(newChild, null, returnFiber); // 验证 Fragment 属性
      newChild = newChild.props.children; // 将 newChild 设置为 Fragment 的子元素
    }

    // Handle object types
    if (typeof newChild === 'object' && newChild !== null) { // 如果 newChild 是非 null 对象
      switch (newChild.$$typeof) {     // 根据 newChild 的类型进行处理
        case REACT_ELEMENT_TYPE: {     // 如果是 React 元素
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo); // 保存调试信息
          const firstChild = placeSingleChild( // 放置单个子元素
            reconcileSingleElement(   // 协调单个元素
              returnFiber,
              currentFirstChild,
              newChild,
              lanes,
            ),
          );
          currentDebugInfo = prevDebugInfo; // 恢复调试信息
          return firstChild;           // 返回处理后的子元素
        }
        case REACT_PORTAL_TYPE:        // 如果是 Portal
          return placeSingleChild(     // 放置单个子元素
            reconcileSinglePortal(     // 协调单个 Portal
              returnFiber,
              currentFirstChild,
              newChild,
              lanes,
            ),
          );
        case REACT_LAZY_TYPE: {        // 如果是 Lazy 组件
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo); // 保存调试信息
          let result;
          if (__DEV__) {               // 开发环境
            result = callLazyInitInDEV(newChild); // 调用 Lazy 初始化函数
          } else {                     // 生产环境
            const payload = newChild._payload; // 获取 Lazy 组件的 payload
            const init = newChild._init; // 获取 Lazy 组件的初始化函数
            result = init(payload);    // 执行初始化函数
          }
          const firstChild = reconcileChildFibersImpl( // 递归协调子元素
            returnFiber,
            currentFirstChild,
            result,
            lanes,
          );
          currentDebugInfo = prevDebugInfo; // 恢复调试信息
          return firstChild;           // 返回处理后的子元素
        }
      }

      if (isArray(newChild)) {         // 如果 newChild 是数组
        const prevDebugInfo = pushDebugInfo(newChild._debugInfo); // 保存调试信息
        const firstChild = reconcileChildrenArray( // 协调子元素数组
          returnFiber,
          currentFirstChild,
          newChild,
          lanes,
        );
        currentDebugInfo = prevDebugInfo; // 恢复调试信息
        return firstChild;             // 返回处理后的子元素
      }

      if (getIteratorFn(newChild)) {   // 如果 newChild 是可迭代对象
        const prevDebugInfo = pushDebugInfo(newChild._debugInfo); // 保存调试信息
        const firstChild = reconcileChildrenIteratable( // 协调可迭代的子元素
          returnFiber,
          currentFirstChild,
          newChild,
          lanes,
        );
        currentDebugInfo = prevDebugInfo; // 恢复调试信息
        return firstChild;             // 返回处理后的子元素
      }

      if (
        enableAsyncIterableChildren && // 如果启用了异步可迭代子元素
        typeof newChild[ASYNC_ITERATOR] === 'function' // 且 newChild 是异步可迭代对象
      ) {
        const prevDebugInfo = pushDebugInfo(newChild._debugInfo); // 保存调试信息
        const firstChild = reconcileChildrenAsyncIteratable( // 协调异步可迭代的子元素
          returnFiber,
          currentFirstChild,
          newChild,
          lanes,
        );
        currentDebugInfo = prevDebugInfo; // 恢复调试信息
        return firstChild;             // 返回处理后的子元素
      }

      // Usables are a valid React node type. When React encounters a Usable in
      // a child position, it unwraps it using the same algorithm as `use`. For
      // example, for promises, React will throw an exception to unwind the
      // stack, then replay the component once the promise resolves.
      //
      // A difference from `use` is that React will keep unwrapping the value
      // until it reaches a non-Usable type.
      //
      // e.g. Usable<Usable<Usable<T>>> should resolve to T
      //
      // The structure is a bit unfortunate. Ideally, we shouldn't need to
      // replay the entire begin phase of the parent fiber in order to reconcile
      // the children again. This would require a somewhat significant refactor,
      // because reconcilation happens deep within the begin phase, and
      // depending on the type of work, not always at the end. We should
      // consider as an future improvement.
      if (typeof newChild.then === 'function') { // 如果 newChild 是 Promise
        const thenable: Thenable<any> = (newChild: any); // 类型断言
        const prevDebugInfo = pushDebugInfo((thenable: any)._debugInfo); // 保存调试信息
        const firstChild = reconcileChildFibersImpl( // 递归协调子元素
          returnFiber,
          currentFirstChild,
          unwrapThenable(thenable),    // 解包 thenable
          lanes,
        );
        currentDebugInfo = prevDebugInfo; // 恢复调试信息
        return firstChild;             // 返回处理后的子元素
      }

      if (newChild.$$typeof === REACT_CONTEXT_TYPE) { // 如果 newChild 是 Context
        const context: ReactContext<mixed> = (newChild: any); // 类型断言
        return reconcileChildFibersImpl( // 递归协调子元素
          returnFiber,
          currentFirstChild,
          readContextDuringReconciliation(returnFiber, context, lanes), // 读取 Context
          lanes,
        );
      }

      throwOnInvalidObjectType(returnFiber, newChild); // 抛出无效对象类型错误
    }

    if (
      (typeof newChild === 'string' && newChild !== '') || // 如果 newChild 是非空字符串
      typeof newChild === 'number' ||  // 或者是数字
      typeof newChild === 'bigint'     // 或者是 BigInt
    ) {
      return placeSingleChild(         // 放置单个子元素
        reconcileSingleTextNode(       // 协调单个文本节点
          returnFiber,
          currentFirstChild,
          // $FlowFixMe[unsafe-addition] Flow doesn't want us to use `+` operator with string and bigint
          '' + newChild,               // 将 newChild 转换为字符串
          lanes,
        ),
      );
    }

    if (__DEV__) {                     // 开发环境
      if (typeof newChild === 'function') { // 如果 newChild 是函数
        warnOnFunctionType(returnFiber, newChild); // 警告函数类型
      }
      if (typeof newChild === 'symbol') { // 如果 newChild 是 symbol
        warnOnSymbolType(returnFiber, newChild); // 警告 symbol 类型
      }
    }

    // Remaining cases are all treated as empty.
    return deleteRemainingChildren(returnFiber, currentFirstChild); // 删除剩余子元素
  }

  /**
   * reconcileChildFibers 函数主要完成以下任务:
   *
   * 1. 根据当前 Fiber 的状态，决定是挂载新组件还是更新现有组件。
   * 2. 如果是新组件，使用 mountChildFibers 挂载新组件。
   * 3. 如果是更新，使用 reconcileChildFibers 更新现有组件。
   *
   * 总的来说，reconcileChildFibers 函数用于协调子元素，根据当前 Fiber 的状态决定是挂载新组件还是更新现有组件。
   */
  function reconcileChildFibers(
    returnFiber: Fiber,                // 父级 Fiber 节点
    currentFirstChild: Fiber | null,   // 当前第一个子 Fiber 节点
    newChild: any,                     // 新的子节点
    lanes: Lanes,                      // 优先级lanes
  ): Fiber | null {                    // 返回新的子 Fiber 节点或 null
    const prevDebugInfo = currentDebugInfo;  // 保存当前的调试信息
    currentDebugInfo = null;                 // 清空当前调试信息
    try {
      // This indirection only exists so we can reset `thenableState` at the end.
      // It should get inlined by Closure.
      thenableIndexCounter = 0;              // 重置 thenable 索引计数器
      const firstChildFiber = reconcileChildFibersImpl(  // 调用实际的协调函数
        returnFiber,
        currentFirstChild,
        newChild,
        lanes,
      );
      thenableState = null;                  // 重置 thenable 状态
      // Don't bother to reset `thenableIndexCounter` to 0 because it always gets
      // set at the beginning.
      return firstChildFiber;                // 返回协调后的第一个子 Fiber
    } catch (x) {
      if (
        x === SuspenseException ||           // 处理 Suspense 异常
        (!disableLegacyMode &&
          (returnFiber.mode & ConcurrentMode) === NoMode &&
          typeof x === 'object' &&
          x !== null &&
          typeof x.then === 'function')
      ) {
        // Suspense exceptions need to read the current suspended state before
        // yielding and replay it using the same sequence so this trick doesn't
        // work here.
        // Suspending in legacy mode actually mounts so if we let the child
        // mount then we delete its state in an update.
        throw x;                             // 重新抛出 Suspense 异常
      }
      // Something errored during reconciliation but it's conceptually a child that
      // errored and not the current component itself so we create a virtual child
      // that throws in its begin phase. That way the current component can handle
      // the error or suspending if needed.
      const throwFiber = createFiberFromThrow(x, returnFiber.mode, lanes);  // 创建一个表示错误的 Fiber
      throwFiber.return = returnFiber;       // 设置错误 Fiber 的父节点
      if (__DEV__) {
        const debugInfo = (throwFiber._debugInfo = currentDebugInfo);  // 设置调试信息
        // Conceptually the error's owner/task should ideally be captured when the
        // Error constructor is called but neither console.createTask does this,
        // nor do we override them to capture our `owner`. So instead, we use the
        // nearest parent as the owner/task of the error. This is usually the same
        // thing when it's thrown from the same async component but not if you await
        // a promise started from a different component/task.
        throwFiber._debugOwner = returnFiber._debugOwner;  // 设置调试所有者
        if (enableOwnerStacks) {
          throwFiber._debugTask = returnFiber._debugTask;  // 设置调试任务
        }
        if (debugInfo != null) {
          for (let i = debugInfo.length - 1; i >= 0; i--) {
            if (typeof debugInfo[i].stack === 'string') {
              throwFiber._debugOwner = (debugInfo[i]: any);  // 设置更精确的调试所有者
              if (enableOwnerStacks) {
                throwFiber._debugTask = debugInfo[i].debugTask;  // 设置更精确的调试任务
              }
              break;
            }
          }
        }
      }
      return throwFiber;                     // 返回表示错误的 Fiber
    } finally {
      currentDebugInfo = prevDebugInfo;      // 恢复之前的调试信息
    }
  }

  return reconcileChildFibers;
}
```

:::

`createChildReconciler` 函数是 React 协调器（Reconciler）中的一个核心函数，它创建并返回一个用于协调子元素的函数。这个函数主要完成以下任务：

1. 创建协调器函数：
   它返回一个函数，通常被称为 `reconcileChildFibers`，这个函数是实际执行子元素协调的地方。

2. 定义内部辅助函数：
   在 `createChildReconciler` 内部，定义了许多辅助函数，这些函数在协调过程中被使用。例如：

   - `deleteChild`: 用于删除子节点
   - `deleteRemainingChildren`: 删除剩余的子节点
   - `mapRemainingChildren`: 将剩余的子节点映射到一个 Map 中
   - `useFiber`: 复用现有的 Fiber 节点
   - `placeChild`: 放置子节点
   - `placeSingleChild`: 放置单个子节点
   - `updateTextNode`: 更新文本节点
   - `updateElement`: 更新元素节点
   - `updatePortal`: 更新 Portal 节点
   - `updateFragment`: 更新 Fragment 节点
   - `createChild`: 创建新的子节点
   - `updateSlot`: 更新特定位置的节点
   - `updateFromMap`: 从 Map 中更新节点

3. 实现 diff 算法：
   这些内部函数共同实现了 React 的 diff 算法，用于高效地比较新旧子元素列表。

4. 处理不同类型的子元素：
   它能够处理各种类型的子元素，包括文本节点、元素节点、Portal、Fragment 等。

5. 优化性能：
   通过复用现有 Fiber 节点和最小化 DOM 操作来优化性能。

6. 处理 key：
   实现了基于 key 的优化，帮助 React 在更新时正确地识别和复用元素。

7. 副作用跟踪：
   根据 `shouldTrackSideEffects` 参数决定是否跟踪副作用（如需要执行的 DOM 操作）。

8. 开发环境警告：
   在开发环境中，添加了一些警告和错误检查，如检测重复的 key。

9. 处理特殊情况：
   处理诸如 lazy 加载组件、Context 等特殊情况。

10. 创建协调子数组的函数：
    包含 `reconcileChildrenArray` 函数，这是处理子元素数组的核心逻辑。

11. 返回协调函数：
    最终返回 `reconcileChildFibers` 函数，这个函数会在 `beginWork` 阶段被调用来协调子元素。

总的来说，`createChildReconciler` 函数封装了 React 协调过程中处理子元素的全部逻辑，为 React 的高效更新提供了基础。它的设计允许 React 在不同的场景下（如初次渲染和更新）复用相同的协调逻辑，同时通过闭包保持了内部状态和优化。

### 3、reconcileChildrenArray

React 中这里的双循环主要是为了高效地协调（reconcile）新旧子元素，并尽可能地复用现有的 Fiber 节点。这个过程被称为 "Reconciliation"，是 React 的核心算法之一。让我们详细分析这两个循环：

第一个循环：

```javascript
for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
  // ...
}
```

这个循环的主要目的是：

1. 尝试复用现有的 Fiber 节点：遍历旧的 Fiber 节点和新的子元素，尝试匹配和更新。
2. 处理位置变化：通过 `placeChild` 函数处理元素的位置变化。
3. 删除不再需要的节点：如果新的元素无法匹配到旧的 Fiber，则删除旧的 Fiber。
4. 创建新的 Fiber 节点：如果无法复用现有的 Fiber，则创建新的。

第二个循环：

```javascript
for (; newIdx < newChildren.length; newIdx++) {
  // ...
}
```

这个循环的主要目的是：

1. 处理剩余的新子元素：第一个循环结束后，可能还有新的子元素没有处理。
2. 创建新的 Fiber 节点：为剩余的新子元素创建对应的 Fiber 节点。
3. 优化插入操作：由于这些都是新增的元素，React 可以采用更高效的方式来插入它们。

这两个循环共同完成了以下任务：

1. 最大程度地复用现有 Fiber 节点，减少不必要的 DOM 操作。
2. 正确处理元素的增加、删除和移动。
3. 维护正确的 Fiber 树结构，包括兄弟节点之间的链接。
4. 跟踪副作用（如需要删除的节点）。
5. 在开发环境中，检查和警告无效的 key。
6. 处理特殊情况，如 hydration（服务器端渲染的客户端激活过程）。

这种算法设计允许 React 在 O(n) 的时间复杂度内完成协调过程，其中 n 是子元素的数量。这种效率对于处理大型列表和频繁更新的场景非常重要。
