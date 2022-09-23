const queue: any[] = []

const p = Promise.resolve()
let isFlushPending: boolean = false

export function nextTick(fn) {
	return fn ? p.then(fn) : p
}

export function queueJobs(job) {
	if (!queue.includes(job)) {
		queue.push(job)
	}

	queueFlush()
}

function queueFlush() {
	if (isFlushPending) {
		return
	}
	isFlushPending = true
	// 创建微任务
	nextTick(flushJobs)
}

function flushJobs() {
  // isFlushPending 置为false 重新记录job
	isFlushPending = false
	let job
	while ((job = queue.shift())) {
		job && job()
	}
}
