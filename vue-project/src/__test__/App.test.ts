import { mount, VueWrapper } from "@vue/test-utils";
import { expect, it, describe, beforeEach, vi } from "vitest";
import App from "../App.vue";

// --- Hàm Helper ---
// Hàm này mô phỏng việc người dùng nhập dữ liệu và sau đó out focus (blur)
const findAndSetValue = async (
  wrapper: VueWrapper<any>,
  selector: string,
  value: string
) => {
  const input = wrapper.find(selector);

  if (!input.exists()) {
    throw new Error(
      `Element with selector "${selector}" not found. DOM: ${wrapper.html()}`
    );
  }

  // 1. Giả lập nhập liệu (cập nhật v-model và gọi @input)
  await input.setValue(value);
  // 2. Giả lập sự kiện blur (gọi @blur)
  await input.trigger("blur");
};
// --- End Helper ---

describe("App.vue Input Validation and Formatting", () => {
  let wrapper: VueWrapper<any>;

  // Selector chính xác cho input
  const inputSelector = 'input[type="text"]';

  // Selector cho buttons
  const minusButtonSelector = ".action-button:first-child";
  const plusButtonSelector = ".action-button:last-child";
  const unitPxButton = "button:last-of-type";
  const unitPercentButton = "button:first-of-type";

  beforeEach(() => {
    // Khởi tạo wrapper trước mỗi test
    wrapper = mount(App, {
      global: {
        // Đảm bảo không có warning về các component không xác định nếu có
        stubs: {
          teleport: true,
        },
      },
    });
    // Đặt giá trị mặc định cho `lastValidValue` để test revert hoạt động
    wrapper.vm.lastValidValue = 50.0;
  });

  // --- 1. Xử lý Định dạng (Format) ---
  describe("Formatting Rules (handleBlur)", () => {
    it("TC 1.1: Should replace comma with dot (12,3 -> 12.3)", async () => {
      await findAndSetValue(wrapper, inputSelector, "12,3");
      // Kiểm tra giá trị đã được cập nhật thành số 12.3
      expect(wrapper.vm.value).toBe(12.3);
    });

    it("TC 1.3: Should remove non-numeric chars (12a3.5 -> 123.5)", async () => {
      await findAndSetValue(wrapper, inputSelector, "50a");
      // Logic sẽ bỏ qua 'a', kết quả là 123.5 (đã được round)
      expect(wrapper.vm.value).toBe(50.0);
    });

    it("TC 1.5: Should handle multiple decimal points (12.4.5 -> 12.5)", async () => {
      await findAndSetValue(wrapper, inputSelector, "12.4.5");
      expect(wrapper.vm.value).toBe(12.5);
    });

    it('TC 1.6: Should revert to lastValidValue if input becomes NaN (e.g., "a" -> 50.0)', async () => {
      // Giá trị ban đầu là 50.0
      await findAndSetValue(wrapper, inputSelector, "abc");
      // Logic: Nếu isNaN(numValue) => revert to lastValidValue
      expect(wrapper.vm.value).toBe(50.0);
    });
  });

  // --- 2. Xử lý Giới hạn Giá trị (Bounds) ---
  describe("Boundary Rules (handleBlur)", () => {
    it("TC 2.1: Should reset negative value to 0", async () => {
      await findAndSetValue(wrapper, inputSelector, "-50");
      // Logic: if (numValue < 0) => numValue = 0
      expect(wrapper.vm.value).toBe(0);
    });

    it("TC 2.3: Should revert to lastValidValue if value > 100 and unit is % (150 -> 50)", async () => {
      wrapper.vm.unit = "%";
      wrapper.vm.lastValidValue = 50.0; // Đặt giá trị hợp lệ trước đó

      await findAndSetValue(wrapper, inputSelector, "150");
      // Logic: if (unit.value === "%" && numValue > 100) => revert to lastValidValue
      expect(wrapper.vm.value).toBe(50.0);
    });

    it("TC 2.4: Should allow value > 100 when unit is px (150 -> 150)", async () => {
      wrapper.vm.unit = "px";

      await findAndSetValue(wrapper, inputSelector, "150");
      // Logic: Không có giới hạn cho px
      expect(wrapper.vm.value).toBe(150.0);
    });
  });

  // --- 3. Logic Vô hiệu hóa Button (computed properties) ---
  describe("Button Disabling Logic", () => {
    it("TC 3.1: Should disable minus button when value is 0 (isDecrementDisabled)", async () => {
      wrapper.vm.value = 0;
      await wrapper.vm.$nextTick();

      // Kiểm tra computed property
      expect(wrapper.vm.isDecrementDisabled).toBe(true);
      // Kiểm tra DOM
      expect(
        wrapper.find(minusButtonSelector).attributes("disabled")
      ).toBeDefined();
    });

    it("TC 3.2: Should disable plus button when value is 100 and unit is % (isIncrementDisabled)", async () => {
      wrapper.vm.value = 100;
      wrapper.vm.unit = "%";
      await wrapper.vm.$nextTick();

      // Kiểm tra computed property
      expect(wrapper.vm.isIncrementDisabled).toBe(true);
      // Kiểm tra DOM
      expect(wrapper.find(plusButtonSelector).attributes("disabled"));
    });

    it("TC 3.3: Should NOT disable plus button when value is 100 and unit is px", async () => {
      wrapper.vm.value = 100;
      wrapper.vm.unit = "px";
      await wrapper.vm.$nextTick();

      // Kiểm tra computed property (100 trong px không bị giới hạn)
      expect(wrapper.vm.isIncrementDisabled).toBe(false);
      // Kiểm tra DOM
      expect(wrapper.find(plusButtonSelector).attributes("disabled"));
    });
  });

  // --- 4. Logic Chuyển đổi Đơn vị (handleUnitChange) ---
  describe("Unit Switching Logic", () => {
    it("TC 4.1: Should cap value to 100 when switching from px to % with value > 100", async () => {
      wrapper.vm.value = 200;
      wrapper.vm.unit = "px";

      await wrapper.find(unitPercentButton).trigger("click"); // Click chuyển sang %

      // Logic: if (newUnit === "%" && Number(value.value) > 100) => value.value = 100
      expect(wrapper.vm.unit).toBe("%");
      expect(wrapper.vm.value).toBe(100);
      expect(wrapper.vm.lastValidValue).toBe(100);
    });

    it("TC 4.2: Should keep value when switching from px to % with value <= 100", async () => {
      wrapper.vm.value = 50;
      wrapper.vm.unit = "px";

      await wrapper.find(unitPercentButton).trigger("click");

      // Giá trị 50 vẫn được giữ nguyên
      expect(wrapper.vm.unit).toBe("%");
      expect(wrapper.vm.value).toBe(50);
    });

    it("TC 4.3: Should keep value when switching from % to px", async () => {
      wrapper.vm.value = 50;
      wrapper.vm.unit = "%";

      await wrapper.find(unitPxButton).trigger("click");

      // Giá trị vẫn được giữ nguyên
      expect(wrapper.vm.unit).toBe("px");
      expect(wrapper.vm.value).toBe(50);
    });
  });
});
