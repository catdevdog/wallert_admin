<script setup>
import { ref, onMounted } from "vue";
import { useDisplay } from "vuetify";
import ScheduleForm from "@/components/ScheduleForm.vue";

// 상태 관리
const dialog = ref(false);
const editMode = ref(false);
const brands = ref([]);
const schedules = ref([]);
const loading = ref(false);
const error = ref(null);
const { mobile } = useDisplay();

// 스낵바 상태
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

// 데이터 테이블 설정
const headers = [
  // { title: "인스타", value: "brand_name", sortable: true },
  { title: "암장", value: "name_kr", sortable: true },
  { title: "벽", value: "wall_name", sortable: true },
  { title: "일정", value: "type", sortable: true },
  {
    title: "날짜",
    value: "date",
    sortable: true,
  },
  { title: "비고", value: "description", sortable: false },
  {
    title: "Actions",
    value: "actions",
    sortable: false,
    align: "center",
    width: "200px",
  },
];

// 초기 폼 상태
const initialFormState = {
  brand_name: "",
  name_kr: "",
  wall_name: "",
  type: "",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  description: "",
};

const form = ref({ ...initialFormState });

// API 호출 함수들
async function fetchBrands() {
  try {
    loading.value = true;
    error.value = null;
    const response = await $fetch("/api/brands_info");
    brands.value = response.map((brand) => ({
      title: brand.name_kr,
      value: brand.name,
    }));
  } catch (err) {
    error.value = "브랜드 정보를 불러오는데 실패했습니다.";
    showSnackbar("브랜드 정보를 불러오는데 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

async function fetchSchedules() {
  try {
    loading.value = true;
    error.value = null;
    const response = await $fetch("/api/schedules");
    schedules.value = response.map((schedule) => ({
      ...schedule,
      year: new Date(schedule.date).getFullYear(),
      month: new Date(schedule.date).getMonth() + 1,
      day: new Date(schedule.date).getDate(),
    }));
  } catch (err) {
    error.value = "일정을 불러오는데 실패했습니다.";
    showSnackbar("일정을 불러오는데 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}
function handleSave(scheduleData) {
  console.log("Received save event with data:", scheduleData);
  if (editMode.value) {
    updateSchedule(scheduleData);
  } else {
    addSchedule(scheduleData);
  }
}

async function addSchedule(schedule) {
  try {
    loading.value = true;
    console.log("Adding schedule:", schedule);
    const response = await $fetch("/api/schedules", {
      method: "POST",
      body: schedule,
    });
    console.log("Add response:", response);
    schedules.value.push(response);
    showSnackbar("일정이 추가되었습니다.");
    dialog.value = false;
  } catch (err) {
    console.error("Add schedule error:", err);
    const errorMessage =
      err.data?.message || err.message || "일정 추가에 실패했습니다.";
    showSnackbar(errorMessage, "error");
  } finally {
    loading.value = false;
  }
}

async function updateSchedule(schedule) {
  try {
    loading.value = true;
    console.log("Updating schedule:", schedule);
    const response = await $fetch("/api/schedules", {
      method: "PUT",
      body: schedule,
    });
    console.log("Update response:", response);
    const index = schedules.value.findIndex((s) => s.id === schedule.id);
    if (index !== -1) {
      schedules.value[index] = response;
    }
    showSnackbar("일정이 수정되었습니다.");
    dialog.value = false;
  } catch (err) {
    console.error("Update schedule error:", err);
    const errorMessage =
      err.data?.message || err.message || "일정 수정에 실패했습니다.";
    showSnackbar(errorMessage, "error");
  } finally {
    loading.value = false;
  }
}

async function deleteSchedule(id) {
  try {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    loading.value = true;
    await $fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
    schedules.value = schedules.value.filter((schedule) => schedule.id !== id);
    showSnackbar("일정이 삭제되었습니다.");
  } catch (err) {
    showSnackbar("일정 삭제에 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

// UI 관련 함수들
function showSnackbar(text, color = "success") {
  snackbar.value = {
    show: true,
    text,
    color,
  };
}

function editSchedule(item) {
  editMode.value = true;
  // 날짜 파싱 및 폼 데이터 설정
  const date = new Date(item.date);
  form.value = {
    ...item,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
  dialog.value = true;
}

function openDialog() {
  editMode.value = false;
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
  dialog.value = true;
}

function closeModal() {
  dialog.value = false;
  editMode.value = false;
  form.value = { ...initialFormState };
}
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
// 컴포넌트 마운트
onMounted(() => {
  Promise.all([fetchBrands(), fetchSchedules()]);
});
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>일정 관리</span>
        <v-btn
          color="primary"
          @click="openDialog"
          :disabled="loading"
          prepend-icon="mdi-plus"
        >
          일정 추가
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-data-table
          :items="schedules"
          :headers="headers"
          :loading="loading"
          :mobile-breakpoint="0"
          :items-per-page="31"
          :footer-props="{
            'items-per-page-options': [31, 60, 120],
            showFirstLastPage: true,
          }"
        >
          <!-- 로딩 템플릿 -->
          <template #loading>
            <v-skeleton-loader
              type="table-row"
              :loading="loading"
            ></v-skeleton-loader>
          </template>

          <!-- 에러 템플릿 -->
          <template #no-data>
            <v-alert v-if="error" type="error" class="ma-2">
              {{ error }}
            </v-alert>
            <v-alert v-else type="info" class="ma-2">
              데이터가 없습니다.
            </v-alert>
          </template>
          <!-- 날짜 포맷팅을 위한 커스텀 템플릿 -->
          <template #item.date="{ item }">
            {{ formatDate(item.date) }}
          </template>

          <!-- 액션 버튼 템플릿 -->
          <template #item.actions="{ item }">
            <v-btn
              color="primary"
              size="small"
              class="mr-2"
              :disabled="loading"
              @click="editSchedule(item)"
              icon
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              color="error"
              size="small"
              :disabled="loading"
              @click="deleteSchedule(item.id)"
              icon
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <!-- 타입 칼럼 커스텀 렌더링 -->
          <template #item.type="{ item }">
            <v-chip
              :color="
                item.type === 'SETTING'
                  ? 'success'
                  : item.type === 'REMOVAL'
                  ? 'error'
                  : 'info'
              "
              size="small"
            >
              {{ item.type }}
            </v-chip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 스케줄 폼 다이얼로그 -->
    <schedule-form
      v-model="dialog"
      :brands="brands"
      :editMode="editMode"
      @save="handleSave"
      @update:modelValue="closeModal"
      :editData="form"
      :loading="loading"
    />

    <!-- 스낵바 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">
          닫기
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.v-data-table :deep(th) {
  white-space: nowrap;
  font-weight: bold !important;
}
</style>
