import { defineStore } from "pinia";
import { ref } from "vue";

export const useScanStore = defineStore("scan", () => {
  const imageDataUrl = ref(null);

  function setImage(dataUrl) {
    imageDataUrl.value = dataUrl;
  }

  function clear() {
    imageDataUrl.value = null;
  }

  return { imageDataUrl, setImage, clear };
});
