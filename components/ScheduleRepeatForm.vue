<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card>
      <v-toolbar color="primary" class="text-white">
        <v-toolbar-title>반복 일정 생성</v-toolbar-title>
        <template #append>
          <v-btn icon @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-card-text class="pt-4">
          <v-select
            v-model="form.brand_name"
            :items="brands"
            label="브랜드*"
            item-title="title"
            item-value="value"
            :rules="[(v) => !!v || '브랜드를 선택해주세요']"
            :loading="loading"
            @update:model-value="handleBrandChange"
          />

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

          <v-select
            v-model="form.type"
            :items="typeOptions"
            label="일정 유형*"
            :rules="[(v) => !!v || '일정 유형을 선택해주세요']"
            required
          />

          <v-radio-group v-model="form.repeatType" inline>
            <template #label>
              <div class="text-subtitle-1 font-weight-medium">
                반복 방식 선택*
              </div>
            </template>
            <v-radio label="일수 간격" value="days" />
            <v-radio label="요일 지정" value="weekdays" />
          </v-radio-group>

          <template v-if="form.repeatType === 'days'">
            <v-text-field
              v-model="form.repeatValue"
              label="반복 간격 (일)*"
              type="number"
              min="1"
              :rules="[(v) => !!v || '반복 간격을 입력해주세요']"
              required
            />
          </template>

          <template v-else>
            <div class="d-flex gap-2 flex-wrap mb-4 justify-space-between">
              <v-btn
                v-for="day in weekdayOptions"
                size="small"
                :key="day.value"
                :color="
                  form.selectedWeekdays.includes(day.value)
                    ? 'primary'
                    : undefined
                "
                :variant="
                  form.selectedWeekdays.includes(day.value)
                    ? 'flat'
                    : 'outlined'
                "
                rounded="pill"
                @click="toggleWeekday(day.value)"
              >
                {{ day.title }}
              </v-btn>
            </div>
          </template>

          <v-text-field
            v-model="form.repeatCount"
            label="반복 횟수 (1 = 선택한 벽 한번)*"
            type="number"
            min="1"
            :rules="[(v) => !!v || '반복 횟수를 입력해주세요']"
            required
          />

          <v-text-field
            v-model="form.startDate"
            label="시작 날짜*"
            type="date"
            :rules="[(v) => !!v || '시작 날짜를 선택해주세요']"
            required
          />

          <v-textarea v-model="form.description" label="설명" rows="3" />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="close" :disabled="loading">취소</v-btn>
          <v-btn
            color="primary"
            :loading="loading"
            @click="handleSubmit"
            :disabled="!isFormValid"
          >
            생성
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  brands: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "create"]);

const formRef = ref(null);
const isFormValid = ref(true);
const availableWalls = ref([]);

const form = ref({
  brand_name: "",
  wall_name: "",
  type: "",
  repeatType: "days",
  repeatValue: 28,
  selectedWeekdays: [],
  repeatCount: 2,
  startDate: "",
  description: "",
});

const typeOptions = [
  { title: "세팅", value: "SETTING" },
  { title: "탈거", value: "REMOVAL" },
  { title: "이벤트", value: "EVENT" },
  { title: "휴무일", value: "CLOSED" },
];

const weekdayOptions = [
  { title: "일", value: 0 },
  { title: "월", value: 1 },
  { title: "화", value: 2 },
  { title: "수", value: 3 },
  { title: "목", value: 4 },
  { title: "금", value: 5 },
  { title: "토", value: 6 },
];

async function handleBrandChange(brandName) {
  form.value.wall_name = "";
  availableWalls.value = [];

  if (!brandName) return;

  try {
    const response = await $fetch(`/api/brands_info?name=${brandName}`);
    availableWalls.value = response.wall_names || [];
  } catch (error) {
    console.error("Failed to fetch walls:", error);
  }
}

function toggleWeekday(value) {
  const index = form.value.selectedWeekdays.indexOf(value);
  if (index === -1) {
    form.value.selectedWeekdays.push(value);
  } else {
    form.value.selectedWeekdays.splice(index, 1);
  }
}

async function handleSubmit() {
  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  if (
    form.value.repeatType === "weekdays" &&
    form.value.selectedWeekdays.length === 0
  ) {
    return;
  }

  // 선택된 브랜드의 한글 이름 가져오기
  const selectedBrand = props.brands.find(
    (b) => b.value === form.value.brand_name
  );
  const brandNameKr = selectedBrand?.title || "";

  // 일정 유형의 한글 이름 가져오기
  const typeKr =
    typeOptions.find((t) => t.value === form.value.type)?.title || "";

  // name_kr 자동 생성
  const name_kr = `${brandNameKr} ${typeKr}`;

  emit("create", {
    ...form.value,
    name_kr,
  });
}

function close() {
  emit("update:modelValue", false);
  resetForm();
}

function resetForm() {
  form.value = {
    brand_name: "",
    wall_name: "",
    type: "",
    repeatType: "days",
    repeatValue: 28,
    selectedWeekdays: [],
    repeatCount: 1,
    startDate: "",
    description: "",
  };
  availableWalls.value = [];
  formRef.value?.reset();
}

// 폼 초기화
defineExpose({
  resetForm,
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.v-card-text {
  max-height: 70vh;
  overflow-y: auto;
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
