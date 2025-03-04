<template>
  <v-container fluid class="pa-0 pa-sm-2">
    <v-card>
      <!-- 캘린더 헤더 - 고정 표시 -->
      <v-toolbar density="compact">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="d-flex align-center justify-space-between">
            <v-btn icon @click="previousMonth" density="comfortable">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <v-toolbar-title class="text-center calendar-title">
              {{ currentMonthTitle }}
            </v-toolbar-title>
            <v-btn icon @click="nextMonth" density="comfortable">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <div>
            <div class="d-flex flex-wrap align-center gap-2">
              <!-- 모바일용 암장 필터 드롭다운 메뉴 추가 -->
              <div v-if="isMobile" class="d-flex align-center ms-auto me-2">
                <v-menu
                  v-model="showGymFilter"
                  :close-on-content-click="false"
                  location="bottom"
                >
                  <template v-slot:activator="{ props }">
                    <v-badge
                      :content="
                        selectedGyms.length > 0 ? selectedGyms.length : ''
                      "
                      color="primary"
                      :model-value="selectedGyms.length > 0"
                      dot
                    >
                      <v-btn
                        v-bind="props"
                        icon
                        size="small"
                        :color="selectedGyms.length > 0 ? 'primary' : ''"
                      >
                        <v-icon>mdi-filter-variant</v-icon>
                      </v-btn>
                    </v-badge>
                  </template>

                  <v-card min-width="250" max-width="300">
                    <v-card-title class="text-subtitle-1 d-flex align-center">
                      암장 필터
                      <v-spacer></v-spacer>
                      <v-btn
                        v-if="selectedGyms.length > 0"
                        variant="text"
                        size="small"
                        color="primary"
                        @click="clearGymFilter"
                        density="comfortable"
                      >
                        초기화
                      </v-btn>
                    </v-card-title>

                    <v-divider></v-divider>

                    <v-card-text class="pt-2 pb-2">
                      <p
                        v-if="uniqueGyms.length === 0"
                        class="text-center text-caption pa-2"
                      >
                        로딩 중...
                      </p>
                      <v-list v-else density="compact" bg-color="transparent">
                        <v-list-item
                          v-if="selectedGyms.length === 0"
                          class="text-caption text-grey"
                        >
                          <v-icon size="small" color="grey" class="mr-2"
                            >mdi-information</v-icon
                          >
                          암장을 선택하면 일정이 표시됩니다
                        </v-list-item>
                        <v-list-item
                          v-for="gym in uniqueGyms"
                          :key="gym"
                          class="px-2"
                        >
                          <template v-slot:prepend>
                            <v-checkbox
                              v-model="selectedGyms"
                              :value="gym"
                              hide-details
                              color="primary"
                              density="compact"
                            ></v-checkbox>
                          </template>
                          <v-list-item-title class="text-subtitle-2">
                            {{ gym }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-card-text>

                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        color="primary"
                        variant="tonal"
                        @click="showGymFilter = false"
                      >
                        확인
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </div>

              <v-btn
                prepend-icon="mdi-plus"
                @click="openAddDialog"
                :loading="loading"
                size="medium"
                density="comfortable"
                class="flex-grow-0 pa-2 text-capitalize"
              >
              </v-btn>
              <v-btn
                prepend-icon="mdi-repeat"
                @click="openRepeatDialog"
                :loading="loading"
                size="medium"
                density="comfortable"
                class="flex-grow-0 pa-2 text-capitalize"
              >
              </v-btn>
            </div>
          </div>
        </div>
      </v-toolbar>
      <!-- 달력 그리드 -->
      <v-card-text class="px-1 px-sm-2 py-1">
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
                  'has-events': day.events.length > 0,
                }"
                @click="cellClick(day)"
              >
                <div class="date-number">
                  {{ new Date(day.date).getDate() }}
                </div>

                <!-- 일정 표시 영역 -->
                <div
                  v-if="day.events.length > 0"
                  class="mobile-event-indicator"
                >
                  <!-- 모바일에서는 전체 대화상자 대신 이벤트 요약 표시 -->
                  <div v-if="isMobile" class="mobile-events-preview">
                    <div
                      v-for="(event, index) in getFilteredEvents(
                        day.events
                      ).slice(0, 2)"
                      :key="event.id"
                      :class="{
                        'mb-1':
                          index <
                          Math.min(getFilteredEvents(day.events).length, 2) - 1,
                      }"
                      class="mobile-event-item"
                      :style="{ backgroundColor: getEventColorHex(event) }"
                      @click.stop="showEvent(event)"
                    >
                      <div class="mobile-event-text">
                        <span class="wall-name">{{ event.wall_name }}</span>
                      </div>
                    </div>
                    <div
                      v-if="getFilteredEvents(day.events).length > 2"
                      class="more-events"
                    >
                      +{{ getFilteredEvents(day.events).length - 2 }}
                    </div>
                    <div
                      v-if="
                        day.events.length > 0 &&
                        getFilteredEvents(day.events).length === 0
                      "
                      class="no-filter-selected"
                    >
                      <v-icon size="small" color="grey"
                        >mdi-filter-variant</v-icon
                      >
                    </div>
                  </div>

                  <!-- 데스크탑에서는 기존 이벤트 표시 방식 사용 -->
                  <div v-else class="events-container">
                    <v-chip
                      v-for="event in day.events"
                      :key="event.id"
                      :color="getEventColor(event)"
                      size="small"
                      class="mb-1 event-chip px-0 py-1"
                      label
                      @click.stop="showEvent(event)"
                    >
                      <div class="event-content">
                        <p>{{ event.brand_name }} - {{ event.wall_name }}</p>
                      </div>
                    </v-chip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
    <v-chip
      v-for="type in ['SETTING', 'REMOVAL', 'EVENT', 'CLOSED']"
      :key="type"
      :color="getEventColor({ type })"
      size="small"
      label
      class="ma-1"
    >
      {{ getEventTypeLabel(type) }}
    </v-chip>
    <!-- 모바일용 날짜별 이벤트 목록 다이얼로그 -->
    <v-dialog
      v-model="dayEventsDialog"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card v-if="selectedDay">
        <v-toolbar>
          <v-btn icon @click="dayEventsDialog = false">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title
            >{{ formatDate(selectedDay.date) }} 일정</v-toolbar-title
          >
          <v-badge
            :content="selectedGyms.length > 0 ? selectedGyms.length : ''"
            color="primary"
            :model-value="selectedGyms.length > 0"
            dot
          >
            <v-btn icon @click="showGymFilter = true">
              <v-icon>mdi-filter-variant</v-icon>
            </v-btn>
          </v-badge>
          <v-btn icon @click="openAddDialog({ date: selectedDay.date }, false)">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text>
          <!-- 필터 선택 안내 메시지 -->
          <v-alert
            v-if="selectedGyms.length === 0 && selectedDay.events.length > 0"
            type="info"
            variant="tonal"
            border="start"
            class="mb-3"
            density="comfortable"
          >
            <div class="d-flex align-center">
              <span>암장 필터를 선택하면 일정이 표시됩니다</span>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                @click="showGymFilter = true"
              >
                필터 선택
              </v-btn>
            </div>
          </v-alert>

          <!-- 선택된 필터 정보 표시 -->
          <v-chip-group v-if="selectedGyms.length > 0" class="mb-3">
            <v-chip
              v-for="gym in selectedGyms"
              :key="gym"
              closable
              @click:close="removeGym(gym)"
              color="primary"
              variant="outlined"
              size="small"
            >
              {{ gym }}
            </v-chip>
          </v-chip-group>

          <!-- 필터링된 이벤트 목록 -->
          <v-list lines="two">
            <template v-if="selectedDay.events.length > 0">
              <template v-if="selectedGyms.length > 0">
                <v-list-item
                  v-for="event in getFilteredEvents(selectedDay.events)"
                  :key="event.id"
                  :title="event.name_kr"
                  :subtitle="event.wall_name"
                  @click="showEvent(event)"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="getEventColor(event)" size="small">
                      <v-icon color="white" size="small">
                        {{ getEventIcon(event.type) }}
                      </v-icon>
                    </v-avatar>
                  </template>

                  <template v-slot:append>
                    <v-chip :color="getEventColor(event)" size="x-small" label>
                      {{ getEventTypeLabel(event.type) }}
                    </v-chip>
                  </template>
                </v-list-item>

                <v-list-item
                  v-if="getFilteredEvents(selectedDay.events).length === 0"
                >
                  <div class="text-center py-4 text-body-2">
                    선택한 암장의 일정이 없습니다
                  </div>
                </v-list-item>
              </template>

              <v-list-item v-else>
                <div class="text-center py-4 text-body-2">
                  표시할 암장을 선택해주세요
                </div>
              </v-list-item>
            </template>

            <v-list-item v-else>
              <div class="text-center py-4 text-body-2">
                등록된 일정이 없습니다
              </div>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 일정 상세 다이얼로그 - 모바일 대응 -->
    <v-dialog
      v-model="eventDialog"
      :fullscreen="isMobile"
      max-width="400"
      transition="dialog-bottom-transition"
    >
      <v-card v-if="selectedEvent">
        <v-toolbar :color="getEventColor(selectedEvent)">
          <v-btn v-if="isMobile" icon @click="eventDialog = false" class="mr-2">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title>{{ selectedEvent.name_kr }}</v-toolbar-title>
          <template #append>
            <v-btn v-if="!isMobile" icon @click="eventDialog = false">
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
          <v-btn
            color="primary"
            variant="text"
            @click="editEvent(selectedEvent)"
          >
            수정
          </v-btn>
          <v-btn color="error" variant="text" @click="deleteEvent">
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 다이얼로그 추가 -->
    <schedule-repeat-form
      v-model="repeatFormDialog"
      :brands="brands"
      :loading="loading"
      @create="createRepeatSchedules"
    />

    <!-- 일정 추가/수정 다이얼로그 -->
    <schedule-form
      v-model="formDialog"
      :brands="brands"
      :edit-mode="editMode"
      :edit-data="selectedEvent"
      :add-date="addDate"
      :loading="loading"
      :fullscreen="isMobile"
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
import { ref, computed, onMounted, watch } from "vue";
import { useDisplay } from "vuetify";
import ScheduleForm from "~/components/ScheduleForm.vue";
import ScheduleRepeatForm from "@/components/ScheduleRepeatForm.vue";

// Vuetify 반응형 디스플레이 사용
const { mobile, xs, width } = useDisplay();
const isMobile = computed(() => mobile.value || xs.value);

// 상태 관리
const loading = ref(false);
const currentDate = ref(new Date());
const eventDialog = ref(false);
const formDialog = ref(false);
const dayEventsDialog = ref(false); // 모바일용 날짜별 이벤트 목록
const selectedEvent = ref(null);
const selectedDay = ref(null); // 선택된 날짜 정보
const schedules = ref([]);
const brands = ref([]);
const editMode = ref(false);
const addDate = ref(null);

// 암장 필터 관련 state 추가
const showGymFilter = ref(false);
const selectedGyms = ref([]);

// 스낵바 상태
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

// 전체 일정에서 고유한 암장 목록 추출
const uniqueGyms = computed(() => {
  if (!schedules.value || schedules.value.length === 0) return [];

  // 중복 제거된 암장 이름 배열 반환
  const gyms = [
    ...new Set(schedules.value.map((schedule) => schedule.brand_name)),
  ];
  return gyms.sort(); // 알파벳 순으로 정렬
});

// 시간대 관련 유틸리티 함수
function getKoreanDate(date) {
  // 입력된 date를 'Asia/Seoul' 시간대 기준으로 변환
  return new Date(
    new Date(date).toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
}

function getLocalISOString(date) {
  const koreanDate = getKoreanDate(date);
  const year = koreanDate.getFullYear();
  const month = String(koreanDate.getMonth() + 1).padStart(2, "0");
  const day = String(koreanDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const firstDay = getKoreanDate(new Date(year, month, 1));
  const lastDay = getKoreanDate(new Date(year, month + 1, 0));

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
  const d1 = getKoreanDate(date1);
  const d2 = getKoreanDate(date2);

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

// 필터링된 이벤트만 반환하는 함수
function getFilteredEvents(events) {
  if (!events || events.length === 0) return [];

  // 선택된 암장이 없으면 모든 이벤트를 숨김
  if (selectedGyms.value.length === 0) return [];

  // 선택된 암장의 이벤트만 필터링
  return events.filter((event) =>
    selectedGyms.value.includes(event.brand_name)
  );
}

// 필터 초기화 함수
function clearGymFilter() {
  selectedGyms.value = [];
}

// 특정 암장 필터 제거 함수
function removeGym(gym) {
  selectedGyms.value = selectedGyms.value.filter((g) => g !== gym);
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

function getEventIcon(type) {
  switch (type) {
    case "SETTING":
      return "mdi-calendar-plus";
    case "REMOVAL":
      return "mdi-calendar-remove";
    case "EVENT":
      return "mdi-calendar-star";
    case "CLOSED":
      return "mdi-calendar-blank";
    default:
      return "mdi-calendar";
  }
}

function getEventColorHex(event) {
  switch (event.type) {
    case "SETTING":
      return "#4caf50"; // success 컬러의 hex 값
    case "REMOVAL":
      return "#f44336"; // error 컬러의 hex 값
    case "EVENT":
      return "#2196f3"; // info 컬러의 hex 값
    case "CLOSED":
      return "#9e9e9e"; // grey 컬러의 hex 값
    default:
      return "#1976d2"; // primary 컬러의 hex 값
  }
}

function formatDate(dateStr) {
  const koreanDate = getKoreanDate(new Date(dateStr));
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

// 셀 클릭 처리 - 모바일과 데스크탑 구분
function cellClick(day) {
  if (isMobile.value) {
    // 모바일에서 필터가 선택되지 않았고 이벤트가 있으면 필터 메뉴를 열도록 유도
    if (selectedGyms.value.length === 0 && day.events.length > 0) {
      showGymFilter.value = true;
      return;
    }

    selectedDay.value = day;
    dayEventsDialog.value = true;
  } else if (day.events.length === 0) {
    openAddDialog({ date: day.date }, false);
  }
}

// 이벤트 핸들러들
function showEvent(event) {
  selectedEvent.value = event;
  eventDialog.value = true;
  // 모바일에서 날짜별 이벤트 목록 다이얼로그 닫기
  if (isMobile.value) {
    dayEventsDialog.value = false;
  }
}

function openAddDialog(date = null, edit = false) {
  selectedEvent.value = null;
  editMode.value = edit;

  if (date && date.date) {
    addDate.value = date.date;
  }

  formDialog.value = true;

  // 모바일에서 날짜별 이벤트 목록 다이얼로그 닫기
  if (isMobile.value && dayEventsDialog.value) {
    dayEventsDialog.value = false;
  }
}

function editEvent(event) {
  selectedEvent.value = event;
  editMode.value = true;
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
    if (selectedEvent.value && selectedEvent.value.id) {
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

    // 모바일에서 날짜별 이벤트 목록 다이얼로그 갱신
    if (isMobile.value && selectedDay.value && dayEventsDialog.value) {
      selectedDay.value.events = getEventsForDate(selectedDay.value.date);
    }
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

// 반복 일정 관련
const repeatFormDialog = ref(false);

function openRepeatDialog() {
  repeatFormDialog.value = true;
}

async function createRepeatSchedules(repeatData) {
  try {
    loading.value = true;
    let currentDate = new Date(repeatData.startDate);

    // 반복 횟수만큼 일정 생성
    for (let cycle = 0; cycle < repeatData.repeatCount; cycle++) {
      // 일정 생성
      await $fetch("/api/schedules", {
        method: "POST",
        body: {
          brand_name: repeatData.brand_name,
          name_kr: repeatData.name_kr,
          wall_name: repeatData.wall_name,
          type: repeatData.type,
          date: getLocalISOString(currentDate),
          description: repeatData.description || null,
        },
      });

      // 다음 날짜 계산
      if (repeatData.repeatType === "days") {
        currentDate.setDate(
          currentDate.getDate() + Number(repeatData.repeatValue)
        );
      } else {
        currentDate = getNextSelectedWeekday(
          currentDate,
          repeatData.selectedWeekdays
        );
      }
    }

    showSnackbar("반복 일정이 생성되었습니다.");
    await fetchSchedules();
    repeatFormDialog.value = false;
  } catch (error) {
    console.error("Error creating schedules:", error);
    showSnackbar("일정 생성에 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

function getNextSelectedWeekday(currentDate, selectedWeekdays) {
  const nextDate = new Date(currentDate);
  let found = false;
  while (!found) {
    nextDate.setDate(nextDate.getDate() + 1);
    if (selectedWeekdays.includes(nextDate.getDay())) {
      found = true;
    }
  }
  return nextDate;
}

// 초기 데이터 로드
onMounted(() => {
  Promise.all([fetchSchedules(), fetchBrands()]);
});
</script>
<style scoped>
.calendar-title {
  flex: 0 0 auto;
  font-size: 1rem;
}

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
  padding: 8px 4px;
  text-align: center;
  font-weight: bold;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.85rem;
}

.calendar-body {
  display: flex;
  flex-direction: column;
}

.calendar-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  min-height: 80px;
}

.calendar-cell {
  padding: 4px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  position: relative;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: background-color 0.2s;
}

.calendar-cell:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.calendar-cell:last-child {
  border-right: none;
}

.date-number {
  text-align: center;
  margin-bottom: 4px;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.outside-month {
  background: rgb(var(--v-theme-surface-variant), 0.5);
  .date-number {
    color: rgba(var(--v-theme-on-surface), 0.38);
  }
}

.today .date-number {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 4px;
}

.weekend {
  color: #f03e3e;
}

.has-events {
  position: relative;
}

.mobile-event-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
}

.events-container {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: calc(100% - 32px);
  overflow-y: auto;
}

.event-chip {
  width: 100%;
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface-variant));
  height: auto;
  font-size: 0.7rem;
}

.event-content {
  width: 100%;
  white-space: normal;
  word-break: break-word;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 스크롤바 스타일링 */
.events-container::-webkit-scrollbar {
  width: 3px;
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

/* 모바일 이벤트 미리보기 스타일 */
.mobile-events-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 20px;
}

.mobile-event-item {
  padding: 2px 4px;
  border-radius: 4px;
  min-height: 18px;
  width: 100%;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.mobile-event-text {
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  text-align: center;
}

.wall-name {
  font-weight: 500;
}

.more-events {
  text-align: center;
  font-size: 0.65rem;
  margin-top: 2px;
  color: #666;
}

.no-filter-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 18px;
}

/* 반응형 조정을 위한 미디어 쿼리 */
@media (max-width: 600px) {
  .calendar-title {
    font-size: 0.875rem;
  }

  .calendar-row {
    min-height: 60px;
  }

  .calendar-header-cell {
    padding: 4px 2px;
    font-size: 0.75rem;
  }

  .calendar-cell {
    padding: 2px;
  }

  .date-number {
    font-size: 0.75rem;
  }

  .today .date-number {
    width: 20px;
    height: 20px;
  }

  .mobile-event-item {
    margin: 1px 0;
  }
}
</style>
