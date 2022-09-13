import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api/api";
import { OnStep } from "../onstep/onStep";
import { MountControl } from "../onstep/mountControl";
import { toast } from "../utils/toast";
import type { MountStatus } from "../types";

const onError = (e: string) => toast(e, "error");
const networkError = ref(false);
const status = ref<MountStatus | null>(null);
const currentLastError = ref<string | null>(null);

api
  .onNetworkDown(() => {
    networkError.value = true;
  })
  .onNetworkUp(() => {
    networkError.value = false;
  });

const onStep = new OnStep(api, onError).onStatusUpdate((s) => {
  status.value = s;

  const lastError = status.value.lastError;

  if (lastError) {
    // only toast the error if it's new
    if (lastError !== currentLastError.value) {
      onError(lastError);
    }
  }
  currentLastError.value = lastError || null;
});

let control: MountControl | null = null;

export function useOnstep() {
  const router = useRouter();

  if (!control) {
    control = new MountControl(onStep, onError)
      // after a goto, the user probably wants to be back on the control page.
      // we'll push them to the control page after a goto completion.
      .onAfterGoto(() => router.push({ name: "control" }));
  }

  return {
    control,
    lastError: currentLastError,
    status,
    networkError,
    onStep,
  };
}
