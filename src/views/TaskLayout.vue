<template>
  <div>
    <router-view />
  </div>
</template>

<style>
.sub-navbar {
  margin-top: 10px;
  background: #444;
  padding: 5px;
}
.sub-navbar a {
  color: white;
  margin-right: 15px;
  text-decoration: none;
}
.sub-navbar a.router-link-active {
  font-weight: bold;
  border-bottom: 2px solid #ffd700;
}
</style>