<template>
  <div class="login-form">
    <h2>{{ $t('auth.login') }}</h2>
    <p v-if="error">{{ $t('auth.error_timeout') }}</p>
    <button @click="reset">{{ $t('auth.reset_password') }}</button>
    <button @click="retry">{{ t('common.retry') }}</button>
    <p>{{ $t('common.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const reset = () => {
  console.log(t('auth.forgot_password'));
};

const retry = () => {
  console.log(i18n.t('common.goodbye'));
};
</script>
