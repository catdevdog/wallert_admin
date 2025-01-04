<template>
  <v-dialog v-model="dialog" max-width="500px" persistent @after-enter="onOpen">
    <v-card>
      <v-card-title>{{ editMode ? '일정 수정' : '일정 추가'}}</v-card-title>
      <v-card-text>
        <v-select
          v-model="form.brand_name"
          :items="brands"
          label="Brand"
          item-text="text"
          item-value="value"
          outlined
          @update="form.name_kr = brands.find((brand) => brand.value === form.brand_name).title"
        ></v-select>
        <v-text-field v-model="form.wall_name" label="Wall Name" outlined></v-text-field>
        <v-select
          v-model="form.type"
          :items="['SETTING', 'REMOVAL', 'EVENT']"
          label="Type"
          outlined
        ></v-select>
        
        <div class="date-inputs">
          <v-select
            v-model="form.year"
            :items="years"
            label="Year"
            outlined
          ></v-select>
          <v-select
            v-model="form.month"
            :items="months"
            label="Month"
            outlined
          ></v-select>
          <v-text-field
            v-model="form.day"
            label="Day"
            type="number"
            outlined
          ></v-text-field>
        </div>

        <v-textarea v-model="form.description" label="Description" outlined></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="handleSave">Save</v-btn>
        <v-btn text @click="closeModal">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  brands: Array,    // 부모에서 받은 브랜드 리스트
  editMode: Boolean,
  editData: Object
});

const emit = defineEmits(['update:modelValue', 'save']);

const dialog = ref(false);
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

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

watch(
  () => props.modelValue,
  (value) => {
    dialog.value = value;
  }
);

watch(
  () => form.value.brand_name,
  (value) => {
    if (!value) return;
    form.value.name_kr = props.brands.find((brand) => brand.value === value).title;
  }
)

function handleSave() {
  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formattedDate = `${form.value.year}-${String(form.value.month).padStart(2, '0')}-${String(form.value.day).padStart(2, '0')}`;
  emit('save', { ...form.value, date: formattedDate });
  emit('update:modelValue', false);
}

function closeModal() {
  emit('update:modelValue', false);
};

function onOpen() {
  if (props.editMode) {
    form.value = { ...props.editData };
  }
}
</script>

<style scoped>
.date-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
