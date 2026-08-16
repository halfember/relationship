<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="brand-mark">与</div>
      <h1>与你桌面版</h1>
      <p>在小程序“我的”中生成一次性连接码</p>
      <t-form class="login-form" @submit="submit">
        <t-form-item label="连接码">
          <t-input v-model="code" autocomplete="one-time-code" :maxlength="8" placeholder="8 位连接码" clearable />
        </t-form-item>
        <t-button theme="primary" type="submit" block :loading="submitting">登录</t-button>
      </t-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { setAccessToken } from '@/auth/session'
import { desktopAuthApi } from '@/api/api'

const route = useRoute()
const router = useRouter()
const code = ref('')
const submitting = ref(false)

async function submit() {
  const normalizedCode = code.value.trim().toUpperCase()
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(normalizedCode)) {
    MessagePlugin.warning('请输入 8 位连接码')
    return
  }
  submitting.value = true
  try {
    const session = await desktopAuthApi.login(normalizedCode)
    setAccessToken(session.accessToken)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/dashboard'
    await router.replace(redirect)
  } catch {
    MessagePlugin.error('连接码无效或已过期，请在小程序重新生成')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:#f5f6f3;color:#202522}.login-panel{width:min(420px,100%);padding:36px 34px;border:1px solid #dfe2dd;border-radius:8px;background:#fff}.brand-mark{width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:#315c4d;color:#fff;font-size:24px;font-weight:700}.login-panel h1{margin-top:22px;font-size:24px;letter-spacing:0}.login-panel p{margin-top:7px;color:#7d8580;font-size:14px}.login-form{margin-top:28px}.login-form :deep(.t-form__label){font-size:14px}.login-form :deep(.t-button){height:42px;margin-top:8px}
</style>
