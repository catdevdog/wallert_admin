<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-toolbar :color="editMode ? 'primary' : 'success'" class="text-white">
        <v-toolbar-title>
          {{ editMode ? "브랜드 수정" : "브랜드 추가" }}
        </v-toolbar-title>
        <template #append>
          <v-btn icon @click="closeModal">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-form ref="formRef" v-model="isFormValid" @submit.prevent="handleSave">
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="인스타 계정명*"
            :rules="[(v) => !!v || '인스타 계정명을 입력해주세요']"
            :disabled="editMode"
          ></v-text-field>

          <v-text-field
            v-model="form.brand"
            label="브랜드명*"
            :rules="[(v) => !!v || '브랜드명을 입력해주세요']"
          ></v-text-field>

          <v-text-field
            v-model="form.name_kr"
            label="한글명*"
            :rules="[(v) => !!v || '한글명을 입력해주세요']"
          ></v-text-field>

          <v-text-field
            v-model="form.profile_image"
            label="프로필 이미지 URL"
            hint="Instagram 프로필 이미지 URL을 입력하세요"
            persistent-hint
          ></v-text-field>

          <!-- 벽 이름 관리 -->
          <div class="mt-4">
            <div class="d-flex align-center mb-2">
              <label class="text-subtitle-1 font-weight-medium">벽 목록</label>
              <v-btn
                color="primary"
                size="small"
                variant="text"
                @click="addWall"
                class="ml-2"
              >
                <v-icon>mdi-plus</v-icon> 벽 추가
              </v-btn>
            </div>

            <div
              v-if="form.wall_names.length === 0"
              class="text-subtitle-2 text-medium-emphasis"
            >
              등록된 벽이 없습니다. 벽을 추가해주세요.
            </div>

            <v-card v-else variant="outlined" class="pa-2">
              <div
                v-for="(wall, index) in form.wall_names"
                :key="index"
                class="d-flex align-center mb-2"
              >
                <div class="mr-2 text-body-2 text-grey">{{ index + 1 }}</div>
                <v-text-field
                  v-model="form.wall_names[index]"
                  density="compact"
                  hide-details
                  class="flex-grow-1"
                  placeholder="벽 이름을 입력하세요"
                  :rules="[(v) => !!v || '벽 이름을 입력해주세요']"
                ></v-text-field>

                <v-btn
                  color="error"
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  class="ml-2"
                  @click="removeWall(index)"
                ></v-btn>
              </div>
            </v-card>
          </div>
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
  name: "",
  brand: "",
  name_kr: "",
  wall_names: [],
  profile_image: "",
});

// 모달 표시 상태 감시
watch(
  () => props.modelValue,
  (newValue) => {
    dialog.value = newValue;
    if (newValue) {
      initializeForm();
    }
  }
);

// editData 감시
watch(
  () => props.editData,
  (newValue) => {
    if (props.editMode && newValue) {
      form.value = {
        ...newValue,
        wall_names: [...(newValue.wall_names || [])],
      };
    }
  },
  { deep: true }
);

function initializeForm() {
  if (props.editMode && props.editData) {
    form.value = {
      ...props.editData,
      wall_names: [...(props.editData.wall_names || [])],
    };
  } else {
    form.value = {
      name: "",
      brand: "",
      name_kr: "",
      wall_names: [],
      profile_image: "",
    };
  }
}

// 벽 관리 함수들
function addWall() {
  form.value.wall_names.push("");
}

function removeWall(index) {
  form.value.wall_names.splice(index, 1);
}

async function handleSave() {
  const isValid = await formRef.value?.validate();

  if (!isValid) {
    return;
  }

  // 빈 벽 이름 제거
  form.value.wall_names = form.value.wall_names.filter(
    (wall) => wall.trim() !== ""
  );

  emit("save", { ...form.value });
}

function closeModal() {
  formRef.value?.reset();
  emit("update:modelValue", false);
}
</script>

<style scoped>
.v-text-field :deep(input) {
  font-size: 14px;
}

.v-btn.v-btn--density-default {
  text-transform: none;
}
</style>
