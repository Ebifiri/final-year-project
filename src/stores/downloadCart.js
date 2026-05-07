/**
 * Download Cart — persists resource selections across pages.
 * Users can tick resources from multiple courses and download them all at once.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useDownloadCart = defineStore('downloadCart', () => {
  // { [resourceId]: resourceObject }
  const selected = ref({});

  const items  = computed(() => Object.values(selected.value));
  const count  = computed(() => items.value.length);

  function isSelected(id) {
    return id in selected.value;
  }

  function toggle(resource) {
    if (resource._id in selected.value) {
      const { [resource._id]: _removed, ...rest } = selected.value;
      selected.value = rest;
    } else {
      selected.value = { ...selected.value, [resource._id]: resource };
    }
  }

  function clear() {
    selected.value = {};
  }

  return { items, count, isSelected, toggle, clear };
});
