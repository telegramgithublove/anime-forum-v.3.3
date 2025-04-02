// workers/worker.js
self.onmessage = (e) => {
    console.log('worker.js: Worker received:', e.data);
    self.postMessage(`Worker processed: ${e.data}`);
  };