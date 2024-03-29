const queue: any[] = []
const activePrefFlushCbs: any[] = []

const p = Promise.resolve()
let isFlushPending = false

export function nextTick(fn?) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job) {
  if (!queue.includes(job))
    queue.push(job)

  // 执行所有的job
  queueFlush()
}

function queueFlush() {
  // 如果同时触发了两个组件的更新的话
  // 这里就会触发两次 then （微任务逻辑）
  // 但是着是没有必要的
  // 我们只需要触发一次即可处理完所有的 job 调用
  // 所以需要判断一下 如果已经触发过 nextTick 了
  // 那么后面就不需要再次触发一次 nextTick 逻辑了
  if (isFlushPending)
    return

  isFlushPending = true
  // 创建微任务
  nextTick(flushJobs)
}

export function queuePreFlushCb(job) {
  activePrefFlushCbs.push(job)
  queueFlush()
}

function flushJobs() {
  // isFlushPending 置为false 重新记录job
  isFlushPending = false

  flushPreFlushCbs()

  let job

  while ((job = queue.shift()))
    job && job()
}
function flushPreFlushCbs() {
  for (let i = 0; i < activePrefFlushCbs.length; i++)
    activePrefFlushCbs[i]()
}
