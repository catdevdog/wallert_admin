// pages/index.vue
<template>
  <v-container>
    <!-- 로딩 인디케이터 -->
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <!-- 다음 세팅 일정 그리드 -->
    <v-row>
      <v-col
        v-for="brand in sortedBrands"
        :key="brand.brand_name"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="brand-card">
          <v-card-item>
            <v-card-title class="mb-2">
              {{ brand.name_kr }}
            </v-card-title>
            <template v-if="brand.next_setting">
              <v-card-subtitle class="d-flex align-center font-weight-bold">
                <v-icon
                  size="default"
                  :color="getDDayColor(brand.next_setting?.date)"
                  icon="mdi-wall mr-2"
                />{{ brand.next_setting.wall_name }}
              </v-card-subtitle>
            </template>
          </v-card-item>

          <v-card-text class="text-center">
            <template v-if="brand.next_setting">
              <div class="d-flex flex-column align-center">
                <div
                  class="text-h4 font-weight-bold mb-2"
                  :class="`text-${getDDayColor(brand.next_setting.date)}`"
                >
                  {{ getDDay(brand.next_setting.date) }}
                </div>
                <div class="text-body-2">
                  {{ formatDate(brand.next_setting.date) }}
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-h6 text-medium-emphasis">예정된 세팅 없음</div>
            </template>

            <!-- 벽면별 평균 주기 -->
            <v-expand-transition>
              <div v-if="Object.keys(brand.walls).length > 0" class="mt-4">
                <v-divider class="mb-2" />
                <div class="text-caption text-medium-emphasis mb-2">
                  벽면별 평균 주기
                </div>
                <div
                  v-for="(data, wall) in brand.walls"
                  :key="wall"
                  class="d-flex justify-space-between text-body-2 mb-1"
                >
                  <span>{{ wall }}</span>
                  <span
                    >{{ data.avg_cycle }}일 ({{ data.setting_count }}회)</span
                  >
                </div>
              </div>
            </v-expand-transition>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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

<script setup>
import { ref, computed, onMounted } from "vue";

const loading = ref(false);
const brands = ref([]);

// 스낵바 상태
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

// 브랜드 정렬 (다음 세팅 있는 것 먼저, 그 다음 날짜순)
const sortedBrands = computed(() => {
  return [...brands.value].sort((a, b) => {
    if (!a.next_setting && !b.next_setting) return 0;
    if (!a.next_setting) return 1;
    if (!b.next_setting) return -1;
    return new Date(a.next_setting.date) - new Date(b.next_setting.date);
  });
});

// D-Day 계산
function getDDay(dateStr) {
  if (!dateStr) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateStr);
  const diff = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));

  return diff === 0 ? "D-Day" : `D-${diff}`;
}

// D-Day 색상
function getDDayColor(dateStr) {
  if (!dateStr) return "grey";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateStr);
  const diff = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "warning";
  if (diff <= 3) return "error";
  if (diff <= 7) return "warning";
  return "primary";
}

// 날짜 포맷팅
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

// 데이터 로드
async function fetchData() {
  try {
    loading.value = true;
    brands.value = await $fetch("/api/schedule-summary");
  } catch (error) {
    showSnackbar("데이터를 불러오는데 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

// 스낵바 표시
function showSnackbar(text, color = "success") {
  snackbar.value = {
    show: true,
    text,
    color,
  };
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.brand-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
