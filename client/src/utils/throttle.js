// src/utils/throttle.js
// Simple throttle utility that returns a throttled function with a cancel() method.
// wait is in ms. The throttled function will call the original at most once per `wait` ms.
export function throttle(fn, wait = 33) {
  let last = 0;
  let timer = null;

  function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  }

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return throttled;
}
