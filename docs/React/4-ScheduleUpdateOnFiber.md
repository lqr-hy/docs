# ScheduleUpdateOnFiber

### 1、ensureRootIsScheduled

```javascript
function ensureRootIsScheduled(root: FiberRoot): void {
  // This function is called whenever a root receives an update. It does two
  // things 1) it ensures the root is in the root schedule, and 2) it ensures
  // there's a pending microtask to process the root schedule.
  //
  // Most of the actual scheduling logic does not happen until
  // `scheduleTaskForRootDuringMicrotask` runs.

  // Add the root to the schedule
  if (root === lastScheduledRoot || root.next !== null) {
    // 如果根节点已经在调度列表中
    // Fast path. This root is already scheduled.
  } else {
    // 如果根节点不在调度列表中
    if (lastScheduledRoot === null) {
      // 如果调度列表为空
      firstScheduledRoot = lastScheduledRoot = root // 设置为第一个和最后一个根节点
    } else {
      // 如果调度列表不为空
      lastScheduledRoot.next = root // 将新的根节点添加到列表末尾
      lastScheduledRoot = root // 更新最后一个根节点
    }
  }

  // Any time a root received an update, we set this to true until the next time
  // we process the schedule. If it's false, then we can quickly exit flushSync
  // without consulting the schedule.
  mightHavePendingSyncWork = true // 标记可能有待处理的同步工作

  // At the end of the current event, go through each of the roots and ensure
  // there's a task scheduled for each one at the correct priority.
  if (__DEV__ && ReactSharedInternals.actQueue !== null) {
    // 如果在开发环境且存在act队列
    // We're inside an `act` scope.
    if (!didScheduleMicrotask_act) {
      // 如果还没有为act调度微任务
      didScheduleMicrotask_act = true // 标记已为act调度微任务
      scheduleImmediateTask(processRootScheduleInMicrotask) // 调度立即任务
    }
  } else {
    // 如果不在act作用域内
    if (!didScheduleMicrotask) {
      // 如果还没有调度微任务
      didScheduleMicrotask = true // 标记已调度微任务
      scheduleImmediateTask(processRootScheduleInMicrotask) // 调度立即任务
    }
  }

  if (!enableDeferRootSchedulingToMicrotask) {
    // 如果未启用延迟根调度到微任务
    // While this flag is disabled, we schedule the render task immediately
    // instead of waiting a microtask.
    // TODO: We need to land enableDeferRootSchedulingToMicrotask ASAP to
    // unblock additional features we have planned.
    scheduleTaskForRootDuringMicrotask(root, now()) // 立即调度根节点的任务
  }

  if (
    __DEV__ &&
    !disableLegacyMode &&
    ReactSharedInternals.isBatchingLegacy &&
    root.tag === LegacyRoot
  ) {
    // 如果在开发环境、未禁用遗留模式、正在批处理遗留更新且根节点是遗留根
    // Special `act` case: Record whenever a legacy update is scheduled.
    ReactSharedInternals.didScheduleLegacyUpdate = true // 记录已调度遗留更新
  }
}
```

`ensureRootIsScheduled` 是 React 调度系统中的一个关键函数。它的主要作用是确保根节点（root）被正确地调度以进行更新。
**主要功能：**

1. 添加根节点到调度列表：

   - 如果根节点还没有被添加到调度列表中，它会被添加进去。
   - 这确保了所有需要更新的根节点都会被处理。

2. 标记可能存在待处理的同步工作：

   - 设置 `mightHavePendingSyncWork` 标志，表示可能有待处理的同步工作。
   - 这个标志用于快速检查是否需要执行同步工作。

3. 调度微任务：

   - 如果还没有调度微任务，它会调度一个微任务来处理根节点的调度。
   - 这个微任务会在当前事件循环的末尾执行，确保所有的状态更新都被收集和处理。

4. 处理 act 测试环境：

   - 在开发环境中，如果在 `act` 测试工具的作用域内，会特殊处理微任务的调度。

5. 立即调度任务（在某些情况下）：

   - 如果没有启用延迟根调度到微任务的功能，会立即调度根节点的任务。

6. 处理遗留模式：
   - 在开发环境中，如果使用遗留模式并且根节点是遗留根，会记录已调度遗留更新。

这个函数的主要目的是确保每当根节点接收到更新时，它都被正确地添加到调度队列中，并且安排了适当的任务来处理这些更新。它是 React 确保所有更新都被正确处理的关键部分。

通过这种方式，React 可以有效地管理多个根节点的更新，优化更新的处理顺序，并确保在适当的时机执行更新，从而提高应用的性能和响应性。

### 2、scheduleTaskForRootDuringMicrotask

```javascript
function scheduleTaskForRootDuringMicrotask(
  root: FiberRoot, // 根节点
  currentTime: number // 当前时间
): Lane {
  // 返回Lane类型
  // This function is always called inside a microtask, or at the very end of a
  // rendering task right before we yield to the main thread. It should never be
  // called synchronously.
  //
  // TODO: Unless enableDeferRootSchedulingToMicrotask is off. We need to land
  // that ASAP to unblock additional features we have planned.
  //
  // This function also never performs React work synchronously; it should
  // only schedule work to be performed later, in a separate task or microtask.

  // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.
  markStarvedLanesAsExpired(root, currentTime) // 标记被饿死的lanes为过期

  // Determine the next lanes to work on, and their priority.
  const workInProgressRoot = getWorkInProgressRoot() // 获取当前正在进行中的根节点
  const workInProgressRootRenderLanes = getWorkInProgressRootRenderLanes() // 获取当前正在进行中的根节点的渲染lanes
  const nextLanes = getNextLanes(
    // 获取下一个要处理的lanes
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  )

  const existingCallbackNode = root.callbackNode // 获取现有的回调节点

  if (
    // Check if there's nothing to work on
    nextLanes === NoLanes || // 如果没有下一个要处理的lanes
    // If this root is currently suspended and waiting for data to resolve, don't
    // schedule a task to render it. We'll either wait for a ping, or wait to
    // receive an update.
    //
    // Suspended render phase
    (root === workInProgressRoot && isWorkLoopSuspendedOnData()) || // 如果根节点正在等待数据
    // Suspended commit phase
    root.cancelPendingCommit !== null // 如果有待取消的提交
  ) {
    // Fast path: There's nothing to work on.
    if (existingCallbackNode !== null) {
      // 如果存在回调节点
      cancelCallback(existingCallbackNode) // 取消现有的回调
    }
    root.callbackNode = null // 清空回调节点
    root.callbackPriority = NoLane // 清空回调优先级
    return NoLane // 返回NoLane
  }

  // Schedule a new callback in the host environment.
  if (includesSyncLane(nextLanes)) {
    // 如果包含同步lane
    // Synchronous work is always flushed at the end of the microtask, so we
    // don't need to schedule an additional task.
    if (existingCallbackNode !== null) {
      // 如果存在回调节点
      cancelCallback(existingCallbackNode) // 取消现有的回调
    }
    root.callbackPriority = SyncLane // 设置回调优先级为SyncLane
    root.callbackNode = null // 清空回调节点
    return SyncLane // 返回SyncLane
  } else {
    // We use the highest priority lane to represent the priority of the callback.
    const existingCallbackPriority = root.callbackPriority // 获取现有的回调优先级
    const newCallbackPriority = getHighestPriorityLane(nextLanes) // 获取最高优先级的lane

    if (
      newCallbackPriority === existingCallbackPriority && // 如果新的回调优先级等于现有的回调优先级
      // Special case related to `act`. If the currently scheduled task is a
      // Scheduler task, rather than an `act` task, cancel it and re-schedule
      // on the `act` queue.
      !(
        __DEV__ &&
        ReactSharedInternals.actQueue !== null &&
        existingCallbackNode !== fakeActCallbackNode
      )
    ) {
      // The priority hasn't changed. We can reuse the existing task.
      return newCallbackPriority // 优先级没有变化，可以复用现有的回调
    } else {
      // Cancel the existing callback. We'll schedule a new one below.
      cancelCallback(existingCallbackNode) // 取消现有的回调
    }

    let schedulerPriorityLevel // 声明调度器优先级
    switch (
      lanesToEventPriority(nextLanes) // 根据lanes转换为事件优先级
    ) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority // 设置为立即优先级
        break
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority // 设置为用户阻塞优先级
        break
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority // 设置为普通优先级
        break
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority // 设置为空闲优先级
        break
      default:
        schedulerPriorityLevel = NormalSchedulerPriority // 默认设置为普通优先级
        break
    }

    const newCallbackNode = scheduleCallback(
      // 调度新的回调
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    )

    root.callbackPriority = newCallbackPriority // 更新根节点的回调优先级
    root.callbackNode = newCallbackNode // 更新根节点的回调节点
    return newCallbackPriority // 返回新的回调优先级
  }
}
```

`scheduleTaskForRootDuringMicrotask` 是 React 调度系统中的一个重要函数，它主要负责为根节点（root）调度任务。这个函数通常在微任务中被调用，用于确定下一个要处理的工作单元并安排相应的回调。让我们详细了解一下这个函数的主要功能：

1. 检查过期的 lanes：

   - 调用 `markStarvedLanesAsExpired` 来标记被"饿死"的 lanes 为过期状态。
   - 这确保了长时间未被处理的更新能够得到及时的处理。

2. 确定下一个要处理的 lanes：

   - 使用 `getNextLanes` 函数来确定下一个需要处理的 lanes。
   - 这个过程会考虑当前正在进行的工作和各个 lane 的优先级。

3. 处理特殊情况：

   - 检查是否有工作要做（nextLanes === NoLanes）。
   - 检查根节点是否处于挂起状态（等待数据加载）。
   - 检查是否有待取消的提交。

4. 取消现有的回调：

   - 如果存在之前调度的回调，但现在没有工作要做，会取消这个回调。

5. 调度新的回调：

   - 根据 nextLanes 的优先级，调度新的回调。
   - 对于同步工作（SyncLane），不需要调度新的回调，因为它会在当前微任务结束时立即执行。
   - 对于其他优先级，使用 `scheduleCallback` 来安排新的回调。

6. 更新根节点的回调信息：

   - 更新根节点的 `callbackNode` 和 `callbackPriority`。

7. 处理优先级：
   - 将 lane 优先级转换为调度器优先级。

这个函数的主要目的是确保根节点的更新被正确地调度，考虑到不同的优先级和特殊情况。它是 React 调度系统的核心部分，负责决定何时以及如何处理更新。

通过这种方式，React 可以有效地管理和优化更新的处理，确保高优先级的更新能够及时得到处理，同时也不会忽视低优先级的更新。这有助于提高应用的性能和响应性，特别是在处理复杂的用户界面和频繁更新时。

### 3、scheduleCallback

```javascript
function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: { delay: number }
): Task {
  // 定义一个调度回调函数的函数，返回一个Task对象
  var currentTime = getCurrentTime() // 获取当前时间

  var startTime // 声明开始时间变量
  if (typeof options === 'object' && options !== null) {
    // 检查是否提供了选项对象
    var delay = options.delay // 获取延迟时间
    if (typeof delay === 'number' && delay > 0) {
      // 如果延迟时间是有效的正数
      startTime = currentTime + delay // 计算开始时间为当前时间加上延迟时间
    } else {
      startTime = currentTime // 否则开始时间就是当前时间
    }
  } else {
    startTime = currentTime // 如果没有提供选项，开始时间就是当前时间
  }

  var timeout // 声明超时变量
  switch (
    priorityLevel // 根据优先级设置超时时间
  ) {
    case ImmediatePriority:
      // Times out immediately
      timeout = -1 // 立即优先级的超时时间为-1
      break
    case UserBlockingPriority:
      // Eventually times out
      timeout = userBlockingPriorityTimeout // 用户阻塞优先级的超时时间
      break
    case IdlePriority:
      // Never times out
      timeout = maxSigned31BitInt // 空闲优先级的超时时间为最大的31位有符号整数
      break
    case LowPriority:
      // Eventually times out
      timeout = lowPriorityTimeout // 低优先级的超时时间
      break
    case NormalPriority:
    default:
      // Eventually times out
      timeout = normalPriorityTimeout // 正常优先级（默认）的超时时间
      break
  }

  var expirationTime = startTime + timeout // 计算过期时间

  var newTask: Task = {
    // 创建新的任务对象
    id: taskIdCounter++, // 分配唯一的任务ID
    callback, // 回调函数
    priorityLevel, // 优先级
    startTime, // 开始时间
    expirationTime, // 过期时间
    sortIndex: -1 // 排序索引，初始为-1
  }
  if (enableProfiling) {
    // 如果启用了性能分析
    newTask.isQueued = false // 设置任务未入队
  }

  if (startTime > currentTime) {
    // 如果开始时间晚于当前时间（延迟任务）
    // This is a delayed task.
    newTask.sortIndex = startTime // 设置排序索引为开始时间
    push(timerQueue, newTask) // 将任务推入定时器队列
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // 如果任务队列为空且新任务是定时器队列的第一个任务
      // All tasks are delayed, and this is the task with the earliest delay.
      if (isHostTimeoutScheduled) {
        // 如果已经调度了主机超时
        // Cancel an existing timeout.
        cancelHostTimeout() // 取消现有的超时
      } else {
        isHostTimeoutScheduled = true // 设置已调度主机超时标志
      }
      // Schedule a timeout.
      requestHostTimeout(handleTimeout, startTime - currentTime) // 请求主机超时，处理延迟任务
    }
  } else {
    // 如果是立即执行的任务
    newTask.sortIndex = expirationTime // 设置排序索引为过期时间
    push(taskQueue, newTask) // 将任务推入任务队列
    if (enableProfiling) {
      // 如果启用了性能分析
      markTaskStart(newTask, currentTime) // 标记任务开始
      newTask.isQueued = true // 设置任务已入队
    }
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      // 如果没有调度主机回调且没有正在执行工作
      isHostCallbackScheduled = true // 设置已调度主机回调标志
      requestHostCallback() // 请求主机回调
    }
  }

  return newTask // 返回新创建的任务对象
}
```

`scheduleCallback` 是 React 调度器（Scheduler）的核心函数之一，它的主要作用是安排和调度任务的执行。
**主要功能：**

1. 优先级管理：

   - 接受一个优先级级别参数，用于确定任务的重要性和紧急程度。
   - 根据优先级设置任务的超时时间。

2. 任务创建：

   - 为传入的回调函数创建一个新的任务对象。
   - 任务对象包含 ID、回调函数、优先级、开始时间、过期时间等信息。

3. 时间计算：

   - 计算任务的开始时间和过期时间。
   - 支持延迟执行，可以指定一个延迟时间。

4. 任务队列管理：

   - 将任务添加到适当的队列中：
     - 如果是延迟任务，添加到计时器队列（timerQueue）。
     - 如果是立即执行的任务，添加到任务队列（taskQueue）。

5. 调度执行：

   - 对于延迟任务，如果它是最早的延迟任务，安排一个主机超时回调。
   - 对于立即执行的任务，请求一个主机回调来开始执行任务。

6. 优化排序：

   - 使用排序索引（sortIndex）来优化任务的排序和检索。

7. 返回任务对象：
   - 返回创建的任务对象，允许调用者后续取消或跟踪任务。

这个函数的主要目的是确保任务能够按照正确的优先级和时间顺序被执行。它是 React 调度系统的核心部分，使得 React 能够智能地管理更新和渲染过程，实现诸如时间切片、并发模式等高级特性。

通过这种方式，React 可以：

- 优化用户交互的响应性
- 平衡不同优先级的任务
- 实现异步渲染
- 支持复杂的更新调度策略

### 4、performWorkUntilDeadline

```javascript
const performWorkUntilDeadline = () => {
  if (isMessageLoopRunning) {
    // 如果消息循环正在运行
    const currentTime = getCurrentTime() // 获取当前时间
    // Keep track of the start time so we can measure how long the main thread
    // has been blocked.
    startTime = currentTime // 设置开始时间

    // If a scheduler task throws, exit the current browser task so the
    // error can be observed.
    //
    // Intentionally not using a try-catch, since that makes some debugging
    // techniques harder. Instead, if `flushWork` errors, then `hasMoreWork` will
    // remain true, and we'll continue the work loop.
    let hasMoreWork = true // 是否有更多工作要做
    try {
      hasMoreWork = flushWork(currentTime) // 执行工作，并更新是否有更多工作
    } finally {
      if (hasMoreWork) {
        // 如果还有更多工作
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        schedulePerformWorkUntilDeadline() // 调度下一次工作
      } else {
        isMessageLoopRunning = false // 设置消息循环不在运行
      }
    }
  }
}
```

`performWorkUntilDeadline` 是 React 调度器（Scheduler）中的一个关键函数，它负责在给定的时间片内执行尽可能多的工作。这个函数是实现时间切片（time slicing）和协作式调度的核心。
**主要功能：**

1. 检查调度状态：

   - 确认消息循环是否正在运行（通过 `isMessageLoopRunning` 标志）。

2. 记录开始时间：

   - 获取当前时间，用于跟踪任务执行的持续时间。

3. 执行工作：

   - 调用 `flushWork` 函数来执行实际的工作。
   - `flushWork` 会处理调度队列中的任务。

4. 检查是否有更多工作：

   - `flushWork` 返回一个布尔值，指示是否还有更多工作要做。

5. 时间管理：

   - 检查是否已经超过了分配的时间片。
   - 如果还有时间，可能会继续执行更多工作。

6. 错误处理：

   - 捕获并处理执行过程中可能出现的错误。

7. 调度下一个时间片：

   - 如果还有更多工作要做，安排下一个时间片。
   - 如果所有工作都完成了，重置消息循环状态。

8. 性能优化：
   - 在开发模式下，可能会包含额外的性能测量代码。
   - 通过智能地管理执行时间，避免长时间阻塞主线程，提高应用的整体性能和响应性。

**主要目的：**

1. 时间切片实现：
   它允许 React 在固定的时间片内执行工作，然后将控制权交还给浏览器，提高应用的响应性。

2. 协作式调度：
   通过检查是否有更多工作并适时让出控制权，实现了与浏览器主线程的协作。

3. 持续性工作处理：
   如果还有未完成的工作，它会安排下一个时间片，确保所有任务最终都得到处理。

4. 错误隔离：
   捕获并处理执行过程中的错误，防止单个任务的失败影响整个应用。

5. 性能优化：
   通过智能地管理执行时间，避免长时间阻塞主线程，提高应用的整体性能和响应性。

6. 适应性调度：
   根据是否还有更多工作来动态调整调度行为。

`performWorkUntilDeadline` 是 React 实现并发模式和时间切片的关键组件。它使得 React 能够在不阻塞用户交互的情况下处理复杂的更新，从而提供更流畅的用户体验。这个函数通常与 `requestIdleCallback` 或 `MessageChannel` 等 API 结合使用，以实现在浏览器空闲时执行任务的功能。

### 5、flushWork

```javascript
function flushWork(initialTime: number) {
  if (enableProfiling) {
    markSchedulerUnsuspended(initialTime) // 如果启用性能分析，标记调度器恢复
  }

  // We'll need a host callback the next time work is scheduled.
  isHostCallbackScheduled = false // 重置主机回调调度标志，为下次工作调度做准备

  if (isHostTimeoutScheduled) {
    // We scheduled a timeout but it's no longer needed. Cancel it.
    isHostTimeoutScheduled = false // 如果之前调度了超时，现在不再需要，取消它
    cancelHostTimeout() // 取消主机超时
  }

  isPerformingWork = true // 标记正在执行工作
  const previousPriorityLevel = currentPriorityLevel // 保存当前优先级级别
  try {
    if (enableProfiling) {
      try {
        return workLoop(initialTime) // 如果启用性能分析，尝试执行工作循环
      } catch (error) {
        if (currentTask !== null) {
          const currentTime = getCurrentTime() // 获取当前时间
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          markTaskErrored(currentTask, currentTime) // 标记任务出错
          // $FlowFixMe[incompatible-use] found when upgrading Flow
          currentTask.isQueued = false // 将当前任务标记为未入队
        }
        throw error // 重新抛出错误
      }
    } else {
      // No catch in prod code path.
      return workLoop(initialTime) // 在生产环境中直接执行工作循环，不捕获错误
    }
  } finally {
    currentTask = null // 清空当前任务
    currentPriorityLevel = previousPriorityLevel // 恢复之前的优先级级别
    isPerformingWork = false // 标记工作执行完毕
    if (enableProfiling) {
      const currentTime = getCurrentTime() // 获取当前时间
      markSchedulerSuspended(currentTime) // 标记调度器暂停
    }
  }
}
```

`flushWork` 是 React 调度器（Scheduler）中的一个重要函数，它负责执行已经调度的工作。
**主要功能：**

1. 重置调度状态：

   - 重置 `isHostCallbackScheduled` 标志，表示当前没有主机回调被调度。
   - 如果之前有超时调度，取消它并重置 `isHostTimeoutScheduled` 标志。

2. 设置执行环境：

   - 设置 `isPerformingWork` 标志为 true，表示正在执行工作。
   - 保存当前的优先级级别，以便在完成后恢复。

3. 执行工作循环：

   - 调用 `workLoop` 函数来实际执行队列中的任务。

4. 错误处理：

   - 在开发模式下，捕获并处理执行过程中可能出现的错误。

5. 性能分析：

   - 如果启用了性能分析，会记录调度器的挂起和恢复状态。

6. 清理工作：
   - 重置 `currentTask` 为 null。
   - 恢复之前保存的优先级级别。
   - 重置 `isPerformingWork` 标志为 false。

**主要目的：**

1. 确保所有调度的任务都得到执行：
   它调用 `workLoop` 来遍历和执行任务队列中的所有任务。

2. 管理调度器的状态：
   它负责设置和重置各种标志，以确保调度器在执行工作时处于正确的状态。

3. 错误处理和性能分析：
   在开发模式下，它提供了错误捕获和性能分析的功能，有助于开发者调试和优化应用。

4. 优先级管理：
   它保存和恢复优先级级别，确保任务在正确的优先级上下文中执行。

5. 同步执行：
   `flushWork` 通常在同步上下文中执行，确保所有待处理的工作都被立即处理。

这个函数是 React 调度系统的核心部分，它确保了 React 能够高效地管理和执行更新，是实现 React 并发模式和时间切片等高级特性的关键组件。

### 6、workLoop

```javascript
function workLoop(initialTime: number) {
  let currentTime = initialTime // 初始化当前时间
  advanceTimers(currentTime) // 推进定时器
  currentTask = peek(taskQueue) // 获取任务队列的顶部任务
  while (currentTask !== null && !(enableSchedulerDebugging && isSchedulerPaused)) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // This currentTask hasn't expired, and we've reached the deadline.
      break // 如果当前任务还未过期，但已达到让出主机的时间，则中断循环
    }
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    const callback = currentTask.callback // 获取当前任务的回调函数
    if (typeof callback === 'function') {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      currentTask.callback = null // 清空当前任务的回调，防止重复执行
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      currentPriorityLevel = currentTask.priorityLevel // 设置当前优先级为任务的优先级
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime // 检查用户回调是否超时
      if (enableProfiling) {
        // $FlowFixMe[incompatible-call] found when upgrading Flow
        markTaskRun(currentTask, currentTime) // 标记任务开始运行
      }
      const continuationCallback = callback(didUserCallbackTimeout) // 执行回调函数 performConcurrentWorkOnRoot
      currentTime = getCurrentTime() // 更新当前时间
      if (typeof continuationCallback === 'function') {
        // If a continuation is returned, immediately yield to the main thread
        // regardless of how much time is left in the current time slice.
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        currentTask.callback = continuationCallback // 如果返回了延续回调，设置为当前任务的新回调
        if (enableProfiling) {
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          markTaskYield(currentTask, currentTime) // 标记任务让出执行权
        }
        advanceTimers(currentTime) // 推进定时器
        return true // 返回true，表示还有工作要做
      } else {
        if (enableProfiling) {
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          markTaskCompleted(currentTask, currentTime) // 标记任务完成
          // $FlowFixMe[incompatible-use] found when upgrading Flow
          currentTask.isQueued = false // 将任务标记为未入队
        }
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue) // 如果当前任务仍在队列顶部，将其移除
        }
        advanceTimers(currentTime) // 推进定时器
      }
    } else {
      pop(taskQueue) // 如果回调不是函数，直接将任务从队列中移除
    }
    currentTask = peek(taskQueue) // 获取下一个任务
  }
  // Return whether there's additional work
  if (currentTask !== null) {
    return true // 如果还有任务，返回true
  } else {
    const firstTimer = peek(timerQueue) // 检查定时器队列
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime) // 请求主机超时
    }
    return false // 没有更多任务，返回false
  }
}
```

`workLoop` 是 React 调度器（Scheduler）中的核心函数，负责执行队列中的任务。它是实现 React 时间切片和优先级调度的关键部分。
**主要功能：**

1. 初始化时间：

   - 使用传入的初始时间来开始工作循环。

2. 推进定时器：

   - 调用 `advanceTimers` 来处理已经到期的定时器任务。

3. 循环处理任务：

   - 从任务队列中获取最高优先级的任务。
   - 循环执行任务，直到队列为空或需要让出控制权。

4. 时间管理：

   - 检查是否已经超过了分配的时间片（通过 `shouldYieldToHost` 函数）。
   - 如果超时，中断循环并让出控制权。

5. 执行任务回调：

   - 调用任务的回调函数。
   - 处理回调函数可能返回的延续（continuation）。

6. 优先级管理：

   - 根据任务的优先级设置当前的优先级级别。

7. 任务完成处理：

   - 标记任务为已完成。
   - 从队列中移除已完成的任务。

8. 性能分析：

   - 在开发模式下，可能包含额外的性能测量代码。

9. 处理新的定时器任务：
   - 在循环结束后，检查是否有新的定时器任务需要处理。

**主要目的：**

1. 任务执行：
   它是实际执行调度任务的地方，确保高优先级的任务得到及时处理。

2. 时间切片实现：
   通过定期检查是否应该让出控制权，实现了时间切片，防止长时间阻塞主线程。

3. 优先级调度：
   根据任务的优先级来决定执行顺序，确保重要的任务先被处理。

4. 连续性保证：
   通过处理任务回调可能返回的延续，确保复杂的任务可以被分割成多个时间片来执行。

5. 动态调整：
   根据当前的时间和任务状态动态调整执行策略。

6. 定时器管理：
   集成了定时器任务的处理，确保延迟任务能够在适当的时候执行。

7. 性能优化：
   通过智能地管理任务执行，提高了 React 应用的整体性能和响应性。

`workLoop` 是 React 并发模式和时间切片的核心实现。它使得 React 能够在不影响用户交互的情况下处理复杂的更新，从而提供更流畅的用户体验。

### 7、performConcurrentWorkOnRoot

```javascript
function performConcurrentWorkOnRoot(root: FiberRoot, didTimeout: boolean): RenderTaskFn | null {
  if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
    resetNestedUpdateFlag() // 重置嵌套更新标志
  }

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Should not already be working.') // 如果已经在工作中，抛出错误
  }

  // Flush any pending passive effects before deciding which lanes to work on,
  // in case they schedule additional work.
  const originalCallbackNode = root.callbackNode // 保存原始回调节点
  const didFlushPassiveEffects = flushPassiveEffects() // 刷新被动效果
  if (didFlushPassiveEffects) {
    // Something in the passive effect phase may have canceled the current task.
    // Check if the task node for this root was changed.
    if (root.callbackNode !== originalCallbackNode) {
      // The current task was canceled. Exit. We don't need to call
      // `ensureRootIsScheduled` because the check above implies either that
      // there's a new task, or that there's no remaining work on this root.
      return null // 如果当前任务被取消，退出函数
    } else {
      // Current task was not canceled. Continue.
    }
  }

  // Determine the next lanes to work on, using the fields stored
  // on the root.
  // TODO: This was already computed in the caller. Pass it as an argument.
  let lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  ) // 获取下一个要处理的lanes
  if (lanes === NoLanes) {
    // Defensive coding. This is never expected to happen.
    return null // 如果没有lanes需要处理，返回null
  }

  // We disable time-slicing in some cases: if the work has been CPU-bound
  // for too long ("expired" work, to prevent starvation), or we're in
  // sync-updates-by-default mode.
  // TODO: We only check `didTimeout` defensively, to account for a Scheduler
  // bug we're still investigating. Once the bug in Scheduler is fixed,
  // we can remove this, since we track expiration ourselves.
  const shouldTimeSlice =
    !includesBlockingLane(root, lanes) &&
    !includesExpiredLane(root, lanes) &&
    (disableSchedulerTimeoutInWorkLoop || !didTimeout) // 判断是否应该进行时间切片
  let exitStatus = shouldTimeSlice ? renderRootConcurrent(root, lanes) : renderRootSync(root, lanes) // 根据是否进行时间切片选择渲染方式

  if (exitStatus !== RootInProgress) {
    let renderWasConcurrent = shouldTimeSlice // 记录渲染是否是并发的
    do {
      if (exitStatus === RootDidNotComplete) {
        // The render unwound without completing the tree. This happens in special
        // cases where need to exit the current render without producing a
        // consistent tree or committing.
        markRootSuspended(root, lanes, NoLane) // 标记根节点为挂起状态
      } else {
        // The render completed.

        // Check if this render may have yielded to a concurrent event, and if so,
        // confirm that any newly rendered stores are consistent.
        // TODO: It's possible that even a concurrent render may never have yielded
        // to the main thread, if it was fast enough, or if it expired. We could
        // skip the consistency check in that case, too.
        const finishedWork: Fiber = (root.current.alternate: any) // 获取完成的工作
        if (renderWasConcurrent && !isRenderConsistentWithExternalStores(finishedWork)) {
          // A store was mutated in an interleaved event. Render again,
          // synchronously, to block further mutations.
          exitStatus = renderRootSync(root, lanes) // 如果渲染不一致，重新同步渲染
          // We assume the tree is now consistent because we didn't yield to any
          // concurrent events.
          renderWasConcurrent = false // 设置渲染为非并发
          // Need to check the exit status again.
          continue // 继续循环
        }

        // Check if something threw
        if (exitStatus === RootErrored) {
          const lanesThatJustErrored = lanes // 记录出错的lanes
          const errorRetryLanes = getLanesToRetrySynchronouslyOnError(root, lanesThatJustErrored) // 获取需要重试的lanes
          if (errorRetryLanes !== NoLanes) {
            lanes = errorRetryLanes // 更新lanes
            exitStatus = recoverFromConcurrentError(root, lanesThatJustErrored, errorRetryLanes) // 尝试从并发错误中恢复
            renderWasConcurrent = false // 设置渲染为非并发
            // Need to check the exit status again.
            if (exitStatus !== RootErrored) {
              // The root did not error this time. Restart the exit algorithm
              // from the beginning.
              // TODO: Refactor the exit algorithm to be less confusing. Maybe
              // more branches + recursion instead of a loop. I think the only
              // thing that causes it to be a loop is the RootDidNotComplete
              // check. If that's true, then we don't need a loop/recursion
              // at all.
              continue // 如果没有错误，继续循环
            } else {
              // The root errored yet again. Proceed to commit the tree.
            }
          }
        }
        if (exitStatus === RootFatalErrored) {
          prepareFreshStack(root, NoLanes) // 准备新的栈
          markRootSuspended(root, lanes, NoLane) // 标记根节点为挂起状态
          break // 跳出循环
        }

        // We now have a consistent tree. The next step is either to commit it,
        // or, if something suspended, wait to commit it after a timeout.
        root.finishedWork = finishedWork // 设置完成的工作
        root.finishedLanes = lanes // 设置完成的lanes
        finishConcurrentRender(root, exitStatus, finishedWork, lanes) // 完成并发渲染
      }
      break // 跳出循环
    } while (true)
  }

  ensureRootIsScheduled(root) // 确保根节点被调度
  return getContinuationForRoot(root, originalCallbackNode) // 获取根节点的延续
}
```

`performConcurrentWorkOnRoot` 是 React 并发模式的核心函数之一，它负责在根节点上执行并发工作。这个函数的主要职责是协调整个 React 树的更新过程。
**主要功能：**

1. 准备工作：

   - 重置性能分析相关的标志（如果启用了性能分析）。
   - 检查执行上下文，确保不在渲染或提交阶段。

2. 刷新被动效果：

   - 调用 `flushPassiveEffects` 来执行所有待处理的副作用（如 `useEffect` 回调）。

3. 确定要处理的工作：

   - 获取下一批需要处理的 lanes（更新通道）。
   - 决定是否需要进行时间切片（基于优先级和超时状态）。

4. 渲染阶段：

   - 调用 `renderRootConcurrent` 或 `renderRootSync` 执行实际的渲染工作。
   - 处理渲染结果（完成、需要让步、错误等）。

5. 提交阶段：

   - 如果渲染完成，调用 `finishConcurrentRender` 进入提交阶段。

6. 错误处理：

   - 处理渲染过程中可能出现的错误，包括尝试恢复。

7. 调度后续工作：

   - 确保根节点被正确调度以处理任何剩余或新的更新。

8. 返回结果：
   - 返回一个回调函数或 null，用于调度器决定是否需要继续工作。

**主要目的：**

1. 并发渲染：
   实现 React 的并发模式，允许渲染工作被中断和恢复。

2. 优先级管理：
   根据不同的优先级处理更新，确保高优先级的更新能够及时响应。

3. 错误处理和恢复：
   处理渲染过程中的错误，并尝试恢复。

4. 时间切片：
   通过时间切片技术，避免长时间阻塞主线程。

5. 协调更新过程：
   管理整个 React 树的更新过程，包括渲染和提交阶段。

6. 性能优化：
   通过智能地管理更新过程，提高应用的整体性能和响应性。

这个函数是 React 并发模式的核心，它使得 React 能够在不影响用户交互的情况下处理复杂的更新，从而提供更流畅的用户体验。

### 8、renderRootSync

```javascript
function renderRootSync(root: FiberRoot, lanes: Lanes) {
  const prevExecutionContext = executionContext // 保存当前的执行上下文
  executionContext |= RenderContext // 将渲染上下文添加到执行上下文中
  const prevDispatcher = pushDispatcher(root.containerInfo) // 推入新的 dispatcher 并保存之前的
  const prevAsyncDispatcher = pushAsyncDispatcher() // 推入新的异步 dispatcher 并保存之前的

  // 如果根节点或车道发生了变化，抛弃现有的堆栈并准备一个新的
  // 否则我们将继续从上次离开的地方开始
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    if (enableUpdaterTracking) {
      // 如果启用了更新器跟踪
      if (isDevToolsPresent) {
        // 如果开发工具存在
        const memoizedUpdaters = root.memoizedUpdaters // 获取根节点的记忆化更新器
        if (memoizedUpdaters.size > 0) {
          // 如果有记忆化的更新器
          restorePendingUpdaters(root, workInProgressRootRenderLanes) // 恢复待处理的更新器
          memoizedUpdaters.clear() // 清空记忆化的更新器
        }

        // 此时，将调度即将进行的工作的 Fiber 从 Map 移动到 Set
        // 如果我们放弃这项工作，我们会将它们移回（如上所述）
        // 现在移动它们很重要，以防工作产生更多具有不同更新器的相同优先级的工作
        // 这样我们可以保持当前更新和未来更新的分离
        movePendingFibersToMemoized(root, lanes) // 将待处理的 fiber 移动到记忆化状态
      }
    }

    workInProgressTransitions = getTransitionsForLanes(root, lanes) // 获取车道的过渡
    prepareFreshStack(root, lanes) // 准备新的堆栈
  }

  if (__DEV__) {
    // 如果在开发模式下
    if (enableDebugTracing) {
      // 如果启用了调试跟踪
      logRenderStarted(lanes) // 记录渲染开始
    }
  }

  if (enableSchedulingProfiler) {
    // 如果启用了调度分析器
    markRenderStarted(lanes) // 标记渲染开始
  }

  let didSuspendInShell = false // 初始化在 shell 中是否挂起的标志
  outer: do {
    try {
      if (
        workInProgressSuspendedReason !== NotSuspended && // 如果工作进度被挂起
        workInProgress !== null // 且当前工作不为空
      ) {
        // 工作循环被挂起。在同步渲染期间，我们不会让步给主线程
        // 立即解开堆栈。这将触发回退或错误边界
        // TODO: 对于离散和"默认"更新（任何不是 flushSync 的更新），
        // 我们希望等待微任务在解开之前刷新。可能会使用 renderRootConcurrent 实现这一点，
        // 或将 renderRootSync 和 renderRootConcurrent 合并到同一个函数中，
        // 然后以其他方式分叉行为。
        const unitOfWork = workInProgress // 获取当前工作单元
        const thrownValue = workInProgressThrownValue // 获取抛出的值
        switch (
          workInProgressSuspendedReason // 根据挂起原因进行处理
        ) {
          case SuspendedOnHydration: {
            // 选择性水合。更新流入了一个脱水的树
            // 中断当前渲染，以便工作循环可以切换到水合车道
            resetWorkInProgressStack() // 重置工作进度堆栈
            workInProgressRootExitStatus = RootDidNotComplete // 设置根节点退出状态为未完成
            break outer // 跳出外层循环
          }
          case SuspendedOnImmediate:
          case SuspendedOnData: {
            if (!didSuspendInShell && getSuspenseHandler() === null) {
              // 如果没有在 shell 中挂起且没有挂起处理程序
              didSuspendInShell = true // 标记在 shell 中挂起
            }
            // 故意 fallthrough
          }
          default: {
            // 解开然后继续正常的工作循环
            workInProgressSuspendedReason = NotSuspended // 重置挂起原因
            workInProgressThrownValue = null // 清空抛出的值
            throwAndUnwindWorkLoop(root, unitOfWork, thrownValue) // 抛出并解开工作循环
            break
          }
        }
      }
      workLoopSync() // 执行同步工作循环
      break // 跳出循环
    } catch (thrownValue) {
      // 捕获抛出的错误
      handleThrow(root, thrownValue) // 处理抛出的错误
    }
  } while (true)

  // 检查是否在 shell 中有东西被挂起。我们用这个来检测由未缓存的 promise 引起的无限 ping 循环
  //
  // 在整个树的一次同步渲染尝试中，这个计数器只增加一次
  // 即使有许多兄弟组件被挂起，这个计数器也只增加一次
  if (didSuspendInShell) {
    // 如果在 shell 中挂起
    root.shellSuspendCounter++ // 增加 shell 挂起计数器
  }

  resetContextDependencies() // 重置上下文依赖

  executionContext = prevExecutionContext // 恢复之前的执行上下文
  popDispatcher(prevDispatcher) // 弹出之前的 dispatcher
  popAsyncDispatcher(prevAsyncDispatcher) // 弹出之前的异步 dispatcher

  if (workInProgress !== null) {
    // 如果工作进度不为空
    // 这是一个同步渲染，所以我们应该已经完成了整个树
    throw new Error(
      'Cannot commit an incomplete root. This error is likely caused by a ' +
        'bug in React. Please file an issue.'
    )
  }

  if (__DEV__) {
    // 如果在开发模式下
    if (enableDebugTracing) {
      // 如果启用了调试跟踪
      logRenderStopped() // 记录渲染停止
    }
  }

  if (enableSchedulingProfiler) {
    // 如果启用了调度分析器
    markRenderStopped() // 标记渲染停止
  }

  // 将这个设置为 null 以表示没有正在进行的渲染
  workInProgressRoot = null // 清空当前工作的根节点
  workInProgressRootRenderLanes = NoLanes // 清空当前渲染的车道

  // 现在渲染阶段完成，可以安全地处理队列
  finishQueueingConcurrentUpdates() // 完成并发更新的排队

  return workInProgressRootExitStatus // 返回根节点的退出状态
}
```

`renderRootSync` 是 React 渲染过程中的一个关键函数，用于同步模式下渲染根节点。它负责协调整个 React 树的更新过程，但与并发模式不同，它会一次性完成整个渲染过程，不会中断。
**`renderRootSync` 的主要功能：**

1. 设置执行上下文：

   - 将 `RenderContext` 添加到执行上下文中。

2. 准备渲染环境：

   - 推入新的 dispatcher 和异步 dispatcher。

3. 准备或继续渲染工作：

   - 如果根节点或车道发生变化，准备新的堆栈。
   - 否则，继续之前的工作。

4. 处理更新器和过渡：

   - 恢复待处理的更新器。
   - 将待处理的 fibers 移动到记忆化状态。
   - 获取车道的过渡。

5. 执行工作循环：

   - 在一个 do-while 循环中执行渲染工作。
   - 处理可能的挂起和错误情况。

6. 完成渲染：

   - 如果渲染成功完成，设置 `workInProgressRootExitStatus` 为 `RootCompleted`。

7. 错误处理：

   - 捕获并处理渲染过程中的错误。

8. 重置状态和清理：

   - 重置各种全局变量和状态。
   - 恢复之前的执行上下文和 dispatcher。

9. 返回渲染结果：
   - 返回 `workInProgressRootExitStatus`，表示渲染的最终状态。

**主要目的：**

1. 同步渲染：
   它一次性完成整个渲染过程，不会中断或让步给其他任务。

2. 状态管理：
   管理和更新 React 的内部状态，如工作进行中的根节点和车道。

3. 错误处理：
   捕获和处理渲染过程中可能出现的错误。

4. 性能跟踪：
   在开发模式下提供性能跟踪和调试信息。

5. 上下文管理：
   正确设置和恢复 React 的执行上下文和调度器。

6. 完整性保证：
   确保渲染过程完全完成，不留下未完成的工作。

这个函数是 React 同步渲染模式的核心，它确保了在某些情况下（如服务器端渲染或某些特定的客户端场景）React 可以快速、一次性地完成整个渲染过程。虽然它不提供并发模式的优势，但在某些场景下仍然是必要和有用的。
