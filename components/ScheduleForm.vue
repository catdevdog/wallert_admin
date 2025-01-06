<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
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
            :disabled="loading"
          ></v-select>

          <v-text-field
            v-model="form.wall_name"
            label="벽 이름*"
            :rules="[(v) => !!v || '벽 이름을 입력해주세요']"
            :disabled="loading"
          ></v-text-field>

          <v-select
            v-model="form.type"
            :items="['SETTING', 'REMOVAL', 'EVENT']"
            label="일정 유형*"
            :rules="[(v) => !!v || '일정 유형을 선택해주세요']"
            :disabled="loading"
          ></v-select>

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
                :max="31"
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
            :disabled="!isFormValid"
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
});

const emit = defineEmits(["update:modelValue", "save"]);

const dialog = ref(false);
const formRef = ref(null);
const isFormValid = ref(false);

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

// 년도 배열 생성 (현재 년도 포함 3년)
const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i);

// 월 배열 생성 (1-12)
const months = Array.from({ length: 12 }, (_, i) => i + 1);

// 모달 표시 상태 감시
watch(
  () => props.modelValue,
  (newValue) => {
    dialog.value = newValue;
    if (newValue) {
      // 모달이 열릴 때 폼 초기화
      initializeForm();
    }
  }
);

// editData 감시
watch(
  () => props.editData,
  (newValue) => {
    if (props.editMode && newValue) {
      // 수정 모드이고 데이터가 있을 때 폼 업데이트
      form.value = { ...newValue };
    }
  },
  { deep: true }
);

// brand_name이 변경될 때 name_kr 업데이트
watch(
  () => form.value.brand_name,
  (newValue) => {
    if (newValue) {
      const selectedBrand = props.brands.find(
        (brand) => brand.value === newValue
      );
      if (selectedBrand) {
        form.value.name_kr = selectedBrand.title;
      }
    }
  }
);

function initializeForm() {
  if (props.editMode && props.editData) {
    // 수정 모드일 때
    form.value = { ...props.editData };
  } else {
    // 새로 추가할 때
    form.value = {
      brand_name: "",
      name_kr: "",
      wall_name: "",
      type: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      description: "",
    };
  }
}

async function handleSave() {
  const isValid = await formRef.value?.validate();

  if (!isValid) {
    return;
  }

  // 저장할 데이터 구성
  const saveData = {
    ...form.value,
    id: props.editMode ? props.editData.id : undefined, // 수정 시 ID 포함
    date: `${form.value.year}-${String(form.value.month).padStart(
      2,
      "0"
    )}-${String(form.value.day).padStart(2, "0")}`,
  };

  emit("save", saveData);
}

function closeModal() {
  dialog.value = false;
  emit("update:modelValue", false);
}
</script>

<style scoped>
.v-card-text {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

@media (max-width: 600px) {
  .v-card-text {
    max-height: calc(100vh - 120px);
  }
}
</style>
