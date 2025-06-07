# commit

### 1、commit 阶段

```js
function commitRoot(
  root: FiberRoot, // 根fiber节点
  recoverableErrors: null | Array<CapturedValue<mixed>>, // 可恢复的错误数组
  transitions: Array<Transition> | null, // 过渡效果数组
  didIncludeRenderPhaseUpdate: boolean, // 是否包含渲染阶段更新的标志
  spawnedLane: Lane // 新产生的优先级通道
) {
  // TODO: This no longer makes any sense. We already wrap the mutation and
  // layout phases. Should be able to remove.
  const prevTransition = ReactSharedInternals.T // 保存当前的过渡状态
  const previousUpdateLanePriority = getCurrentUpdatePriority() // 获取当前更新优先级
  try {
    setCurrentUpdatePriority(DiscreteEventPriority) // 设置更新优先级为离散事件优先级
    ReactSharedInternals.T = null // 清空当前过渡状态
    commitRootImpl(
      // 调用实际的提交根节点实现
      root,
      recoverableErrors,
      transitions,
      didIncludeRenderPhaseUpdate,
      previousUpdateLanePriority,
      spawnedLane
    )
  } finally {
    ReactSharedInternals.T = prevTransition // 恢复之前的过渡状态
    setCurrentUpdatePriority(previousUpdateLanePriority) // 恢复之前的更新优先级
  }

  return null // 返回null，表示提交完成
} // 执行变更前的效果
```

:::details commitRootImpl

```js
function commitRootImpl(
  root: FiberRoot, // 根fiber节点
  recoverableErrors: null | Array<CapturedValue<mixed>>, // 可恢复的错误数组
  transitions: Array<Transition> | null, // 过渡效果数组
  didIncludeRenderPhaseUpdate: boolean, // 是否包含渲染阶段更新的标志
  renderPriorityLevel: EventPriority, // 渲染优先级
  spawnedLane: Lane // 新产生的优先级通道
) {
  do {
    flushPassiveEffects() // 循环刷新被动效果，直到没有待处理的效果
  } while (rootWithPendingPassiveEffects !== null)
  flushRenderPhaseStrictModeWarningsInDEV() // 在开发模式下刷新渲染阶段的严格模式警告

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Should not already be working.') // 检查是否已经在工作中，如果是则抛出错误
  }

  const finishedWork = root.finishedWork // 获取完成的工作
  const lanes = root.finishedLanes // 获取完成的优先级通道

  if (__DEV__) {
    if (enableDebugTracing) {
      logCommitStarted(lanes) // 在开发模式下，如果启用了调试跟踪，记录提交开始
    }
  }

  if (enableSchedulingProfiler) {
    markCommitStarted(lanes) // 如果启用了调度分析器，标记提交开始
  }

  if (finishedWork === null) {
    if (__DEV__) {
      if (enableDebugTracing) {
        logCommitStopped() // 如果没有完成的工作，在开发模式下记录提交停止
      }
    }

    if (enableSchedulingProfiler) {
      markCommitStopped() // 如果启用了调度分析器，标记提交停止
    }

    return null // 如果没有完成的工作，返回null
  } else {
    if (__DEV__) {
      if (lanes === NoLanes) {
        console.error(
          'root.finishedLanes should not be empty during a commit. This is a ' + 'bug in React.'
        ) // 在开发模式下，如果完成的优先级通道为空，输出错误信息
      }
    }
  }
  root.finishedWork = null // 重置完成的工作为null
  root.finishedLanes = NoLanes // 重置完成的优先级通道为NoLanes

  if (finishedWork === root.current) {
    throw new Error(
      'Cannot commit the same tree as before. This error is likely caused by ' +
        'a bug in React. Please file an issue.'
    ) // 如果完成的工作与当前工作相同，抛出错误
  }

  root.callbackNode = null // 清除回调节点
  root.callbackPriority = NoLane // 重置回调优先级
  root.cancelPendingCommit = null // 清除待处理的提交取消函数

  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes) // 合并完成工作的优先级通道

  const concurrentlyUpdatedLanes = getConcurrentlyUpdatedLanes() // 获取并发更新的优先级通道
  remainingLanes = mergeLanes(remainingLanes, concurrentlyUpdatedLanes) // 合并剩余的优先级通道和并发更新的优先级通道

  markRootFinished(root, remainingLanes, spawnedLane) // 标记根节点完成

  didIncludeCommitPhaseUpdate = false // 重置提交阶段更新标志

  if (root === workInProgressRoot) {
    workInProgressRoot = null // 重置进行中的根节点
    workInProgress = null // 重置进行中的工作
    workInProgressRootRenderLanes = NoLanes // 重置进行中的根节点渲染优先级通道
  } else {
  }

  if (
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
    (finishedWork.flags & PassiveMask) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true // 设置根节点有被动效果的标志
      pendingPassiveEffectsRemainingLanes = remainingLanes // 设置待处理的被动效果剩余优先级通道
      pendingPassiveTransitions = transitions // 设置待处理的被动过渡
      scheduleCallback(NormalSchedulerPriority, () => {
        flushPassiveEffects() // 调度一个回调来刷新被动效果
        return null
      })
    }
  }

  const subtreeHasEffects =
    (finishedWork.subtreeFlags & (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
    NoFlags // 检查子树是否有效果
  const rootHasEffect =
    (finishedWork.flags & (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !==
    NoFlags // 检查根节点是否有效果

  if (subtreeHasEffects || rootHasEffect) {
    const prevTransition = ReactSharedInternals.T // 保存当前的过渡状态
    ReactSharedInternals.T = null // 清空当前过渡状态
    const previousPriority = getCurrentUpdatePriority() // 获取当前更新优先级
    setCurrentUpdatePriority(DiscreteEventPriority) // 设置当前更新优先级为离散事件优先级

    const prevExecutionContext = executionContext // 保存当前执行上下文
    executionContext |= CommitContext // 设置执行上下文为提交上下文

    const shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(root, finishedWork) // 执行变更前的效果

    if (enableProfilerTimer) {
      recordCommitTime() // 记录提交时间
    }

    commitMutationEffects(root, finishedWork, lanes) // 执行变更效果

    if (enableCreateEventHandleAPI) {
      if (shouldFireAfterActiveInstanceBlur) {
        afterActiveInstanceBlur() // 如果需要，在活动实例模糊后触发
      }
    }
    resetAfterCommit(root.containerInfo) // 重置提交后的容器信息

    root.current = finishedWork // 更新当前树为完成的工作

    if (__DEV__) {
      if (enableDebugTracing) {
        logLayoutEffectsStarted(lanes) // 在开发模式下，如果启用了调试跟踪，记录布局效果开始
      }
    }
    if (enableSchedulingProfiler) {
      markLayoutEffectsStarted(lanes) // 如果启用了调度分析器，标记布局效果开始
    }
    commitLayoutEffects(finishedWork, root, lanes) // 执行布局效果
    if (__DEV__) {
      if (enableDebugTracing) {
        logLayoutEffectsStopped() // 在开发模式下，如果启用了调试跟踪，记录布局效果停止
      }
    }

    if (enableSchedulingProfiler) {
      markLayoutEffectsStopped() // 如果启用了调度分析器，标记布局效果停止
    }

    requestPaint() // 请求绘制

    executionContext = prevExecutionContext // 恢复之前的执行上下文

    setCurrentUpdatePriority(previousPriority) // 重置更新优先级为之前的非同步值
    ReactSharedInternals.T = prevTransition // 恢复之前的过渡状态
  } else {
    root.current = finishedWork // 如果没有效果，直接更新当前树为完成的工作
    if (enableProfilerTimer) {
      recordCommitTime() // 如果启用了分析器计时器，记录提交时间
    }
  }

  const rootDidHavePassiveEffects = rootDoesHavePassiveEffects // 保存根节点是否有被动效果的状态

  if (rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = false // 重置根节点有被动效果的标志
    rootWithPendingPassiveEffects = root // 设置有待处理被动效果的根节点
    pendingPassiveEffectsLanes = lanes // 设置待处理被动效果的优先级通道
  } else {
    releaseRootPooledCache(root, remainingLanes) // 如果没有被动效果，立即释放根节点的缓存池
    if (__DEV__) {
      nestedPassiveUpdateCount = 0 // 在开发模式下，重置嵌套被动更新计数
      rootWithPassiveNestedUpdates = null // 在开发模式下，重置有被动嵌套更新的根节点
    }
  }

  remainingLanes = root.pendingLanes // 重新读取剩余的优先级通道，因为效果可能已经更新了它

  if (remainingLanes === NoLanes) {
    legacyErrorBoundariesThatAlreadyFailed = null // 如果没有剩余工作，清除已经失败的错误边界集合
  }

  if (__DEV__) {
    // 如果是开发环境
    if (!rootDidHavePassiveEffects) {
      // 如果根节点没有被动效果
      commitDoubleInvokeEffectsInDEV(root, false) // 在开发环境中执行双重调用效果
    }
  }

  onCommitRootDevTools(finishedWork.stateNode, renderPriorityLevel) // 调用开发工具的提交根节点方法

  if (enableUpdaterTracking) {
    // 如果启用了更新器跟踪
    if (isDevToolsPresent) {
      // 如果开发工具存在
      root.memoizedUpdaters.clear() // 清除根节点的记忆更新器
    }
  }

  if (__DEV__) {
    // 如果是开发环境
    onCommitRootTestSelector() // 调用提交根节点测试选择器方法
  }

  ensureRootIsScheduled(root) // 确保根节点被调度，以处理任何额外的工作

  if (recoverableErrors !== null) {
    // 如果存在可恢复的错误
    const onRecoverableError = root.onRecoverableError // 获取根节点的可恢复错误处理函数
    for (let i = 0; i < recoverableErrors.length; i++) {
      // 遍历所有可恢复的错误
      const recoverableError = recoverableErrors[i] // 获取当前可恢复错误
      const errorInfo = makeErrorInfo(recoverableError.stack) // 创建错误信息对象
      if (__DEV__) {
        // 如果是开发环境
        runWithFiberInDEV(
          // 在开发环境中运行Fiber
          recoverableError.source,
          onRecoverableError,
          recoverableError.value,
          errorInfo
        )
      } else {
        // 如果是生产环境
        onRecoverableError(recoverableError.value, errorInfo) // 直接调用可恢复错误处理函数
      }
    }
  }

  if (
    includesSyncLane(pendingPassiveEffectsLanes) && // 如果待处理的被动效果包含同步优先级
    (disableLegacyMode || root.tag !== LegacyRoot) // 且禁用了遗留模式或根节点不是遗留根
  ) {
    flushPassiveEffects() // 立即刷新被动效果
  }

  remainingLanes = root.pendingLanes // 重新读取剩余的优先级通道

  if (
    (enableInfiniteRenderLoopDetection && // 如果启用了无限渲染循环检测
      (didIncludeRenderPhaseUpdate || didIncludeCommitPhaseUpdate)) || // 且包含了渲染阶段或提交阶段的更新
    (includesSomeLane(lanes, UpdateLanes) && // 或者完成的渲染是更新的结果（非hydration）
      includesSomeLane(remainingLanes, SyncUpdateLanes)) // 且调度了同步更新
  ) {
    if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
      // 如果启用了分析器计时器和嵌套更新阶段
      markNestedUpdateScheduled() // 标记嵌套更新已调度
    }

    if (root === rootWithNestedUpdates) {
      // 如果当前根节点是有嵌套更新的根节点
      nestedUpdateCount++ // 增加嵌套更新计数
    } else {
      nestedUpdateCount = 0 // 重置嵌套更新计数
      rootWithNestedUpdates = root // 更新有嵌套更新的根节点
    }
  } else {
    nestedUpdateCount = 0 // 重置嵌套更新计数
  }

  flushSyncWorkOnAllRoots() // 刷新所有根节点的同步工作

  if (__DEV__) {
    // 如果是开发环境
    if (enableDebugTracing) {
      // 如果启用了调试跟踪
      logCommitStopped() // 记录提交停止日志
    }
  }

  if (enableSchedulingProfiler) {
    // 如果启用了调度分析器
    markCommitStopped() // 标记提交停止
  }

  if (enableTransitionTracing) {
    // 如果启用了过渡跟踪
    const prevRootTransitionCallbacks = root.transitionCallbacks // 获取根节点之前的过渡回调
    if (prevRootTransitionCallbacks !== null) {
      // 如果存在之前的过渡回调
      schedulePostPaintCallback((endTime) => {
        // 调度一个绘制后的回调
        const prevPendingTransitionCallbacks = currentPendingTransitionCallbacks // 获取当前待处理的过渡回调
        if (prevPendingTransitionCallbacks !== null) {
          // 如果存在待处理的过渡回调
          currentPendingTransitionCallbacks = null // 清空当前待处理的过渡回调
          scheduleCallback(IdleSchedulerPriority, () => {
            // 调度一个空闲优先级的回调
            processTransitionCallbacks(
              // 处理过渡回调
              prevPendingTransitionCallbacks,
              endTime,
              prevRootTransitionCallbacks
            )
          })
        } else {
          currentEndTime = endTime // 更新当前结束时间
        }
      })
    }
  }

  return null // 返回null，表示提交完成
}
```

:::

`React` 的 `commit` 阶段是渲染过程的最后一个阶段，主要负责将变更应用到 DOM 上。根据提供的代码和模板，我们可以总结 commit 阶段的主要工作如下：

1. 准备工作：

   - 清除回调节点和优先级
   - 合并完成的工作优先级通道
   - 标记根节点完成

2. 执行三个子阶段：
   - Before Mutation 阶段 (`commitBeforeMutationEffects`)
   - Mutation 阶段 (`commitMutationEffects`)
   - Layout 阶段 (`commitLayoutEffects`)

3. 处理副作用：

   - 如果有被动效果，调度一个回调来刷新它们

4. 清理和重置：

   - 重置工作进度相关的变量
   - 处理错误边界
   - 调用开发工具的钩子

5. 确保根节点被调度，以处理任何额外的工作

   - 主要函数说明：

     1. `commitRoot`: 提交阶段的入口函数，它会调用 `commitRootImpl` 来执行具体的提交工作。

     2. `commitRootImpl`: 实际执行提交工作的函数，包含了上述的主要步骤。

     3. `commitBeforeMutationEffects`: 执行 DOM 变更前的操作，如调用 `getSnapshotBeforeUpdate` 生命周期方法。

     4. `commitMutationEffects`: 执行 DOM 变更，如插入、更新、删除 DOM 节点。

     5. `commitLayoutEffects`: 执行 DOM 变更后的操作，如调用 `componentDidMount` 和 `componentDidUpdate` 生命周期方法。

6. commit 阶段的主要特点：

   1. 同步执行：

      - `commit` 阶段是同步执行的，这确保了 DOM 更新的一致性和可预测性。

   2. 处理副作用：

      - 在这个阶段，React 会处理各种副作用，如 DOM 更新、生命周期方法调用等。

   3. 性能优化：

      - 通过智能地处理副作用和更新，React 尽量减少不必要的操作，提高性能。

   4. 错误处理：

      - `commit` 阶段包含了错误处理机制，以捕获和处理在更新过程中可能出现的错误。

   5. 开发工具支持：
      - `commit` 阶段包含了对开发工具的支持，如性能分析和调试功能。

总的来说，commit 阶段是 React 渲染过程的最后一步，它负责将虚拟 DOM 的变化实际应用到浏览器的 DOM 上，同时处理各种副作用和生命周期方法。这个阶段的高效执行对 React 应用的性能和用户体验至关重要。

### 2、commitBeforeMutationEffects

```js
export function commitBeforeMutationEffects(
  root: FiberRoot,  // 根 Fiber 节点
  firstChild: Fiber,  // 第一个子 Fiber 节点
): boolean {
  focusedInstanceHandle = prepareForCommit(root.containerInfo);  // 准备提交，获取聚焦的实例句柄
      if (deletions !== null) {  // 如果有需要删除的子节点
  nextEffect = firstChild;  // 设置下一个要处理的 effect
  commitBeforeMutationEffects_begin();  // 开始执行 mutation 之前的 effects
          commitBeforeMutationEffectsDeletion(deletion);  // 执行删除前的 mutation effects
  // We no longer need to track the active instance fiber
  const shouldFire = shouldFireAfterActiveInstanceBlur;  // 获取是否应该触发失焦事件
  shouldFireAfterActiveInstanceBlur = false;  // 重置失焦触发标志
  focusedInstanceHandle = null;  // 清空聚焦的实例句柄
    const child = fiber.child;  // 获取 fiber 的第一个子节点
  return shouldFire;  // 返回是否应该触发失焦事件
}
```

:::details commitBeforeMutationEffects_begin

1. 遍历 Fiber 树：
   函数通过 while 循环遍历 Fiber 树中的每个节点，从 `nextEffect` 开始。

2. 处理需要删除的节点：
   如果启用了创建事件处理 API（enableCreateEventHandleAPI），函数会遍历当前 Fiber 节点的 `deletions` 数组，对每个需要删除的子节点调用 `commitBeforeMutationEffectsDeletion`。

3. 递归处理子树：
   如果当前 Fiber 节点的子树有 BeforeMutation 标志（BeforeMutationMask），且存在子节点，函数会将 `nextEffect` 设置为子节点，并继续遍历。

4. 完成处理：
   如果当前节点没有子节点或子树不需要处理 BeforeMutation 效果，函数会调用 `commitBeforeMutationEffects_complete` 来完成处理。

总的来说，`commitBeforeMutationEffects_begin` 函数是 React 提交阶段的一个重要部分，它负责在 DOM 变更之前遍历 Fiber 树，处理需要删除的节点，并为接下来的变更做准备。这个函数确保了在实际 DOM 操作之前，所有必要的清理和准备工作都已完成。

```js
function commitBeforeMutationEffects_begin() {
  while (nextEffect !== null) {
    // 当还有 effect 需要处理时
    const fiber = nextEffect // 获取当前要处理的 fiber

    if (enableCreateEventHandleAPI) {
      // 如果启用了创建事件处理 API
      const deletions = fiber.deletions // 获取需要删除的子节点
      if (deletions !== null) {
        // 如果有需要删除的子节点
        for (let i = 0; i < deletions.length; i++) {
          // 遍历需要删除的子节点
          const deletion = deletions[i] // 获取当前需要删除的子节点
          commitBeforeMutationEffectsDeletion(deletion) // 执行删除前的 mutation effects
        }
      }
    }

    const child = fiber.child // 获取 fiber 的第一个子节点
    if (
      (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags && // 如果 fiber 的子树有 BeforeMutation 标志
      child !== null // 且子节点不为空
    ) {
      child.return = fiber // 设置子节点的返回指针
      nextEffect = child // 将下一个要处理的 effect 设置为子节点
    } else {
      commitBeforeMutationEffects_complete() // 完成 BeforeMutation effects 的处理
    }
  }
}
```

:::

`commitBeforeMutationEffects` 函数在 commit 阶段的主要作用：

1. 准备提交阶段：

   - 调用 `prepareForCommit` 获取当前聚焦的实例句柄。
   - 设置 `nextEffect` 为第一个子 Fiber 节点。

2. 执行 BeforeMutation 效果：

   - 调用 `commitBeforeMutationEffects_begin` 开始处理 BeforeMutation 效果。
   - 遍历 Fiber 树，处理每个节点的 BeforeMutation 效果。
   - 处理需要删除的节点的 BeforeMutation 效果。

3. 清理和重置：

   - 获取是否应该触发失焦事件的标志。
   - 重置失焦触发标志。
   - 清空聚焦的实例句柄。

4. 返回是否应该触发失焦事件的标志

这个函数在 DOM 更新之前执行必要的准备工作和副作用。它是 React 提交阶段的重要部分，确保在实际 DOM 操作之前完成所有必要的准备工作。

### 3、commitMutationEffects

```js
export function commitMutationEffects(
  root: FiberRoot, // 根 Fiber
  finishedWork: Fiber, // 完成的工作单元
  committedLanes: Lanes // 已提交的车道
) {
  inProgressLanes = committedLanes // 设置进行中的车道
  inProgressRoot = root // 设置进行中的根

  if (__DEV__) {
    // 如果是开发环境
    runWithFiberInDEV(
      // 在开发环境中运行 Fiber
      finishedWork,
      commitMutationEffectsOnFiber,
      finishedWork,
      root,
      committedLanes
    )
  } else {
    // 如果是生产环境
    commitMutationEffectsOnFiber(finishedWork, root, committedLanes) // 直接提交变更效果
  }

  inProgressLanes = null // 重置进行中的车道
  inProgressRoot = null // 重置进行中的根
}
```

:::details commitMutationEffectsOnFiber

1. 根据 Fiber 节点的类型（tag）执行不同的变更操作：
   函数通过 switch 语句根据 Fiber 节点的 tag 来处理不同类型的组件，如函数组件、类组件、宿主组件等。

2. 递归遍历子节点的变更效果：
   对于大多数组件类型，函数会调用 `recursivelyTraverseMutationEffects` 来递归处理子节点的变更效果。

3. 提交协调效果：
   通过调用 `commitReconciliationEffects` 来处理协调过程中产生的效果。

4. 处理更新标志：

   - 对于函数组件，它会卸载和挂载 Hook 效果列表。
   - 对于需要性能分析的组件，它会处理布局效果并记录持续时间。

5. 处理 ref 更新：
   对于有 Ref 标志的组件，函数会安全地分离旧的 ref 并附加新的 ref。

6. 处理特定类型节点的变更：

   - 对于文本节点，更新其文本内容。
   - 对于宿主组件，处理 DOM 属性的更新。

7. 错误处理和性能分析：
   函数使用 try-catch 块来捕获可能发生的错误，并使用 `captureCommitPhaseError` 来处理这些错误。对于需要性能分析的组件，它会使用相应的计时函数。

总的来说，`commitMutationEffectsOnFiber` 确保了 React 组件树的正确更新和副作用的执行，是 React 更新过程中的关键步骤。

```js
function commitMutationEffectsOnFiber(
  finishedWork: Fiber, // 完成工作的 Fiber 节点
  root: FiberRoot, // Fiber 树的根节点
  lanes: Lanes // 优先级相关的车道
) {
  const current = finishedWork.alternate // 获取当前 Fiber 节点的备用节点（用于比较更新）
  const flags = finishedWork.flags // 获取 Fiber 节点的副作用标志

  switch (
    finishedWork.tag // 根据 Fiber 节点的类型进行不同的处理
  ) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      // 函数组件、ForwardRef、Memo 组件的处理
      recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历子节点的变更效果
      commitReconciliationEffects(finishedWork) // 提交协调效果

      if (flags & Update) {
        // 如果有更新标志
        try {
          commitHookEffectListUnmount(
            // 卸载 Hook 效果列表
            HookInsertion | HookHasEffect,
            finishedWork,
            finishedWork.return
          )
          commitHookEffectListMount(
            // 挂载 Hook 效果列表
            HookInsertion | HookHasEffect,
            finishedWork
          )
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段的错误
        }
        if (shouldProfile(finishedWork)) {
          // 如果需要性能分析
          try {
            startLayoutEffectTimer() // 开始布局效果计时
            commitHookEffectListUnmount(
              // 卸载布局 Hook 效果列表
              HookLayout | HookHasEffect,
              finishedWork,
              finishedWork.return
            )
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段的错误
          }
          recordLayoutEffectDuration(finishedWork) // 记录布局效果持续时间
        } else {
          try {
            commitHookEffectListUnmount(
              // 卸载布局 Hook 效果列表
              HookLayout | HookHasEffect,
              finishedWork,
              finishedWork.return
            )
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段的错误
          }
        }
      }
      return
    }
    case ClassComponent: {
      // 类组件的处理
      recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历子节点的变更效果
      commitReconciliationEffects(finishedWork) // 提交协调效果

      if (flags & Ref) {
        // 如果有 Ref 标志
        if (current !== null) {
          safelyDetachRef(current, current.return) // 安全地分离引用
        }
      }

      if (flags & Callback && offscreenSubtreeIsHidden) {
        // 如果有回调标志且离屏子树被隐藏
        const updateQueue: UpdateQueue<mixed> | null = (finishedWork.updateQueue: any)
        if (updateQueue !== null) {
          deferHiddenCallbacks(updateQueue) // 延迟隐藏的回调
        }
      }
      return
    }
    case HostHoistable: {
      // 可提升的宿主组件的处理
      if (supportsResources) {
        // 如果支持资源
        const hoistableRoot: HoistableRoot = (currentHoistableRoot: any) // 获取当前可提升的根
        recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历子节点的变更效果
        commitReconciliationEffects(finishedWork) // 提交协调效果

        if (flags & Ref) {
          // 如果有 Ref 标志
          if (current !== null) {
            safelyDetachRef(current, current.return) // 安全地分离引用
          }
        }

        if (flags & Update) {
          // 如果有更新标志
          const currentResource = current !== null ? current.memoizedState : null // 获取当前资源
          const newResource = finishedWork.memoizedState // 获取新资源
          if (current === null) {
            // 如果是新挂载
            if (newResource === null) {
              // 如果是可提升实例
              if (finishedWork.stateNode === null) {
                finishedWork.stateNode = hydrateHoistable(
                  // 水合可提升组件
                  hoistableRoot,
                  finishedWork.type,
                  finishedWork.memoizedProps,
                  finishedWork
                )
              } else {
                mountHoistable(
                  // 挂载可提升组件
                  hoistableRoot,
                  finishedWork.type,
                  finishedWork.stateNode
                )
              }
            } else {
              // 如果是可提升资源
              finishedWork.stateNode = acquireResource(
                // 获取资源
                hoistableRoot,
                newResource,
                finishedWork.memoizedProps
              )
            }
          } else if (currentResource !== newResource) {
            // 如果资源发生变化
            // We are moving to or from Hoistable Resource, or between different Hoistable Resources
            if (currentResource === null) {
              // 如果之前没有资源
              if (current.stateNode !== null) {
                unmountHoistable(current.stateNode) // 卸载可提升组件
              }
            } else {
              releaseResource(currentResource) // 释放当前资源
            }
            if (newResource === null) {
              // 如果新的没有资源
              mountHoistable(
                // 挂载可提升组件
                hoistableRoot,
                finishedWork.type,
                finishedWork.stateNode
              )
            } else {
              acquireResource(
                // 获取新资源
                hoistableRoot,
                newResource,
                finishedWork.memoizedProps
              )
            }
          } else if (newResource === null && finishedWork.stateNode !== null) {
            // 如果没有资源但有状态节点
            try {
              commitUpdate(
                // 提交更新
                finishedWork.stateNode,
                finishedWork.type,
                current.memoizedProps,
                finishedWork.memoizedProps,
                finishedWork
              )
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段的错误
            }
          }
        }
        return
      }
    }
    case HostSingleton: {
      // 宿主单例组件的处理
      if (supportsSingletons) {
        // 如果支持单例
        if (flags & Update) {
          // 如果有更新标志
          const previousWork = finishedWork.alternate
          if (previousWork === null) {
            // 如果是新挂载
            const singleton = finishedWork.stateNode
            const props = finishedWork.memoizedProps
            clearSingleton(singleton) // 清除单例
            acquireSingletonInstance(
              // 获取单例实例
              finishedWork.type,
              props,
              singleton,
              finishedWork
            )
          }
        }
      }
    }
    case HostComponent: {
      // 处理宿主组件
      recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
      commitReconciliationEffects(finishedWork) // 提交协调效果

      if (flags & Ref) {
        // 如果有 Ref 标志
        if (current !== null) {
          // 如果当前 fiber 不为空
          safelyDetachRef(current, current.return) // 安全地分离引用
        }
      }
      if (supportsMutation) {
        // 如果支持变更
        if (finishedWork.flags & ContentReset) {
          // 如果有 ContentReset 标志
          const instance: Instance = finishedWork.stateNode // 获取实例
          try {
            resetTextContent(instance) // 重置文本内容
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段错误
          }
        }

        if (flags & Update) {
          // 如果有 Update 标志
          const instance: Instance = finishedWork.stateNode // 获取实例
          if (instance != null) {
            // 如果实例不为空
            const newProps = finishedWork.memoizedProps // 获取新的属性
            const oldProps = current !== null ? current.memoizedProps : newProps // 获取旧的属性
            const type = finishedWork.type // 获取组件类型
            try {
              commitUpdate(instance, type, oldProps, newProps, finishedWork) // 提交更新
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段错误
            }
          }
        }

        if (flags & FormReset) {
          // 如果有 FormReset 标志
          needsFormReset = true // 设置需要重置表单
          if (__DEV__) {
            // 如果是开发环境
            if (finishedWork.type !== 'form') {
              // 如果不是 form 类型
              console.error(
                'Unexpected host component type. Expected a form. This is a ' + 'bug in React.'
              ) // 输出错误信息
            }
          }
        }
      }
      return
    }
    case HostText: {
      // 处理宿主文本
      recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
      commitReconciliationEffects(finishedWork) // 提交协调效果

      if (flags & Update) {
        // 如果有 Update 标志
        if (supportsMutation) {
          // 如果支持变更
          if (finishedWork.stateNode === null) {
            // 如果状态节点为空
            throw new Error(
              'This should have a text node initialized. This error is likely ' +
                'caused by a bug in React. Please file an issue.'
            ) // 抛出错误
          }

          const textInstance: TextInstance = finishedWork.stateNode // 获取文本实例
          const newText: string = finishedWork.memoizedProps // 获取新的文本
          const oldText: string = current !== null ? current.memoizedProps : newText // 获取旧的文本

          try {
            commitTextUpdate(textInstance, oldText, newText) // 提交文本更新
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段错误
          }
        }
      }
      return
    }
    case HostRoot: {
      // 处理宿主根
      if (supportsResources) {
        // 如果支持资源
        prepareToCommitHoistables() // 准备提交可提升组件

        const previousHoistableRoot = currentHoistableRoot // 保存当前可提升根
        currentHoistableRoot = getHoistableRoot(root.containerInfo) // 获取新的可提升根

        recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
        currentHoistableRoot = previousHoistableRoot // 恢复当前可提升根

        commitReconciliationEffects(finishedWork) // 提交协调效果
      } else {
        recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
        commitReconciliationEffects(finishedWork) // 提交协调效果
      }

      if (flags & Update) {
        // 如果有 Update 标志
        if (supportsMutation && supportsHydration) {
          // 如果支持变更和水合
          if (current !== null) {
            // 如果当前 fiber 不为空
            const prevRootState: RootState = current.memoizedState // 获取之前的根状态
            if (prevRootState.isDehydrated) {
              // 如果之前是脱水状态
              try {
                commitHydratedContainer(root.containerInfo) // 提交水合容器
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段错误
              }
            }
          }
        }
        if (supportsPersistence) {
          // 如果支持持久化
          const containerInfo = root.containerInfo // 获取容器信息
          const pendingChildren = root.pendingChildren // 获取待处理的子节点
          try {
            replaceContainerChildren(containerInfo, pendingChildren) // 替换容器子节点
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段错误
          }
        }
      }

      if (needsFormReset) {
        // 如果需要重置表单
        needsFormReset = false // 重置表单标志
        recursivelyResetForms(finishedWork) // 递归重置表单
      }

      return // 返回
    }
    case HostPortal: {
      // 处理宿主门户
      if (supportsResources) {
        // 如果支持资源
        const previousHoistableRoot = currentHoistableRoot // 保存当前可提升根
        currentHoistableRoot = getHoistableRoot(
          // 获取新的可提升根
          finishedWork.stateNode.containerInfo
        )
        recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
        commitReconciliationEffects(finishedWork) // 提交协调效果
        currentHoistableRoot = previousHoistableRoot // 恢复当前可提升根
      } else {
        recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
        commitReconciliationEffects(finishedWork) // 提交协调效果
      }

      if (flags & Update) {
        // 如果有 Update 标志
        if (supportsPersistence) {
          // 如果支持持久化
          const portal = finishedWork.stateNode // 获取门户状态节点
          const containerInfo = portal.containerInfo // 获取容器信息
          const pendingChildren = portal.pendingChildren // 获取待处理的子节点
          try {
            replaceContainerChildren(containerInfo, pendingChildren) // 替换容器子节点
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段错误
          }
        }
      }
      return // 返回
    }
    case SuspenseComponent: {
      // 处理 Suspense 组件
      recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
      commitReconciliationEffects(finishedWork) // 提交协调效果

      const offscreenFiber: Fiber = (finishedWork.child: any) // 获取 Offscreen fiber
      if (offscreenFiber.flags & Visibility) {
        // 如果 Offscreen fiber 有 Visibility 标志
        const isShowingFallback = (finishedWork.memoizedState: SuspenseState | null) !== null // 判断是否显示 fallback
        const wasShowingFallback = // 判断之前是否显示 fallback
          current !== null && (current.memoizedState: SuspenseState | null) !== null

        if (alwaysThrottleRetries) {
          // 如果总是限制重试
          if (isShowingFallback !== wasShowingFallback) {
            // 如果 fallback 显示状态发生变化
            markCommitTimeOfFallback() // 标记 fallback 的提交时间
          }
        } else {
          if (isShowingFallback && !wasShowingFallback) {
            // 如果现在显示 fallback 但之前没有
            markCommitTimeOfFallback() // 标记 fallback 的提交时间
          }
        }
      }

      if (flags & Update) {
        // 如果有 Update 标志
        try {
          commitSuspenseCallback(finishedWork) // 提交 Suspense 回调
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段错误
        }
        const retryQueue: RetryQueue | null = (finishedWork.updateQueue: any) // 获取重试队列
        if (retryQueue !== null) {
          // 如果重试队列不为空
          finishedWork.updateQueue = null // 清空更新队列
          attachSuspenseRetryListeners(finishedWork, retryQueue) // 附加 Suspense 重试监听器
        }
      }
      return // 返回
    }
    case OffscreenComponent: {
      // 处理 OffscreenComponent 类型
      if (flags & Ref) {
        // 如果有 Ref 标志
        if (current !== null) {
          // 如果当前组件存在
          safelyDetachRef(current, current.return) // 安全地分离引用
        }
      }

      const newState: OffscreenState | null = finishedWork.memoizedState // 获取新的状态
      const isHidden = newState !== null // 判断是否隐藏
      const wasHidden = current !== null && current.memoizedState !== null // 判断之前是否隐藏

      if (disableLegacyMode || finishedWork.mode & ConcurrentMode) {
        // 如果禁用了旧模式或者是并发模式
        // 在提交子组件之前，在栈上跟踪这个 offscreen 子树是否已经被隐藏，以避免再次卸载效果
        const prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden // 保存之前的隐藏状态
        const prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden // 保存之前的隐藏状态
        offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || isHidden // 更新当前隐藏状态
        offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || wasHidden // 更新之前隐藏状态
        recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
        offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden // 恢复之前的隐藏状态
        offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden // 恢复之前的隐藏状态
      } else {
        recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
      }

      commitReconciliationEffects(finishedWork) // 提交协调效果

      const offscreenInstance: OffscreenInstance = finishedWork.stateNode // 获取 Offscreen 实例

      offscreenInstance._current = finishedWork // 设置当前 fiber

      // Offscreen 将可见性的待定更改存储在 `_pendingVisibility` 中。这是为了支持 `attach` 和 `detach` 调用的批处理。
      offscreenInstance._visibility &= ~OffscreenDetached // 清除分离标志
      offscreenInstance._visibility |= offscreenInstance._pendingVisibility & OffscreenDetached // 应用待定的分离标志

      if (flags & Visibility) {
        // 如果有 Visibility 标志
        // 在 Offscreen 实例上跟踪当前状态，以便在事件期间读取
        if (isHidden) {
          // 如果是隐藏状态
          offscreenInstance._visibility &= ~OffscreenVisible // 清除可见标志
        } else {
          offscreenInstance._visibility |= OffscreenVisible // 设置可见标志
        }

        if (isHidden) {
          // 如果是隐藏状态
          const isUpdate = current !== null // 判断是否是更新
          const wasHiddenByAncestorOffscreen = offscreenSubtreeIsHidden || offscreenSubtreeWasHidden // 判断是否被祖先 Offscreen 隐藏
          // 只有在以下情况下才触发消失布局效果：
          //   - 这是一次更新，而不是首次挂载。
          //   - 这个 Offscreen 之前没有被隐藏。
          //   - 祖先 Offscreen 在上一次提交中没有被隐藏。
          if (isUpdate && !wasHidden && !wasHiddenByAncestorOffscreen) {
            // 如果满足触发条件
            if (disableLegacyMode || (finishedWork.mode & ConcurrentMode) !== NoMode) {
              // 使所有子组件的布局效果消失
              recursivelyTraverseDisappearLayoutEffects(finishedWork) // 递归遍历消失布局效果
            }
          }
        } else {
          if (wasHidden) {
            // 如果之前是隐藏的
          }
        }

        // 手动模式的 Offscreen 手动管理可见性。
        if (supportsMutation && !isOffscreenManual(finishedWork)) {
          // 如果支持变更且不是手动 Offscreen
          // TODO: 这需要在隐藏的 Offscreen 树内部有插入或更新时运行。
          hideOrUnhideAllChildren(finishedWork, isHidden) // 隐藏或显示所有子组件
        }
      }

      if (flags & Update) {
        // 如果有 Update 标志
        const offscreenQueue: OffscreenQueue | null = (finishedWork.updateQueue: any) // 获取更新队列
        if (offscreenQueue !== null) {
          // 如果更新队列不为空
          const retryQueue = offscreenQueue.retryQueue // 获取重试队列
          if (retryQueue !== null) {
            // 如果重试队列不为空
            offscreenQueue.retryQueue = null // 清空重试队列
            attachSuspenseRetryListeners(finishedWork, retryQueue) // 附加 Suspense 重试监听器
          }
        }
      }
      return
    }
    case SuspenseListComponent: {
      // 处理 SuspenseListComponent 类型
      recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
      commitReconciliationEffects(finishedWork) // 提交协调效果

      if (flags & Update) {
        // 如果有 Update 标志
        const retryQueue: Set<Wakeable> | null = (finishedWork.updateQueue: any) // 获取重试队列
        if (retryQueue !== null) {
          // 如果重试队列不为空
          finishedWork.updateQueue = null // 清空更新队列
          attachSuspenseRetryListeners(finishedWork, retryQueue) // 附加 Suspense 重试监听器
        }
      }
      return
    }
    case ScopeComponent: {
      // 处理 ScopeComponent 类型
      if (enableScopeAPI) {
        // 如果启用了 Scope API
        recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
        commitReconciliationEffects(finishedWork) // 提交协调效果

        if (flags & Ref) {
          // 如果有 Ref 标志
          if (current !== null) {
            // 如果当前组件存在
            safelyDetachRef(finishedWork, finishedWork.return) // 安全地分离引用
          }
          safelyAttachRef(finishedWork, finishedWork.return) // 安全地附加引用
        }
        if (flags & Update) {
          // 如果有 Update 标志
          const scopeInstance = finishedWork.stateNode // 获取 Scope 实例
          prepareScopeUpdate(scopeInstance, finishedWork) // 准备 Scope 更新
        }
      }
      return
    }
    default: {
      // 处理默认情况
      recursivelyTraverseMutationEffects(root, finishedWork, lanes) // 递归遍历变更效果
      commitReconciliationEffects(finishedWork) // 提交协调效果

      return
    }
  }
}
```

:::

1. 执行 DOM 变更：

   - 这是 commit 阶段最核心的部分，负责将 React 的虚拟 DOM 变更应用到实际的 DOM 上。这包括添加、删除、更新 DOM 节点。

2. 处理副作用：

   - 处理与 DOM 变更相关的副作用，如焦点管理、文本选择等。

3. 调用生命周期方法：

   - 在适当的时机调用组件的某些生命周期方法，如 `componentWillUnmount`。

4. 处理 ref：

   - 更新或清除 ref。

5. 处理特殊组件：

   - 对于一些特殊的组件类型（如 Suspense、Offscreen 等），执行特定的逻辑。

   - 具体来说，函数会遍历 Fiber 树，对每个节点执行以下操作：

     - 对于需要删除的节点，执行删除操作并清理相关的副作用。
     - 对于需要插入或移动的节点，执行相应的 DOM 操作。
     - 对于需要更新的节点，应用新的属性和处理相关的副作用。

这个函数是 React 更新过程中的关键步骤，它确保了 React 的虚拟 DOM 变更能够正确地反映到实际的 DOM 上，同时处理了与这些变更相关的各种副作用和特殊情况。

### 4、commitLayoutEffects

```js
export function commitLayoutEffects(
  finishedWork: Fiber,
  root: FiberRoot,
  committedLanes: Lanes,
): void {
  inProgressLanes = committedLanes;  // 设置进行中的 lanes
  inProgressRoot = root;  // 设置进行中的根
      }
  const current = finishedWork.alternate;  // 获取备用 Fiber
  if (__DEV__) {  // 如果是开发环境
    runWithFiberInDEV(
      finishedWork,
      commitLayoutEffectOnFiber,
      root,
      current,
      finishedWork,
      committedLanes,
    );  // 在开发环境中运行 commitLayoutEffectOnFiber
  } else {
    commitLayoutEffectOnFiber(root, current, finishedWork, committedLanes);  // 提交布局效果
  }
      // TODO (Offscreen) Check: flags & RefStatic  // 待办：检查离屏组件的标志和引用静态标志
  inProgressLanes = null;  // 重置进行中的 lanes
  inProgressRoot = null;  // 重置进行中的根
}
```

:::details commitLayoutEffectOnFiber

1. 递归遍历布局效果：
   对于大多数组件类型，函数首先调用 `recursivelyTraverseLayoutEffects` 来递归遍历子组件的布局效果。

2. 根据组件类型执行特定操作：

   - 函数组件、ForwardRef 和 SimpleMemoComponent：
     执行 Hook 的布局效果（如 useLayoutEffect）。
   - 类组件：
     执行类组件的布局生命周期方法（如 componentDidMount 和 componentDidUpdate）。
   - HostRoot：
     处理更新队列中的回调。
   - HostComponent 和 HostSingleton：
     处理首次挂载时的特殊操作，如自动聚焦。
   - Profiler：
     提交 Profiler 的更新。
   - SuspenseComponent：
     处理 Suspense 的水合回调。
   - OffscreenComponent：
     处理可见性变化和相关效果。

3. 处理 ref：
   对于有 Ref 标志的组件，安全地附加或分离 ref。

4. 错误处理：
   在执行各种操作时，使用 try-catch 块捕获可能发生的错误，并通过 `captureCommitPhaseError` 处理这些错误。

5. 性能分析：
   对于需要性能分析的组件，使用 `startLayoutEffectTimer` 和 `recordLayoutEffectDuration` 来记录布局效果的持续时间。

```js
function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot, // 完成的根Fiber
  current: Fiber | null, // 当前Fiber或null
  finishedWork: Fiber, // 完成的工作Fiber
  committedLanes: Lanes // 提交的lanes
): void {
  const flags = finishedWork.flags // 获取完成工作的标志
  switch (
    finishedWork.tag // 根据完成工作的标签进行switch
  ) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      recursivelyTraverseLayoutEffects(
        // 递归遍历布局效果
        finishedRoot,
        finishedWork,
        committedLanes
      )
      if (flags & Update) {
        // 如果有Update标志
        commitHookLayoutEffects(finishedWork, HookLayout | HookHasEffect) // 提交Hook布局效果
      }
      break
    }
    case ClassComponent: {
      recursivelyTraverseLayoutEffects(
        // 递归遍历布局效果
        finishedRoot,
        finishedWork,
        committedLanes
      )
      if (flags & Update) {
        // 如果有Update标志
        commitClassLayoutLifecycles(finishedWork, current) // 提交类组件布局生命周期
      }

      if (flags & Callback) {
        // 如果有Callback标志
        commitClassCallbacks(finishedWork) // 提交类组件回调
      }

      if (flags & Ref) {
        // 如果有Ref标志
        safelyAttachRef(finishedWork, finishedWork.return) // 安全地附加ref
      }
      break
    }
    case HostRoot: {
      recursivelyTraverseLayoutEffects(
        // 递归遍历布局效果
        finishedRoot,
        finishedWork,
        committedLanes
      )
      if (flags & Callback) {
        // 如果有Callback标志
        const updateQueue: UpdateQueue<mixed> | null = (finishedWork.updateQueue: any) // 获取更新队列
        if (updateQueue !== null) {
          // 如果更新队列不为null
          let instance = null // 初始化实例为null
          if (finishedWork.child !== null) {
            // 如果完成工作有子节点
            switch (
              finishedWork.child.tag // 根据子节点的标签进行switch
            ) {
              case HostSingleton:
              case HostComponent:
                instance = getPublicInstance(finishedWork.child.stateNode) // 获取公共实例
                break
              case ClassComponent:
                instance = finishedWork.child.stateNode // 获取类组件实例
                break
            }
          }
          try {
            commitCallbacks(updateQueue, instance) // 提交回调
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error) // 捕获提交阶段错误
          }
        }
      }
      break
    }
    case HostHoistable: {
      if (supportsResources) {
        // 如果支持资源
        recursivelyTraverseLayoutEffects(
          // 递归遍历布局效果
          finishedRoot,
          finishedWork,
          committedLanes
        )

        if (flags & Ref) {
          // 如果有Ref标志
          safelyAttachRef(finishedWork, finishedWork.return) // 安全地附加ref
        }
        break
      }
    }
    case HostSingleton:
    case HostComponent: {
      recursivelyTraverseLayoutEffects(
        // 递归遍历布局效果
        finishedRoot,
        finishedWork,
        committedLanes
      )

      if (current === null && flags & Update) {
        // 如果是首次挂载且有Update标志
        commitHostComponentMount(finishedWork) // 提交主机组件挂载
      }

      if (flags & Ref) {
        // 如果有Ref标志
        safelyAttachRef(finishedWork, finishedWork.return) // 安全地附加ref
      }
      break
    }
    case Profiler: {
      recursivelyTraverseLayoutEffects(
        // 递归遍历布局效果
        finishedRoot,
        finishedWork,
        committedLanes
      )
      if (flags & Update) {
        // 如果有Update标志
        commitProfilerUpdate(finishedWork, current) // 提交Profiler更新
      }
      break
    }
    case SuspenseComponent: {
      recursivelyTraverseLayoutEffects(
        // 递归遍历布局效果
        finishedRoot,
        finishedWork,
        committedLanes
      )
      if (flags & Update) {
        // 如果有Update标志
        commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) // 提交Suspense水合回调
      }
      break
    }
    case OffscreenComponent: {
      const isModernRoot = disableLegacyMode || (finishedWork.mode & ConcurrentMode) !== NoMode // 判断是否为现代根
      if (isModernRoot) {
        // 如果是现代根
        const isHidden = finishedWork.memoizedState !== null // 判断是否隐藏
        const newOffscreenSubtreeIsHidden = isHidden || offscreenSubtreeIsHidden // 判断新的离屏子树是否隐藏
        if (newOffscreenSubtreeIsHidden) {
          // 如果新的离屏子树隐藏
        } else {
          // 如果新的离屏子树可见
          const wasHidden = current !== null && current.memoizedState !== null // 判断之前是否隐藏
          const newOffscreenSubtreeWasHidden = wasHidden || offscreenSubtreeWasHidden // 判断新的离屏子树之前是否隐藏
          const prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden // 保存之前的离屏子树隐藏状态
          const prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden // 保存之前的离屏子树之前隐藏状态
          offscreenSubtreeIsHidden = newOffscreenSubtreeIsHidden // 更新离屏子树隐藏状态
          offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden // 更新离屏子树之前隐藏状态

          if (offscreenSubtreeWasHidden && !prevOffscreenSubtreeWasHidden) {
            // 如果离屏子树之前隐藏但现在可见
            const includeWorkInProgressEffects =
              (finishedWork.subtreeFlags & LayoutMask) !== NoFlags // 判断是否包含进行中的效果
            recursivelyTraverseReappearLayoutEffects(
              // 递归遍历重新出现的布局效果
              finishedRoot,
              finishedWork,
              includeWorkInProgressEffects
            )
          } else {
            recursivelyTraverseLayoutEffects(
              // 递归遍历布局效果
              finishedRoot,
              finishedWork,
              committedLanes
            )
          }
          offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden // 恢复之前的离屏子树隐藏状态
          offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden // 恢复之前的离屏子树之前隐藏状态
        }
      } else {
        // 如果不是现代根
        recursivelyTraverseLayoutEffects(
          // 递归遍历布局效果
          finishedRoot,
          finishedWork,
          committedLanes
        )
      }
      if (flags & Ref) {
        // 如果有Ref标志
        const props: OffscreenProps = finishedWork.memoizedProps // 获取记忆的props
        if (props.mode === 'manual') {
          // 如果模式为manual
          safelyAttachRef(finishedWork, finishedWork.return) // 安全地附加ref
        } else {
          safelyDetachRef(finishedWork, finishedWork.return) // 安全地分离ref
        }
      }
      break
    }
    default: {
      recursivelyTraverseLayoutEffects(
        // 递归遍历布局效果
        finishedRoot,
        finishedWork,
        committedLanes
      )
      break
    }
  }
}
```

总的来说，`commitLayoutEffectOnFiber` 函数确保了在 DOM 更新后，所有需要在布局阶段执行的副作用都能正确运行，包括生命周期方法、ref 的处理、以及一些特定组件类型的特殊处理。这是 React 更新过程中的关键步骤，确保了组件在视觉上的正确呈现和行为。
:::

1. 设置全局状态：

   - 将当前处理的车道（lanes）和根节点（root）设置为全局变量。

2. 执行布局效果：

   - 调用 `commitLayoutEffectOnFiber` 函数，该函数会递归地遍历 Fiber 树，执行所有标记了布局效果的节点的相应操作。
   - 这包括：
     > a. 调用类组件的 `componentDidMount` 和 `componentDidUpdate` 生命周期方法

   > b. 调用函数组件的 `useLayoutEffect` hook

   > c. 更新 refs

3. 清理全局状态：

   - 在所有布局效果执行完毕后，重置全局变量 `inProgressLanes` 和 `inProgressRoot`。

4. 错误处理：
   - 在开发环境中，使用 `runWithFiberInDEV` 包装执行过程，以便更好地进行错误追踪和调试。

`commitLayoutEffects` 是 React 提交阶段的重要函数之一，负责执行那些需要在 DOM 更新之后立即运行的副作用，如获取 DOM 节点的尺寸等。它确保了在 DOM 更新完成后，所有相关的布局效果都能够正确执行，从而保证了组件的正确渲染和更新。

### 5、flushPassiveEffects

```js
export function flushPassiveEffects(): boolean {
  // 导出函数，用于刷新被动效果，返回布尔值
  // Returns whether passive effects were flushed.
  // TODO: Combine this check with the one in flushPassiveEFfectsImpl. We should
  // probably just combine the two functions. I believe they were only separate
  // in the first place because we used to wrap it with
  // `Scheduler.runWithPriority`, which accepts a function. But now we track the
  // priority within React itself, so we can mutate the variable directly.
  if (rootWithPendingPassiveEffects !== null) {
    // 如果有待处理的被动效果
    // Cache the root since rootWithPendingPassiveEffects is cleared in
    // flushPassiveEffectsImpl
    const root = rootWithPendingPassiveEffects // 缓存根节点
    // Cache and clear the remaining lanes flag; it must be reset since this
    // method can be called from various places, not always from commitRoot
    // where the remaining lanes are known
    const remainingLanes = pendingPassiveEffectsRemainingLanes // 缓存剩余的优先级通道
    pendingPassiveEffectsRemainingLanes = NoLanes // 重置剩余的优先级通道

    const renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes) // 计算渲染优先级
    const priority = lowerEventPriority(DefaultEventPriority, renderPriority) // 降低事件优先级
    const prevTransition = ReactSharedInternals.T // 保存当前过渡状态
    const previousPriority = getCurrentUpdatePriority() // 获取当前更新优先级

    try {
      setCurrentUpdatePriority(priority) // 设置当前更新优先级
      ReactSharedInternals.T = null // 清空过渡状态
      return flushPassiveEffectsImpl() // 执行被动效果刷新的实现
    } finally {
      setCurrentUpdatePriority(previousPriority) // 恢复之前的更新优先级
      ReactSharedInternals.T = prevTransition // 恢复之前的过渡状态

      // Once passive effects have run for the tree - giving components a
      // chance to retain cache instances they use - release the pooled
      // cache at the root (if there is one)
      releaseRootPooledCache(root, remainingLanes) // 释放根节点的池化缓存
    }
  }
  return false // 如果没有待处理的被动效果，返回false
}
```

:::details flushPassiveEffectsImpl

`flushPassiveEffectsImpl` 是 React 内部用于执行被动效果（passive effects）的核心函数。它主要完成以下任务：

1. 准备执行环境：

   - 检查是否有待处理的被动效果（通过 `rootWithPendingPassiveEffects`）。
   - 缓存当前的根节点和相关的优先级通道。
   - 设置执行上下文为提交上下文（CommitContext）。

2. 执行卸载效果：

   - 调用 `commitPassiveUnmountEffects(root.current)`。
   - 这会遍历 fiber 树，执行所有需要卸载的 `useEffect` 清理函数。

3. 执行挂载效果：

   - 调用 `commitPassiveMountEffects(root, root.current, lanes, transitions)`。
   - 这会遍历 fiber 树，执行所有新的 `useEffect` 回调函数。

4. 处理 Profiler 效果：

   - 如果启用了 Profiler，执行与 Profiler 相关的被动效果。

5. 错误处理：

   - 捕获执行过程中可能发生的错误。
   - 如果发生错误，会通过 `captureCommitPhaseError` 进行处理。

6. 清理和重置：

   - 重置各种标志和状态，如 `rootDoesHavePassiveEffects`。
   - 清除 `rootWithPendingPassiveEffects` 和 `pendingPassiveEffectsLanes`。

7. 调度更新：

   - 如果在执行效果过程中产生了新的更新，确保这些更新被正确调度。

8. 性能跟踪：

   - 在开发模式下，记录效果的执行时间和相关性能指标。

9. 处理并发更新：

   - 处理在效果执行过程中可能发生的并发更新。

10. 触发额外的生命周期方法：

    - 在适当的时候触发相关的生命周期方法，如 `componentDidUpdate`。

11. 同步刷新：

    - 在某些情况下，立即刷新同步工作（通过 `flushSyncWorkOnAllRoots`）。

12. 处理过渡（Transitions）：
    - 如果启用了过渡追踪，处理相关的过渡回调。

这个函数的主要目的是确保所有的 `useEffect` 钩子按照正确的顺序执行，同时处理执行过程中可能出现的各种情况（如错误、新的更新等）。它是 React 确保组件生命周期和副作用正确执行的关键部分。

```js
function flushPassiveEffectsImpl() {
  // 实现被动效果刷新的函数
  if (rootWithPendingPassiveEffects === null) {
    // 如果没有待处理的被动效果
    return false // 返回false
  }

  // Cache and clear the transitions flag
  const transitions = pendingPassiveTransitions // 缓存待处理的过渡
  pendingPassiveTransitions = null // 清空待处理的过渡

  const root = rootWithPendingPassiveEffects // 获取有待处理被动效果的根节点
  const lanes = pendingPassiveEffectsLanes // 获取待处理被动效果的优先级通道
  rootWithPendingPassiveEffects = null // 清空有待处理被动效果的根节点
  // TODO: This is sometimes out of sync with rootWithPendingPassiveEffects.
  // Figure out why and fix it. It's not causing any known issues (probably
  // because it's only used for profiling), but it's a refactor hazard.
  pendingPassiveEffectsLanes = NoLanes // 清空待处理被动效果的优先级通道

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // 如果当前在渲染或提交上下文中
    throw new Error('Cannot flush passive effects while already rendering.') // 抛出错误
  }

  if (__DEV__) {
    // 如果是开发环境
    isFlushingPassiveEffects = true // 设置正在刷新被动效果的标志
    didScheduleUpdateDuringPassiveEffects = false // 重置在被动效果期间是否调度了更新的标志

    if (enableDebugTracing) {
      // 如果启用了调试追踪
      logPassiveEffectsStarted(lanes) // 记录被动效果开始的日志
    }
  }

  if (enableSchedulingProfiler) {
    // 如果启用了调度分析器
    markPassiveEffectsStarted(lanes) // 标记被动效果开始
  }

  const prevExecutionContext = executionContext // 保存当前执行上下文
  executionContext |= CommitContext // 设置执行上下文为提交上下文

  commitPassiveUnmountEffects(root.current) // 提交被动卸载效果
  commitPassiveMountEffects(root, root.current, lanes, transitions) // 提交被动挂载效果

  // TODO: Move to commitPassiveMountEffects
  if (enableProfilerTimer && enableProfilerCommitHooks) {
    // 如果启用了分析器计时器和提交钩子
    const profilerEffects = pendingPassiveProfilerEffects // 获取待处理的被动分析器效果
    pendingPassiveProfilerEffects = [] // 清空待处理的被动分析器效果
    for (let i = 0; i < profilerEffects.length; i++) {
      // 遍历待处理的被动分析器效果
      const fiber = ((profilerEffects[i]: any): Fiber) // 获取fiber
      commitPassiveEffectDurations(root, fiber) // 提交被动效果持续时间
    }
  }

  if (__DEV__) {
    // 如果是开发环境
    if (enableDebugTracing) {
      // 如果启用了调试追踪
      logPassiveEffectsStopped() // 记录被动效果停止的日志
    }
  }

  if (enableSchedulingProfiler) {
    // 如果启用了调度分析器
    markPassiveEffectsStopped() // 标记被动效果停止
  }

  if (__DEV__) {
    // 如果是开发环境
    commitDoubleInvokeEffectsInDEV(root, true) // 在开发环境中提交双重调用效果
  }

  executionContext = prevExecutionContext // 恢复之前的执行上下文

  flushSyncWorkOnAllRoots() // 在所有根节点上刷新同步工作

  if (enableTransitionTracing) {
    // 如果启用了过渡追踪
    const prevPendingTransitionCallbacks = currentPendingTransitionCallbacks // 获取当前待处理的过渡回调
    const prevRootTransitionCallbacks = root.transitionCallbacks // 获取根节点的过渡回调
    const prevEndTime = currentEndTime // 获取当前结束时间
    if (
      prevPendingTransitionCallbacks !== null &&
      prevRootTransitionCallbacks !== null &&
      prevEndTime !== null
    ) {
      // 如果存在待处理的过渡回调、根节点过渡回调和结束时间
      currentPendingTransitionCallbacks = null // 清空当前待处理的过渡回调
      currentEndTime = null // 清空当前结束时间
      scheduleCallback(IdleSchedulerPriority, () => {
        // 调度一个空闲优先级的回调
        processTransitionCallbacks(
          // 处理过渡回调
          prevPendingTransitionCallbacks,
          prevEndTime,
          prevRootTransitionCallbacks
        )
      })
    }
  }

  if (__DEV__) {
    // 如果是开发环境
    // If additional passive effects were scheduled, increment a counter. If this
    // exceeds the limit, we'll fire a warning.
    if (didScheduleUpdateDuringPassiveEffects) {
      // 如果在被动效果期间调度了更新
      if (root === rootWithPassiveNestedUpdates) {
        // 如果是同一个根节点
        nestedPassiveUpdateCount++ // 增加嵌套被动更新计数
      } else {
        nestedPassiveUpdateCount = 0 // 重置嵌套被动更新计数
        rootWithPassiveNestedUpdates = root // 更新有嵌套被动更新的根节点
      }
    } else {
      nestedPassiveUpdateCount = 0 // 重置嵌套被动更新计数
    }
    isFlushingPassiveEffects = false // 重置正在刷新被动效果的标志
    didScheduleUpdateDuringPassiveEffects = false // 重置在被动效果期间是否调度了更新的标志
  }

  // TODO: Move to commitPassiveMountEffects
  onPostCommitRootDevTools(root) // 调用提交根节点后的开发工具钩子
  if (enableProfilerTimer && enableProfilerCommitHooks) {
    // 如果启用了分析器计时器和提交钩子
    const stateNode = root.current.stateNode // 获取根节点的状态节点
    stateNode.effectDuration = 0 // 重置效果持续时间
    stateNode.passiveEffectDuration = 0 // 重置被动效果持续时间
  }

  return true // 返回true，表示成功刷新了被动效果
}
```

:::

`flushPassiveEffects` 函数在 React 的更新过程中扮演着重要角色，主要负责处理和执行所有待处理的被动效果（passive effects）。这些被动效果通常来自 `useEffect` 钩子。让我们详细看看 `flushPassiveEffects` 在 React 阶段做了什么：

1. 检查待处理的被动效果：

   - 首先检查是否有待处理的被动效果（通过检查 `rootWithPendingPassiveEffects` 是否为 null）。

2. 准备执行环境：

   - 缓存当前的根节点和相关的优先级通道。
   - 计算并设置适当的渲染优先级。
   - 保存当前的过渡状态和更新优先级。

3. 执行被动效果：

   - 调用 `flushPassiveEffectsImpl` 来实际执行被动效果。这个过程包括：
     a. 执行所有待卸载的被动效果（通常是清理函数）。
     b. 执行所有新的被动效果。

4. 处理 Profiler 相关的被动效果：

   - 如果启用了 Profiler，处理与之相关的被动效果。

5. 错误处理：

   - 在执行过程中捕获可能发生的错误，并适当处理。

6. 调度更新：

   - 如果在执行被动效果过程中产生了新的更新，确保这些更新被正确调度。

7. 清理和重置：

   - 清理相关的标志和状态。
   - 重置优先级和执行上下文。

8. 处理并发更新：

   - 如果在执行被动效果过程中有并发更新，确保这些更新被正确处理。

9. 性能优化：

   - 在开发模式下，进行一些额外的检查和警告，以帮助开发者发现潜在的问题。

10. 触发生命周期方法：

    - 在适当的时候触发相关的生命周期方法，如 `componentDidUpdate`。

11. 同步刷新：

    - 在某些情况下（如同步模式或某些优先级的更新），立即刷新同步工作。

12. 处理过渡（Transitions）：
    - 如果启用了过渡追踪，处理相关的过渡回调。

总的来说，`flushPassiveEffects` 的主要任务是确保所有的被动效果（主要是 `useEffect` 钩子）在适当的时机被执行，同时处理执行过程中可能产生的副作用（如新的更新、错误等）。这个过程是 React 确保组件状态一致性和副作用正确执行的关键部分。
