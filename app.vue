<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <!-- <v-app-bar-title>Wallert</v-app-bar-title> -->
      <!-- nav -->
      <!-- <v-spacer></v-spacer> -->
      <v-btn to="/">홈</v-btn>
      <v-btn to="/schedule">일정</v-btn>
      <v-btn to="/brands">암장</v-btn>
      <v-btn to="/calendar">달력</v-btn>
    </v-app-bar>
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>
