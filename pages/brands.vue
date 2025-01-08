<script setup>
import { ref, onMounted } from "vue";
import BrandForm from "@/components/BrandForm.vue";

const config = useRuntimeConfig();
const dialog = ref(false);
const editMode = ref(false);
const loading = ref(false);
const error = ref(null);
const brands = ref([]);

// 데이터 테이블 헤더
const headers = [
  { title: "한글명", value: "name_kr", sortable: true, width: "180px" },
  // { title: "브랜드명", value: "brand", sortable: true },
  { title: "인스타", value: "name", sortable: true },
  { title: "벽", value: "wall_names", sortable: false },
  { title: "프로필", value: "profile_image", sortable: false },
  // { title: "생성일", value: "created_at", sortable: true },
  {
    title: "Actions",
    value: "actions",
    sortable: false,
    align: "center",
    width: "150px",
  },
];

const form = ref({
  name: "",
  brand: "",
  name_kr: "",
  wall_names: [],
  profile_image: "",
});

async function fetchBrands() {
  try {
    loading.value = true;
    error.value = null;
    const response = await $fetch("/api/brands_info");
    brands.value = response.map((brand) => ({
      ...brand,
      wall_names: JSON.parse(brand.wall_names || "[]"),
    }));
  } catch (err) {
    error.value = "브랜드 정보를 불러오는데 실패했습니다.";
    showSnackbar("브랜드 정보를 불러오는데 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

async function handleSave(brandData) {
  if (editMode.value) {
    await updateBrand(brandData);
  } else {
    await addBrand(brandData);
  }
}

async function addBrand(brandData) {
  try {
    loading.value = true;
    const response = await $fetch("/api/brands_info", {
      method: "POST",
      body: {
        ...brandData,
        wall_names: JSON.stringify(brandData.wall_names),
      },
    });
    brands.value.push({
      ...response,
      wall_names: brandData.wall_names,
    });
    showSnackbar("브랜드가 추가되었습니다.");
    dialog.value = false;
  } catch (err) {
    showSnackbar("브랜드 추가에 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

async function updateBrand(brandData) {
  try {
    loading.value = true;
    const response = await $fetch("/api/brands_info", {
      method: "PUT",
      body: {
        ...brandData,
        wall_names: JSON.stringify(brandData.wall_names),
      },
    });
    const index = brands.value.findIndex((b) => b.name === brandData.name);
    if (index !== -1) {
      brands.value[index] = {
        ...response,
        wall_names: brandData.wall_names,
      };
    }
    showSnackbar("브랜드가 수정되었습니다.");
    dialog.value = false;
  } catch (err) {
    showSnackbar("브랜드 수정에 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

async function deleteBrand(name) {
  try {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    loading.value = true;
    await $fetch(`/api/brands_info?name=${name}`, {
      method: "DELETE",
    });
    brands.value = brands.value.filter((brand) => brand.name !== name);
    showSnackbar("브랜드가 삭제되었습니다.");
  } catch (err) {
    showSnackbar("브랜드 삭제에 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
}

// UI 관련 함수들
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

function showSnackbar(text, color = "success") {
  snackbar.value = {
    show: true,
    text,
    color,
  };
}

function openDialog() {
  editMode.value = false;
  form.value = {
    name: "",
    brand: "",
    name_kr: "",
    wall_names: [],
    profile_image: "",
  };
  dialog.value = true;
}

function editBrand(item) {
  editMode.value = true;
  form.value = { ...item };
  dialog.value = true;
}

function closeModal() {
  dialog.value = false;
  editMode.value = false;
}

onMounted(() => {
  fetchBrands();
});
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>브랜드 관리</span>
        <v-btn
          color="primary"
          @click="openDialog"
          :disabled="loading"
          prepend-icon="mdi-plus"
        >
          브랜드 추가
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-data-table
          :items="brands"
          :headers="headers"
          :loading="loading"
          items-per-page="25"
        >
          <!-- 벽 이름 표시 -->
          <template #item.wall_names="{ item }">
            <v-chip
              v-for="wall in item.wall_names"
              :key="wall"
              size="small"
              color="primary"
              class="mr-1 mb-1"
            >
              {{ wall }}
            </v-chip>
          </template>

          <!-- 프로필 이미지 -->
          <template #item.profile_image="{ item }">
            <v-avatar v-if="item.profile_image" size="40">
              <v-img
                :src="`https://${config.public.imagePath}/${item.name}/${item.profile_image}.jpg`"
              />
            </v-avatar>
            <span v-else>-</span>
          </template>

          <!-- 날짜 포맷팅 -->
          <template #item.created_at="{ item }">
            {{ new Date(item.created_at).toLocaleDateString("ko-KR") }}
          </template>

          <!-- 액션 버튼 -->
          <template #item.actions="{ item }">
            <v-btn
              color="primary"
              size="small"
              class="mr-2"
              :disabled="loading"
              @click="editBrand(item)"
              icon
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              color="error"
              size="small"
              :disabled="loading"
              @click="deleteBrand(item.name)"
              icon
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 브랜드 폼 다이얼로그 -->
    <brand-form
      v-model="dialog"
      :editMode="editMode"
      :loading="loading"
      @save="handleSave"
      @update:modelValue="closeModal"
      :editData="form"
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
