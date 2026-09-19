const fieldIds = ['season', 'day', 'weather', 'task1', 'task2', 'task3', 'bonus'];
const fields = Object.fromEntries(fieldIds.map((id) => [id, document.getElementById(id)]));
const statusBox = document.getElementById('status');
const exportButton = document.getElementById('exportButton');
const downloadLink = document.getElementById('downloadLink');
const finalPreview = document.getElementById('finalPreview');
const previewLoading = document.getElementById('previewLoading');
let previewTimer;

const getFormData = () => ({
  season: fields.season.value.trim(),
  day: fields.day.value.trim(),
  weather: fields.weather.value.trim(),
  taskTexts: [fields.task1.value.trim(), fields.task2.value.trim(), fields.task3.value.trim()],
  bonusText: fields.bonus.value.trim(),
});

const refreshPreview = async () => {
  previewLoading.textContent = '正在保存 content.json 并生成真实预览……';
  previewLoading.classList.remove('hidden');
  try {
    const response = await fetch('/api/preview', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(getFormData()),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '预览失败');
    finalPreview.src = result.previewUrl;
    finalPreview.onload = () => previewLoading.classList.add('hidden');
    statusBox.textContent = '已保存到 content.json，右侧就是视频的真实最终排版。';
  } catch (error) {
    previewLoading.textContent = `预览失败：${error.message}`;
  }
};

const schedulePreview = () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(refreshPreview, 900);
};

const loadDefaults = async () => {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    fields.season.value = data.season;
    fields.day.value = data.day;
    fields.weather.value = data.weather;
    fields.task1.value = data.taskTexts[0];
    fields.task2.value = data.taskTexts[1];
    fields.task3.value = data.taskTexts[2];
    fields.bonus.value = data.bonusText;
    await refreshPreview();
  } catch {
    statusBox.textContent = '读取默认文案失败，请关闭窗口后重新一键启动。';
  }
};

for (const field of Object.values(fields)) {
  field.addEventListener('input', schedulePreview);
}

exportButton.addEventListener('click', async () => {
  exportButton.disabled = true;
  clearTimeout(previewTimer);
  downloadLink.classList.add('hidden');
  statusBox.textContent = '正在保存 content.json 并生成视频，通常需要 30–120 秒，请不要关闭窗口……';

  try {
    const response = await fetch('/api/render', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(getFormData()),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '导出失败');
    statusBox.textContent = `导出成功：${result.fileName}`;
    downloadLink.href = result.downloadUrl;
    downloadLink.textContent = '打开 / 下载生成的视频';
    downloadLink.classList.remove('hidden');
  } catch (error) {
    statusBox.textContent = `导出失败：${error.message}`;
  } finally {
    exportButton.disabled = false;
  }
});

loadDefaults();
