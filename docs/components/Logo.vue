<template>
  <div class="logo-wrapper">
    <div class="logo-icon">
      <SpriteSymbol name="logo" />
    </div>
    <span class="logo-name">blökkli starterkit for Drupal</span>
  </div>
</template>

<script setup></script>
<style lang="postcss">
.logo-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0.25rem;
  width: 3rem;
  height: 3rem;
  background-color: rgb(5 80 230);

  svg {
    color: white;
    fill: white;
  }
}

.logo-wrapper {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.logo-name {
  font-weight: 800;
  font-size: 1.5rem;
  font-family: 'Inter', sans-serif;
}
</style>
