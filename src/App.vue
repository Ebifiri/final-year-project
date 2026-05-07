<script setup>
import NavBar from './components/navBar.vue';
import AppFooter from './components/footer.vue';
</script>

<template>
  <NavBar>
    <router-view />
    <AppFooter />
  </NavBar>
</template>

<style scoped></style>
