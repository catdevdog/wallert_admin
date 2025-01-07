<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-title>My App</v-app-bar-title>
      <!-- nav -->
      <v-spacer></v-spacer>
      <v-btn to="/">Home</v-btn>
      <v-btn to="/brands">Brands</v-btn>
      <v-btn to="/calendar">Calendar</v-btn>
    </v-app-bar>
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>
