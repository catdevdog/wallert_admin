<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-toolbar :color="editMode ? 'primary' : 'success'" class="text-white">
        <v-toolbar-title>
          {{ editMode ? "일정 수정" : "일정 추가" }}
        </v-toolbar-title>
        <template #append>
          <v-btn icon @click="closeModal">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-form ref="formRef" v-model="isFormValid" @submit.prevent="handleSave">
        <v-card-text>
          <v-select
            v-model="form.brand_name"
            :items="brands"
            label="브랜드*"
            item-title="title"
            item-value="value"
            :rules="[(v) => !!v || '브랜드를 선택해주세요']"
            :loading="loading"
            :disabled="loading || editMode"
            @update:model-value="handleBrandChange"
          ></v-select>

          <!-- 벽 선택 -->
          <div v-if="form.brand_name">
            <label class="text-subtitle-1 font-weight-medium d-block mb-2"
              >벽 선택*</label
            >
            <div
              v-if="availableWalls.length === 0"
              class="text-body-2 text-grey mb-4"
            >
              등록된 벽이 없습니다.
            </div>
            <v-btn-toggle
              v-else
              v-model="form.wall_name"
              mandatory
              class="mb-4 h-auto gap-2"
              :rules="[(v) => !!v || '벽을 선택해주세요']"
            >
              <v-btn
                v-for="wall in availableWalls"
                :key="wall"
                :value="wall"
                :color="form.wall_name === wall ? 'primary' : undefined"
                class="py-3 border text-body-1"
                size="small"
              >
                {{ wall }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <!-- 일정 타입 선택 -->
          <div>
            <label class="text-subtitle-1 font-weight-medium d-block mb-2"
              >일정 타입*</label
            >
            <v-btn-toggle
              v-model="form.type"
              mandatory
              class="mb-4 d-flex flex-wrap gap-2"
              :rules="[(v) => !!v || '일정 타입을 선택해주세요']"
            >
              <v-btn
                v-for="type in scheduleTypes"
                :key="type.value"
                :value="type.value"
                :color="getTypeColor(type.value)"
                class="flex-grow-1 border text-body-1"
              >
                <v-icon :icon="type.icon" class="mr-1" />
                {{ type.title }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <!-- 날짜 선택 -->
          <v-row>
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.year"
                :items="years"
                label="년도*"
                :rules="[(v) => !!v || '년도를 선택해주세요']"
                :disabled="loading"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.month"
                :items="months"
                label="월*"
                :rules="[(v) => !!v || '월을 선택해주세요']"
                :disabled="loading"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.day"
                type="number"
                label="일*"
                :rules="[(v) => !!v || '일을 입력해주세요']"
                :disabled="loading"
                min="1"
                :max="getDaysInMonth(form.year, form.month)"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-textarea
            v-model="form.description"
            label="설명"
            :disabled="loading"
            rows="3"
          ></v-textarea>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeModal" :disabled="loading">
            취소
          </v-btn>
          <v-btn
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!isFormValid || !form.wall_name"
          >
            {{ editMode ? "수정" : "저장" }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: Boolean,
  brands: {
    type: Array,
    required: true,
  },
  editMode: {
    type: Boolean,
    default: false,
  },
  editData: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  addDate: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const dialog = ref(false);
const formRef = ref(null);
const isFormValid = ref(false);
const availableWalls = ref([]);
const localLoading = ref(false);

const scheduleTypes = [
  { title: "셋팅", value: "SETTING", icon: "mdi-wrench" },
  { title: "철거", value: "REMOVAL", icon: "mdi-delete" },
  { title: "이벤트", value: "EVENT", icon: "mdi-calendar-star" },
  { title: "휴무일", value: "CLOSED", icon: "mdi-power-sleep" },
];

const form = ref({
  brand_name: "",
  name_kr: "",
  wall_name: "",
  type: "",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  description: "",
});

const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i);

const months = Array.from({ length: 12 }, (_, i) => i + 1);

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getTypeColor(type) {
  switch (type) {
    case "SETTING":
      return "success";
    case "REMOVAL":
      return "error";
    case "EVENT":
      return "info";
    case "CLOSED":
      return "grey";
    default:
      return undefined;
  }
}

async function handleBrandChange(brandName) {
  form.value.wall_name = "";
  availableWalls.value = [];

  if (!brandName) return;

  try {
    localLoading.value = true;
    const response = await $fetch(`/api/brands_info?name=${brandName}`);
    const selectedBrand = props.brands.find((b) => b.value === brandName);

    if (selectedBrand) {
      form.value.name_kr = selectedBrand.title;
    }

    availableWalls.value = response.wall_names || [];
  } catch (error) {
    console.error("Failed to fetch walls:", error);
  } finally {
    localLoading.value = false;
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    dialog.value = newValue;
    if (newValue) {
      initializeForm();
    }
  }
);

watch(
  () => props.editData,
  (newValue) => {
    if (props.editMode && newValue) {
      const date = new Date(newValue.date);
      form.value = {
        ...newValue,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
      handleBrandChange(newValue.brand_name);
    }
  },
  { deep: true }
);

watch(
  () => props.addDate,
  (newValue) => {
    if (newValue) {
      form.value.year = new Date(newValue).getFullYear();
      form.value.month = new Date(newValue).getMonth() + 1;
      form.value.day = new Date(newValue).getDate();
    }
  }
);

function initializeForm() {
  if (props.editMode && props.editData) {
    // 기존 날짜 파싱
    const date = new Date(props.editData.date);
    form.value = {
      ...props.editData,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
    handleBrandChange(props.editData.brand_name);
  } else {
    // ...기존 코드
  }
}

async function handleSave() {
  const isValid = await formRef.value?.validate();

  if (!isValid || !form.value.wall_name) {
    return;
  }

  // 날짜 포맷팅
  const formattedDate = `${form.value.year}-${String(form.value.month).padStart(
    2,
    "0"
  )}-${String(form.value.day).padStart(2, "0")}`;

  emit("save", {
    ...form.value,
    date: formattedDate, // date 필드 추가
  });
}

function closeModal() {
  formRef.value?.reset();
  availableWalls.value = [];
  emit("update:modelValue", false);
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.wall-selection {
  margin-bottom: 20px;
}

.v-btn-toggle {
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .v-btn-toggle .v-btn {
    flex: 1 1 calc(50% - 4px);
  }
}
</style>
