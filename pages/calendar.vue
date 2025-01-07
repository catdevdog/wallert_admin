<template>
  <v-container fluid>
    <v-card>
      <v-toolbar>
        <v-btn icon @click="previousMonth">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>

        <v-toolbar-title class="text-center">
          {{ currentMonthTitle }}
        </v-toolbar-title>

        <v-btn icon @click="nextMonth">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>

        <v-spacer></v-spacer>
        <v-chip
          v-for="type in ['SETTING', 'REMOVAL', 'EVENT', 'CLOSED']"
          :key="type"
          :color="getEventColor({ type })"
          size="small"
          label
          class="mr-2"
        >
          {{ getEventTypeLabel(type) }}
        </v-chip>
        <v-btn
          prepend-icon="mdi-plus"
          @click="openAddDialog"
          :loading="loading"
        >
          일정 추가
        </v-btn>
      </v-toolbar>

      <!-- 달력 그리드 -->
      <v-card-text>
        <div class="calendar-grid">
          <!-- 요일 헤더 -->
          <div class="calendar-header">
            <div
              v-for="day in ['일', '월', '화', '수', '목', '금', '토']"
              :key="day"
              class="calendar-header-cell"
              :class="{ weekend: day === '일' || day === '토' }"
            >
              {{ day }}
            </div>
          </div>

          <!-- 날짜 그리드 -->
          <div class="calendar-body">
            <div
              v-for="week in calendarDays"
              :key="week[0].date"
              class="calendar-row"
            >
              <div
                v-for="day in week"
                :key="day.date"
                class="calendar-cell"
                :class="{
                  'outside-month': !day.isCurrentMonth,
                  today: day.isToday,
                  weekend: day.dayOfWeek === 0 || day.dayOfWeek === 6,
                }"
              >
                <div class="date-number">
                  <v-btn
                    variant="text"
                    @click="openAddDialog({ date: day.date }, false)"
                  >
                    {{ new Date(day.date).getDate() }}
                  </v-btn>
                </div>
                <div class="events-container">
                  <v-chip
                    v-for="event in day.events"
                    :key="event.id"
                    :color="getEventColor(event)"
                    size="small"
                    class="mb-1 event-chip px-0 py-1"
                    label
                    @click="showEvent(event)"
                  >
                    <div class="event-content">
                      <p class="font-weight-bold text-body-4">
                        {{ event.name_kr }}
                      </p>
                      <p>[ {{ event.wall_name }} ]</p>
                    </div>
                  </v-chip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 일정 상세 다이얼로그 -->
    <v-dialog v-model="eventDialog" max-width="400">
      <v-card v-if="selectedEvent">
        <v-toolbar :color="getEventColor(selectedEvent)">
          <v-toolbar-title>{{ selectedEvent.name_kr }}</v-toolbar-title>
          <template #append>
            <v-btn icon @click="eventDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-toolbar>

        <v-card-text class="pt-4">
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2">mdi-calendar</v-icon>
            <span>{{ formatDate(selectedEvent.date) }}</span>
          </div>

          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2">mdi-instagram</v-icon>
            <span>{{ selectedEvent.brand_name }}</span>
          </div>

          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2">mdi-wall</v-icon>
            <span>{{ selectedEvent.wall_name }}</span>
          </div>

          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2">mdi-tag</v-icon>
            <v-chip
              :color="getEventColor(selectedEvent)"
              size="small"
              variant="flat"
            >
              {{ getEventTypeLabel(selectedEvent.type) }}
            </v-chip>
          </div>

          <div v-if="selectedEvent.description" class="mt-4">
            <div class="text-caption text-medium-emphasis mb-1">설명</div>
            <div>{{ selectedEvent.description }}</div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="editEvent">
            수정
          </v-btn>
          <v-btn color="error" variant="text" @click="deleteEvent">
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 일정 추가/수정 다이얼로그 -->
    <schedule-form
      v-model="formDialog"
      :brands="brands"
      :editMode="editMode"
      :editData="selectedEvent"
      :loading="loading"
      @save="handleSave"
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

<script setup>
import { ref, computed, onMounted } from "vue";
import ScheduleForm from "@/components/ScheduleForm.vue";

// 상태 관리
const loading = ref(false);
const currentDate = ref(new Date());
const eventDialog = ref(false);
const formDialog = ref(false);
const selectedEvent = ref(null);
const schedules = ref([]);
const brands = ref([]);
const editMode = ref(false);

// 스낵바 상태
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

// 시간대 관련 유틸리티 함수
function getKoreanDate(date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}

function getLocalISOString(date) {
  const koreanDate = getKoreanDate(date);
  return koreanDate.toISOString().split("T")[0];
}

// 현재 월 제목
const currentMonthTitle = computed(() => {
  const koreanDate = getKoreanDate(currentDate.value);
  return koreanDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });
});

// 달력 날짜 계산
const calendarDays = computed(() => {
  const koreanDate = getKoreanDate(currentDate.value);
  const year = koreanDate.getFullYear();
  const month = koreanDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 이전 달의 마지막 날짜들
  const prevMonthDays = [];
  const firstDayOfWeek = firstDay.getDay();
  if (firstDayOfWeek > 0) {
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDate = prevMonth.getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDate - i);
      prevMonthDays.push({
        date: getLocalISOString(date),
        isCurrentMonth: false,
        isToday: isSameDate(date, new Date()),
        dayOfWeek: date.getDay(),
        events: getEventsForDate(date),
      });
    }
  }

  // 현재 달의 날짜들
  const currentMonthDays = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    currentMonthDays.push({
      date: getLocalISOString(date),
      isCurrentMonth: true,
      isToday: isSameDate(date, new Date()),
      dayOfWeek: date.getDay(),
      events: getEventsForDate(date),
    });
  }

  // 다음 달의 시작 날짜들
  const nextMonthDays = [];
  const lastDayOfWeek = lastDay.getDay();
  if (lastDayOfWeek < 6) {
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const date = new Date(year, month + 1, i);
      nextMonthDays.push({
        date: getLocalISOString(date),
        isCurrentMonth: false,
        isToday: isSameDate(date, new Date()),
        dayOfWeek: date.getDay(),
        events: getEventsForDate(date),
      });
    }
  }

  // 모든 날짜를 주 단위로 묶기
  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return weeks;
});

// 유틸리티 함수들
function isSameDate(date1, date2) {
  const d1 = getKoreanDate(new Date(date1));
  const d2 = getKoreanDate(new Date(date2));
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getEventsForDate(date) {
  const dateStr = getLocalISOString(new Date(date));
  return schedules.value.filter((schedule) => {
    const scheduleDate = getLocalISOString(new Date(schedule.date));
    return scheduleDate === dateStr;
  });
}

function getEventColor(event) {
  switch (event.type) {
    case "SETTING":
      return "success";
    case "REMOVAL":
      return "error";
    case "EVENT":
      return "info";
    case "CLOSED":
      return "grey";
    default:
      return "primary";
  }
}

function getEventTypeLabel(type) {
  switch (type) {
    case "SETTING":
      return "세팅";
    case "REMOVAL":
      return "탈거";
    case "EVENT":
      return "이벤트";
    case "CLOSED":
      return "휴무일";
    default:
      return type;
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const koreanDate = getKoreanDate(date);
  return koreanDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

// 네비게이션 함수들
function previousMonth() {
  const koreanDate = getKoreanDate(currentDate.value);
  currentDate.value = new Date(
    koreanDate.getFullYear(),
    koreanDate.getMonth() - 1,
    1
  );
}

function nextMonth() {
  const koreanDate = getKoreanDate(currentDate.value);
  currentDate.value = new Date(
    koreanDate.getFullYear(),
    koreanDate.getMonth() + 1,
    1
  );
}

// 이벤트 핸들러들
function showEvent(event) {
  selectedEvent.value = event;
  eventDialog.value = true;
}

function openAddDialog(date = null, edit = false) {
  selectedEvent.value = null;
  if (date && date.date) {
    selectedEvent.value = {
      date: date.date,
    };
  }

  editMode.value = edit;
  formDialog.value = true;
}

function editEvent() {
  eventDialog.value = false;
  formDialog.value = true;
}

async function deleteEvent() {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    loading.value = true;
    await $fetch(`/api/schedules?id=${selectedEvent.value.id}`, {
      method: "DELETE",
    });

    showSnackbar("일정이 삭제되었습니다.");
    await fetchSchedules();
    eventDialog.value = false;
  } catch (error) {
    showSnackbar("일정 삭제에 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

async function handleSave(scheduleData) {
  try {
    loading.value = true;
    if (selectedEvent.value) {
      // 수정
      await $fetch("/api/schedules", {
        method: "PUT",
        body: {
          ...scheduleData,
          id: selectedEvent.value.id,
        },
      });
      showSnackbar("일정이 수정되었습니다.");
    } else {
      // 추가
      await $fetch("/api/schedules", {
        method: "POST",
        body: scheduleData,
      });
      showSnackbar("일정이 추가되었습니다.");
    }

    await fetchSchedules();
    formDialog.value = false;
  } catch (error) {
    showSnackbar("일정 저장에 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

// API 호출 함수들
async function fetchSchedules() {
  try {
    loading.value = true;
    const response = await $fetch("/api/schedules");
    schedules.value = response;
  } catch (error) {
    showSnackbar("일정을 불러오는데 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

async function fetchBrands() {
  try {
    loading.value = true;
    const response = await $fetch("/api/brands_info");
    brands.value = response.map((brand) => ({
      title: brand.name_kr,
      value: brand.name,
    }));
  } catch (error) {
    showSnackbar("브랜드 정보를 불러오는데 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

function showSnackbar(text, color = "success") {
  snackbar.value = {
    show: true,
    text,
    color,
  };
}

// 초기 데이터 로드
onMounted(() => {
  Promise.all([fetchSchedules(), fetchBrands()]);
});
</script>

<style scoped>
.calendar-grid {
  width: 100%;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.calendar-header-cell {
  padding: 12px;
  text-align: center;
  font-weight: bold;
  color: rgb(var(--v-theme-on-surface));
}

.calendar-body {
  display: flex;
  flex-direction: column;
}

.calendar-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  min-height: 120px;
}

.calendar-cell {
  padding: 8px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  position: relative;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.calendar-cell:last-child {
  border-right: none;
}

.date-number {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.outside-month {
  background: rgb(var(--v-theme-on-surface-variant));
  .date-number {
    color: rgba(var(--v-theme-on-surface), 0.38);
  }
}

.today .date-number {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 50%;
}

.weekend {
  /* background: rgb(var(--v-theme-surface-variant)); */
}

.weekend.outside-month {
  /* background: rgba(var(--v-theme-surface), 0.3); */
}

.events-container {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: calc(100% - 32px);
  overflow-y: auto;
}

.event-chip {
  width: 100%;
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface-variant));
  height: auto;
}

.event-content {
  width: 100%;
  white-space: normal;
  word-break: break-word;
  line-height: 1.2;
  display: flex;
  gap: 4px;
  justify-content: space-between;
  flex-wrap: wrap;
}

/* 스크롤바 스타일링 */
.events-container::-webkit-scrollbar {
  width: 4px;
}

.events-container::-webkit-scrollbar-track {
  background: rgb(var(--v-theme-surface-variant));
}

.events-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.38);
  border-radius: 2px;
}

.events-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.6);
}

/* 반응형 */
@media (max-width: 600px) {
  .calendar-cell {
    padding: 4px;
  }

  .date-number {
    font-size: 0.75rem;
    width: 20px;
    height: 20px;
  }

  .events-container {
    margin-top: 24px;
  }

  .event-content {
    font-size: 0.75rem;
  }
}
</style>
