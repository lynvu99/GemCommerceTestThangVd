<template>
  <div
    class="w-screen h-screen bg-neutral-950 flex items-center justify-center text-neutral-100"
  >
    <div class="w-96 bg-neutral-800 p-4 rounded-lg">
      <div class="w-full max-w-md space-y-6">
        <!-- Unit Selector -->
        <div class="flex justify-between items-center">
          <label class="text-gray-400 text-sm font-medium block"> Unit </label>
          <div class="flex w-50 rounded-lg p-[2px] common-gray gap-3">
            <button
              @click="handleUnitChange('%')"
              :class="[
                'flex-1 py-2 rounded-md text-lg font-medium transition-colors',
                unit === '%'
                  ? 'selected-unit text-white'
                  : 'text-gray-500 hover:bg-gray-750',
              ]"
            >
              %
            </button>
            <button
              @click="handleUnitChange('px')"
              :class="[
                'flex-1 py-2 rounded-md text-lg font-medium transition-colors',
                unit === 'px'
                  ? 'selected-unit text-white'
                  : 'text-gray-500 hover:bg-gray-750',
              ]"
            >
              px
            </button>
          </div>
        </div>

        <!-- Value Adjuster -->
        <div class="flex justify-between items-center">
          <label class="text-gray-400 text-sm font-medium block"> Value </label>
          <div
            class="common-gray w-50 rounded-lg flex items-center justify-between value-wrapper"
            :class="{ focused: isFocused, 'input-hovered': isInputHovered }"
          >
            <div class="relative">
              <button
                @click="decrement"
                :disabled="isDecrementDisabled"
                @mouseenter="showDecrementTooltip = true"
                @mouseleave="showDecrementTooltip = false"
                :class="[
                  'text-white action-button text-2xl font-light w-12 h-12 rounded-l-lg transition-colors flex items-center justify-center',
                  isDecrementDisabled ? 'opacity-30 cursor-not-allowed' : '',
                ]"
              >
                −
              </button>
              <div
                v-if="
                  showDecrementTooltip && isDecrementDisabled && unit === '%'
                "
                class="tooltip common-gray rounded-lg"
              >
                Value must be greater than 0
              </div>
            </div>
            <input
              v-model="value"
              @input="handleInput"
              @blur="handleBlur"
              @focus="isFocused = true"
              @mouseenter="isInputHovered = true"
              @mouseleave="isInputHovered = false"
              type="text"
              class="bg-transparent text-white text-[12px] font-medium text-center w-24 outline-none"
            />
            <div class="relative">
              <button
                @click="increment"
                :disabled="isIncrementDisabled"
                @mouseenter="showIncrementTooltip = true"
                @mouseleave="showIncrementTooltip = false"
                :class="[
                  'text-white action-button text-2xl font-light w-12 h-12 rounded-r-lg transition-colors flex items-center justify-center',
                  isIncrementDisabled ? 'opacity-30 cursor-not-allowed' : '',
                ]"
              >
                +
              </button>
              <div
                v-if="
                  showIncrementTooltip && isIncrementDisabled && unit === '%'
                "
                class="tooltip common-gray rounded-lg"
              >
                Value must be smaller than 100
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const unit = ref("%");
const value = ref(1.0);
const lastValidValue = ref(1.0);
const isFocused = ref(false);
const isInputHovered = ref(false);
const showDecrementTooltip = ref(false);
const showIncrementTooltip = ref(false);

const isDecrementDisabled = computed(() => value.value <= 0);
const isIncrementDisabled = computed(
  () => unit.value === "%" && value.value >= 100
);

const increment = () => {
  if (isIncrementDisabled.value) return;
  const newValue = Math.round((Number(value.value) + 0.1) * 10) / 10;
  value.value = newValue;
  lastValidValue.value = newValue;
};

const decrement = () => {
  if (isDecrementDisabled.value) return;
  const newValue = Math.round((Number(value.value) - 0.1) * 10) / 10;
  value.value = newValue;
  lastValidValue.value = newValue;
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let inputValue = target.value;

  // Replace comma with dot
  inputValue = inputValue.replace(/,/g, ".");

  value.value = inputValue as any;
};

const handleBlur = () => {
  isFocused.value = false;

  let strValue = String(value.value);

  // Replace comma with dot
  strValue = strValue.replace(/,/g, ".");

  // Remove all non-numeric characters except dots and minus
  let cleaned = strValue.replace(/[^\d.-]/g, "");
  console.log(cleaned, "CLEANED");
  // Handle multiple dots - keep only the first one
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }

  // Parse the value
  let numValue = parseFloat(cleaned);

  // If invalid, revert to last valid value
  if (isNaN(numValue)) {
    value.value = lastValidValue.value;
    return;
  }

  // If less than 0, set to 0
  if (numValue < 0) {
    numValue = 0;
  }

  // If unit is % and value > 100, revert to last valid value
  if (unit.value === "%" && numValue > 100) {
    value.value = lastValidValue.value;
    return;
  }

  // Round to 1 decimal place
  numValue = Math.round(numValue * 10) / 10;
  value.value = numValue;
  lastValidValue.value = numValue;
};

const handleUnitChange = (newUnit: string) => {
  unit.value = newUnit;

  // When switching from px to % and value > 100, set to 100
  if (newUnit === "%" && Number(value.value) > 100) {
    value.value = 100;
    lastValidValue.value = 100;
  }
};
</script>

<style scoped>
.common-gray {
  background-color: #212121;
}
.common-gray-1 {
  background-color: #3b3b3b;
}
.selected-unit {
  background-color: #424242;
}
.action-button:hover:not(:disabled) {
  background-color: #3b3b3b;
}
.value-wrapper {
  border: 1px solid transparent;
  transition: border-color 0.2s, background-color 0.2s;
}
.value-wrapper.focused {
  border-color: #3c67ff;
}
.value-wrapper.input-hovered {
  background-color: #3b3b3b;
}
input[type="number"] {
  -moz-appearance: textfield;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.tooltip {
  position: absolute;
  width: max-content;
  padding: 4px 8px;
  top: -44px;
  left: -98px;
}

.tooltip::after {
  content: "";
  position: absolute;
  bottom: -6px; /* Half the height of the triangle (12px) for positioning */
  left: 50%;
  transform: translateX(-50%) rotate(45deg); /* Center and rotate 45 degrees */
  width: 12px;
  height: 12px;
  background-color: #212121;
}
</style>
