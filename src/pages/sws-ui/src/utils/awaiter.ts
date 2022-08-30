export function awaiter(params: {
  test: () => boolean;
  maxSeconds: number;
  onTimeout: (time: number) => void;
}) {
  const { test, maxSeconds, onTimeout } = params;
  let counter = 0;
  const _maxSeconds = maxSeconds ?? 30;

  const waitFor = (
    resolve: (v: boolean) => void,
    reject: (v: number) => void
  ) => {
    if (counter++ > _maxSeconds) {
      onTimeout?.(_maxSeconds);
      reject(_maxSeconds);
      return;
    }

    if (test()) {
      resolve(true);
      return;
    }

    setTimeout(() => waitFor(resolve, reject), 1000);
  };

  return new Promise((resolve, reject) => {
    waitFor(resolve, reject);
  });
}
