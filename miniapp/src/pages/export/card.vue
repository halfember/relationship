<template>
  <view class="card-page">
    <!-- 预览区 -->
    <view class="preview-section">
      <!-- 卡片 Canvas 容器 -->
      <canvas
        canvas-id="exportCanvas"
        id="exportCanvas"
        class="export-canvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      />
    </view>

    <!-- 操作区 -->
    <view class="action-section">
      <button class="action-btn save-btn" @tap="saveToAlbum" :disabled="!cardReady || saving" :loading="saving">
        保存到相册
      </button>
      <button class="action-btn share-btn" @tap="doShare" v-if="false">
        <!-- 微信限制，暂不可用 -->
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import { onLoad, onReady } from '@dcloudio/uni-app';
import { exportApi } from '@/api/export.js';

const relationId = ref(0);
const exportData = ref(null);
const saving = ref(false);
const pageReady = ref(false);
const cardReady = ref(false);

// Canvas 尺寸：375 x 667 (iPhone 6/7/8 比例)
const canvasWidth = ref(375);
const canvasHeight = ref(667);

onLoad((options) => {
  relationId.value = Number(options.relationId);
  if (!relationId.value) return uni.showToast({ title: '关系参数无效', icon: 'none' });
  fetchData();
});
onReady(() => { pageReady.value = true; tryDraw(); });

const tryDraw = () => {
  if (!pageReady.value || !exportData.value) return;
  nextTick(() => drawCard());
};

/** 获取导出数据 */
const fetchData = async () => {
  try {
    exportData.value = await exportApi.relationship(relationId.value);
    tryDraw();
  } catch (e) {
    uni.showToast({ title: e?.message || '数据加载失败', icon: 'none' });
  }
};

/** 绘制卡片到 Canvas */
const drawCard = () => {
  const data = exportData.value;
  if (!data) return;

  // 获取系统信息计算缩放
  const sysInfo = uni.getSystemInfoSync();
  const pixelRatio = sysInfo.pixelRatio || 2;
  const screenWidth = sysInfo.windowWidth;
  const scale = screenWidth / 375;

  canvasWidth.value = 375;
  canvasHeight.value = 667;

  const ctx = uni.createCanvasContext('exportCanvas');
  const W = 375;
  const H = 667;

  // ===== 背景 =====
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#315c4d');
  bgGrad.addColorStop(0.3, '#315c4d');
  bgGrad.addColorStop(0.6, '#c76755');
  bgGrad.addColorStop(1, '#d6a84f');
  ctx.setFillStyle(bgGrad);
  ctx.fillRect(0, 0, W, H);

  // ===== 白色内容区域 =====
  // 圆角矩形
  drawRoundRect(ctx, 16, 120, W - 32, H - 148, 20, '#fff');

  // ===== 顶部标题 =====
  ctx.setFillStyle('#fff');
  ctx.setFontSize(15);
  ctx.setTextAlign('center');
  ctx.fillText('📋 关 系 总 结', W / 2, 50);

  ctx.setFontSize(11);
  ctx.setFillStyle('rgba(255,255,255,0.7)');
  ctx.fillText('用数据回顾你们的点点滴滴', W / 2, 76);

  // ===== 关系名 + 类型 =====
  const rel = data.relationship;
  ctx.setFillStyle('#303833');
  ctx.setFontSize(22);
  ctx.fillText(`${rel.emoji} ${rel.name}`, W / 2, 158);

  ctx.setFontSize(13);
  ctx.setFillStyle('#315c4d');
  ctx.fillText(rel.type, W / 2, 182);

  // ===== 统计卡片 =====
  const statsY = 208;
  const stats = data.stats;

  // 3 个统计小卡片
  const statCards = [
    { label: '纪念日', value: stats.totalEvents, unit: '个' },
    { label: '回忆', value: stats.totalMemories, unit: '条' },
    { label: '相伴', value: stats.daysSinceCreate, unit: '天' },
  ];

  statCards.forEach((sc, i) => {
    const sx = 32 + i * 108;
    drawRoundRect(ctx, sx, statsY, 98, 70, 12, '#f7f7f5');
    ctx.setFillStyle('#315c4d');
    ctx.setFontSize(24);
    ctx.fillText(`${sc.value}`, sx + 49, statsY + 32);
    ctx.setFillStyle('#8b918d');
    ctx.setFontSize(11);
    ctx.fillText(sc.label, sx + 49, statsY + 52);
  });

  // ===== 分隔线 =====
  ctx.setStrokeStyle('#e2e5e0');
  ctx.setLineWidth(0.5);
  ctx.beginPath();
  ctx.moveTo(40, 298);
  ctx.lineTo(W - 40, 298);
  ctx.stroke();

  // ===== 纪念日预览 =====
  let cursorY = 322;
  ctx.setFillStyle('#303833');
  ctx.setFontSize(14);
  ctx.setTextAlign('left');
  ctx.fillText('📅 纪念日', 40, cursorY);

  cursorY += 24;

  const events = data.upcomingEvents.length > 0
    ? data.upcomingEvents
    : data.recentPastEvents;

  if (events.length === 0) {
    ctx.setFillStyle('#9ca29e');
    ctx.setFontSize(12);
    ctx.fillText('暂无纪念日', 40, cursorY);
    cursorY += 30;
  } else {
    events.forEach((ev) => {
      const d = new Date(ev.eventDate);
      const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      const daysStr = ev.daysUntil >= 0
        ? `${ev.daysUntil}天后`
        : `${Math.abs(ev.daysUntil)}天前`;

      // 圆点
      ctx.setFillStyle(ev.daysUntil >= 0 ? '#315c4d' : '#9ca29e');
      ctx.beginPath();
      ctx.arc(46, cursorY - 4, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.setFillStyle('#303833');
      ctx.setFontSize(13);
      ctx.fillText(`${ev.title}`, 56, cursorY);

      ctx.setFillStyle('#8b918d');
      ctx.setFontSize(10);
      ctx.fillText(dateStr, 56, cursorY + 16);

      ctx.setFillStyle(ev.daysUntil >= 0 ? '#315c4d' : '#9ca29e');
      ctx.setTextAlign('right');
      ctx.fillText(daysStr, W - 40, cursorY + 6);
      ctx.setTextAlign('left');

      cursorY += 36;
    });
  }

  // ===== 分隔线 =====
  cursorY += 8;
  ctx.setStrokeStyle('#e2e5e0');
  ctx.beginPath();
  ctx.moveTo(40, cursorY);
  ctx.lineTo(W - 40, cursorY);
  ctx.stroke();
  cursorY += 20;

  // ===== 回忆预览 =====
  ctx.setFillStyle('#303833');
  ctx.setFontSize(14);
  ctx.fillText('📸 最近的回忆', 40, cursorY);
  cursorY += 24;

  const memories = data.recentMemories;
  if (memories.length === 0) {
    ctx.setFillStyle('#9ca29e');
    ctx.setFontSize(12);
    ctx.fillText('暂无回忆记录', 40, cursorY);
    cursorY += 30;
  } else {
    memories.slice(0, 3).forEach((m) => {
      ctx.setFillStyle('#737a75');
      ctx.setFontSize(12);
      const lines = wrapText(ctx, m.content || '无文字', W - 80, 1);
      ctx.fillText(lines, 40, cursorY);

      const md = new Date(m.memoryDate);
      ctx.setFillStyle('#929894');
      ctx.setFontSize(10);
      ctx.fillText(
        `${md.getFullYear()}/${md.getMonth() + 1}/${md.getDate()}`,
        40,
        cursorY + 16,
      );

      cursorY += 34;
    });
  }

  // ===== 底部 =====
  ctx.setFillStyle('#315c4d');
  ctx.setFontSize(11);
  ctx.setTextAlign('center');
  ctx.fillText('与你AI · 用心经营每一段关系', W / 2, H - 32);

  ctx.setFillStyle('#929894');
  ctx.setFontSize(9);
  const today = new Date();
  ctx.fillText(
    `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()} 生成`,
    W / 2,
    H - 16,
  );

  ctx.draw(false, () => {
    cardReady.value = true;
    console.log('卡片绘制完成');
  });
};

/** 绘制圆角矩形 */
const drawRoundRect = (ctx, x, y, w, h, r, color) => {
  ctx.setFillStyle(color);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();
};

/** 文字截断 / 换行 */
const wrapText = (ctx, text, maxWidth, maxLines = 1) => {
  if (!text) return '';
  const metrics = { width: 0 };
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += text[i];
    // 近似估算宽度（中文约 12px，英文约 6px）
    const charCode = text.charCodeAt(i);
    const charWidth = charCode > 127 ? 12 : 6;
    metrics.width += charWidth;
    if (metrics.width > maxWidth) {
      return result.slice(0, -1) + '…';
    }
  }
  return result;
};

/** 保存到相册 */
const saveToAlbum = () => {
  if (!cardReady.value || saving.value) return;
  saving.value = true;
  uni.canvasToTempFilePath({
    canvasId: 'exportCanvas',
    success: (res) => {
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => {
          uni.showToast({ title: '已保存到相册', icon: 'success' });
          saving.value = false;
        },
        fail: (err) => {
          if (err.errMsg.includes('auth deny')) {
            uni.showModal({
              title: '需要相册权限',
              content: '请在设置中允许访问相册',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  uni.openSetting({});
                }
              },
            });
          } else {
            uni.showToast({ title: '保存失败', icon: 'none' });
          }
          saving.value = false;
        },
      });
    },
    fail: () => {
      uni.showToast({ title: '生成图片失败', icon: 'none' });
      saving.value = false;
    },
  });
};
</script>

<style scoped>
.card-page {
  min-height: 100vh;
  background: #f7f7f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 40rpx;
}

.preview-section {
  width: 100%;
  padding: 30rpx 20rpx;
  display: flex;
  justify-content: center;
  background: #edf0ec;
}

.export-canvas {
  border-radius: 12rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.15);
  background: #fff;
}

.action-section {
  padding: 40rpx 30rpx;
  width: 100%;
  box-sizing: border-box;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  margin-bottom: 20rpx;
}

.save-btn {
  background: #315c4d;
  color: #fff;
}

.share-btn {
  background: #fff;
  color: #315c4d;
  border: 2rpx solid #315c4d;
}
</style>
