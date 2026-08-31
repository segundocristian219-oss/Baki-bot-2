import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'workerRouter.js');

const TASK_TIMEOUT = 60000;
const IDLE_TIMEOUT = 30000; // Se destruye rápido si no hay tareas para liberar recursos
const SHUTDOWN_GRACE_MS = 2000;

let workerEntry = null;
const queue = [];

function createWorker() {
    const entry = {
        worker: new Worker(WORKER_PATH),
        busy: false,
        lastUsed: Date.now(),
        currentResolve: null,
        currentReject: null,
        timer: null,
    };

    entry.worker.on('message', (msg) => {
        if (msg && msg.type === '__shutdown_ack__') return;
        if (!entry.busy) return;

        if (msg && msg.success) {
            let result = msg.result;
            if (result && result.isBuffer && result.data) {
                result = { ...result, buffer: Buffer.from(result.data) };
                delete result.data;
                delete result.isBuffer;
            }
            finishTask(entry, true, result, null);
        } else {
            finishTask(entry, false, null, new Error((msg && msg.error) || 'Error desconocido en el worker'));
        }
    });

    entry.worker.on('error', (err) => {
        finishTask(entry, false, null, err);
        destroyWorker();
    });

    entry.worker.on('exit', (code) => {
        if (entry.busy) {
            finishTask(entry, false, null, new Error(`El worker finalizó inesperadamente (código ${code})`));
        }
        destroyWorker();
    });

    return entry;
}

function finishTask(entry, success, result, error) {
    if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
    }
    const resolve = entry.currentResolve;
    const reject = entry.currentReject;
    entry.currentResolve = null;
    entry.currentReject = null;
    entry.busy = false;
    entry.lastUsed = Date.now();

    if (success) {
        resolve?.(result);
    } else {
        reject?.(error);
    }

    processQueue();
}

function destroyWorker() {
    if (workerEntry) {
        if (workerEntry.timer) {
            clearTimeout(workerEntry.timer);
            workerEntry.timer = null;
        }

        let settled = false;
        const finalize = () => {
            if (settled) return;
            settled = true;
            try { workerEntry.worker.removeAllListeners(); } catch (_) {}
            try { workerEntry.worker.terminate(); } catch (_) {}
            workerEntry = null;
        };

        try {
            workerEntry.worker.once('message', (msg) => {
                if (msg && msg.type === '__shutdown_ack__') finalize();
            });
            workerEntry.worker.postMessage({ type: '__shutdown__' });
            setTimeout(finalize, SHUTDOWN_GRACE_MS);
        } catch (_) {
            finalize();
        }
    }
}

function runTask(entry, task, resolve, reject) {
    entry.busy = true;
    entry.lastUsed = Date.now();
    entry.currentResolve = resolve;
    entry.currentReject = reject;

    entry.timer = setTimeout(() => {
        finishTask(entry, false, null, new Error('La tarea superó el tiempo límite (TASK_TIMEOUT)'));
        destroyWorker();
    }, TASK_TIMEOUT);

    try {
        entry.worker.postMessage(task);
    } catch (e) {
        finishTask(entry, false, null, e);
        destroyWorker();
    }
}

function tryAssign(task, resolve, reject) {
    if (!workerEntry) {
        workerEntry = createWorker();
    }

    if (!workerEntry.busy) {
        runTask(workerEntry, task, resolve, reject);
        return true;
    }
    return false;
}

function processQueue() {
    while (queue.length) {
        const item = queue[0];
        if (tryAssign(item.task, item.resolve, item.reject)) {
            queue.shift();
        } else {
            break;
        }
    }
}

setInterval(() => {
    const now = Date.now();
    if (workerEntry && !workerEntry.busy && now - workerEntry.lastUsed > IDLE_TIMEOUT) {
        destroyWorker();
    }
}, 10000);

export function dispatchMediaTask(task) {
    return new Promise((resolve, reject) => {
        if (!tryAssign(task, resolve, reject)) {
            queue.push({ task, resolve, reject });
        }
    });
}

export function getWorkerStats() {
    return {
        active: workerEntry && workerEntry.busy ? 1 : 0,
        idle: workerEntry && !workerEntry.busy ? 1 : 0,
        queued: queue.length,
        total: workerEntry ? 1 : 0,
        maxWorkers: 1,
    };
}
