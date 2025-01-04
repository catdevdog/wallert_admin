<script setup>
import { ref, onMounted } from 'vue';
import ScheduleForm from '@/components/ScheduleForm.vue';

const dialog = ref(false);
const editMode = ref(false);
const brands = ref([]); // brands_info 데이터 저장
const schedules = ref([]);
const headers = [
  { title: '인스타', value: 'brand_name' },
  { title: '암장', value: 'name_kr' },
  { title: '벽', value: 'wall_name' },
  { title: '일정', value: 'type' },
  { title: '날짜', value: 'date' },
  { title: '비고', value: 'description'},
  { title: 'Actions', value: 'actions', sortable: false }
];
const form = ref({
  brand_name: '',
  name_kr: '',
  wall_name: '',
  type: '',
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  description: ''
});

async function fetchBrands() {
  // brands_info API 호출
  const response = await $fetch('/api/brands_info');
  brands.value = response.map((brand) => ({
    title: brand.name_kr, // 한글 이름
    value: brand.name      // 브랜드 이름
  }));
}

async function fetchSchedules() {
  // schedules API 호출
  const response = await $fetch('/api/schedules');
  schedules.value = response;
}

async function addSchedule(schedule) {
  // schedules API 호출
  const response = await $fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule)
  });
  schedules.value.push(response);
  dialog.value = false;
}

function openDialog() {
  editMode.value = false;
  form.value = {
    brand_name: '',
    name_kr: '',
    wall_name: '',
    type: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    description: ''
  };
  dialog.value = true;
}

function editSchedule(item) {
  editMode.value = true
  form.value = { ...item };
  dialog.value = true;
}

function closeModal() {
  dialog.value = false;
  editMode.value = false;
}

onMounted(() => {
  fetchBrands();    // 브랜드 데이터 호출
  fetchSchedules(); // 스케줄 데이터 호출
});
</script>

<template>
  <v-container>
    <v-btn color="primary" @click="openDialog">일정 추가</v-btn>
    <v-data-table :items="schedules" :headers="headers">
      <template #item.actions="{ item }">
        <v-btn color="primary" @click="editSchedule(item)">Edit</v-btn>
      </template>
    </v-data-table>

    <schedule-form
      v-model="dialog"
      :brands="brands"
      :editMode="editMode"
      @save="addSchedule"
      @update:modelValue="closeModal"
      :editData="form"
    />
  </v-container>
</template>
