const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = {
  storyFiles: [], styleFiles: [], previewUrls: { story: [], style: [] },
  apiReady: false, connectionMode: "direct", activePasteTarget: "story",
  currentPayload: null, currentResult: null, historyId: null, selectedHistory: null,
  currentFolderPath: "",
  qaPollToken: 0,
  chatMessages: [], historyPromptDismissed: sessionStorage.getItem("historyPromptDismissed") === "1",
};
const elements = {
  storyText: $("#storyText"), styleText: $("#styleText"), storyHelper: $("#storyHelper"), taskRule: $("#taskRule"),
  storyFiles: $("#storyFiles"), styleFiles: $("#styleFiles"), storyPreview: $("#storyPreview"), stylePreview: $("#stylePreview"),
  pasteStory: $("#pasteStory"), pasteStyle: $("#pasteStyle"), pasteToast: $("#pasteToast"),
  taskType: $("#taskType"), taskOptions: $$('[data-task-value]'), run: $("#runButton"), apiBadge: $("#apiBadge"),
  executionHint: $("#executionHint"), progress: $("#runProgress"), progressLabel: $("#progressLabel"), progressBar: $("#progressBar"),
  result: $("#resultSection"), output: $("#output"), outputV1: $("#outputV1"), copy: $("#copyButton"), copyV1: $("#copyV1Button"), qaList: $("#qaList"), qaCount: $("#qaCount"), qaIssues: $("#qaIssues"),
  resultStatus: $("#resultStatus"), v1Status: $("#v1Status"), retryQa: $("#retryQaButton"), sourceVersion: $("#sourceVersion"),
  sdStatus: $("#sdStatus"), styleStatus: $("#styleStatus"), modelStatus: $("#modelStatus"), sdTrace: $("#sdTrace"), styleTrace: $("#styleTrace"),
  errorPanel: $("#errorPanel"), errorText: $("#errorText"),
  apiModal: $("#apiModal"), apiBackdrop: $("#apiBackdrop"), closeApiModal: $("#closeApiModal"), apiKeyInput: $("#apiKeyInput"), toggleApiKey: $("#toggleApiKey"),
  saveApiKey: $("#saveApiKey"), clearApiKey: $("#clearApiKey"), apiSetupMessage: $("#apiSetupMessage"), apiDialogTitle: $("#apiDialogTitle"), apiDialogDescription: $("#apiDialogDescription"), apiKeyLabel: $("#apiKeyLabel"),
  chooseHistory: $("#chooseHistory"), openHistory: $("#openHistory"), historyLocation: $("#historyLocation"), historyModal: $("#historyModal"), historySetupModal: $("#historySetupModal"), setupHistory: $("#setupHistory"),
  historyPathInput: $("#historyPathInput"), historySetupMessage: $("#historySetupMessage"),
  browseFolders: $("#browseFolders"), folderBrowser: $("#folderBrowser"), folderRoots: $("#folderRoots"), folderUp: $("#folderUp"), currentFolder: $("#currentFolder"), folderList: $("#folderList"), useCurrentFolder: $("#useCurrentFolder"),
  historySearch: $("#historySearch"), refreshHistory: $("#refreshHistory"), historyList: $("#historyList"), historyDetail: $("#historyDetail"), historyDetailTitle: $("#historyDetailTitle"), historyDetailMeta: $("#historyDetailMeta"),
  loadHistoryInput: $("#loadHistoryInput"), loadHistoryOutput: $("#loadHistoryOutput"), loadHistoryAll: $("#loadHistoryAll"),
  chatMessages: $("#chatMessages"), chatInstruction: $("#chatInstruction"), sendRefine: $("#sendRefine"),
};

function showToast(message, warning = false) {
  elements.pasteToast.textContent = message;
  elements.pasteToast.className = `paste-toast${warning ? " warning" : ""}`;
  elements.pasteToast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { elements.pasteToast.hidden = true; }, 3000);
}

async function fetchJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error("本机工作流服务连接已中断。请关闭当前页面，重新启动 Seedance Workflow 后再试；输入内容仍保留在当前页面中。");
  }
  const data = await response.json().catch(() => ({ error: `服务返回了无效响应（HTTP ${response.status}）` }));
  if (!response.ok) throw new Error(data.error || `请求失败（HTTP ${response.status}）`);
  return data;
}

async function checkService() {
  try {
    const status = await fetchJson("/api/status");
    state.apiReady = Boolean(status.ready); state.connectionMode = status.mode || "direct";
    elements.apiBadge.className = `api-badge ${status.ready ? "ready" : "offline"}`;
    elements.apiBadge.textContent = status.ready ? "OpenAI API 已连接" : "需要配置 API";
    elements.executionHint.textContent = status.ready ? `V${status.version} 本机服务已连接；初版先输出，终版由异步 QA 在后台生成。` : "页面已连接本机服务；请先配置 API。";
  } catch {
    state.apiReady = false; elements.apiBadge.className = "api-badge offline"; elements.apiBadge.textContent = "本机服务未连接";
    elements.executionHint.textContent = "请通过软件启动器打开页面。";
  }
}

function openApiModal() { elements.apiModal.hidden = false; setTimeout(() => elements.apiKeyInput.focus(), 50); }
function closeApiModal() { elements.apiModal.hidden = true; elements.apiKeyInput.value = ""; elements.apiSetupMessage.textContent = ""; }
async function configureApiKey() {
  const apiKey = elements.apiKeyInput.value.trim();
  if (!apiKey) return void (elements.apiSetupMessage.textContent = "请粘贴新创建的 API Key。 ");
  elements.saveApiKey.disabled = true; elements.apiSetupMessage.textContent = "正在验证连接……";
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 55000);
  try {
    const configured = await fetchJson("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }), signal: controller.signal });
    await checkService(); closeApiModal();
    showToast(configured.persisted ? "API 已连接，并由当前系统账户加密保存" : "API 已连接；系统加密存储不可用，仅在本次运行中保留", !configured.persisted);
  } catch (error) { elements.apiSetupMessage.textContent = error.name === "AbortError" ? "连接测试超过 55 秒，请检查网络。" : error.message; }
  finally { clearTimeout(timer); elements.saveApiKey.disabled = false; }
}
async function clearApiKey() {
  elements.clearApiKey.disabled = true;
  try { await fetchJson("/api/config/clear", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); await checkService(); showToast("当前 API 凭据已清除"); }
  catch (error) { elements.apiSetupMessage.textContent = error.message; }
  finally { elements.clearApiKey.disabled = false; }
}

function renderFiles(kind) {
  const files = state[`${kind}Files`], target = elements[`${kind}Preview`];
  state.previewUrls[kind].forEach(URL.revokeObjectURL); state.previewUrls[kind] = []; target.innerHTML = "";
  files.forEach((file, index) => {
    const chip = document.createElement("div"); chip.className = "file-chip";
    const image = document.createElement("img"), url = URL.createObjectURL(file); state.previewUrls[kind].push(url); image.src = url; image.alt = "";
    const label = document.createElement("span"); label.textContent = file.name;
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.ariaLabel = `移除 ${file.name}`;
    remove.onclick = () => { state[`${kind}Files`].splice(index, 1); renderFiles(kind); };
    chip.append(image, label, remove); target.append(chip);
  });
}
function acceptFiles(kind, selected) {
  const valid = [...selected].filter((file) => file?.type?.startsWith("image/"));
  const rejected = [...selected].length - valid.length;
  state[`${kind}Files`].push(...valid); renderFiles(kind);
  if (valid.length) showToast(`已加入 ${valid.length} 张图片，当前共 ${state[`${kind}Files`].length} 张`);
  if (rejected) showToast(`${rejected} 个非图片文件已跳过`, true);
}
function setPasteTarget(kind) { state.activePasteTarget = kind; $$('[data-input-kind]').forEach((card) => card.classList.toggle("active-paste-target", card.dataset.inputKind === kind)); }
function clipboardFile(blob, index = 0) { const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg"); return new File([blob], `剪贴板截图-${Date.now()}-${index + 1}.${ext}`, { type: blob.type }); }
async function pasteFromClipboard(kind) {
  setPasteTarget(kind);
  if (!navigator.clipboard?.read) return showToast("请点击输入区域后按 Ctrl / ⌘ + V", true);
  try {
    const files = [];
    for (const item of await navigator.clipboard.read()) for (const type of item.types.filter((v) => v.startsWith("image/"))) files.push(clipboardFile(await item.getType(type), files.length));
    if (!files.length) return showToast("剪贴板中没有图片", true); acceptFiles(kind, files);
  } catch { showToast("无法直接读取剪贴板，请按 Ctrl / ⌘ + V", true); }
}
function handlePaste(event) {
  const files = [...(event.clipboardData?.items || [])].filter((i) => i.kind === "file" && i.type.startsWith("image/")).map((i, n) => clipboardFile(i.getAsFile(), n));
  if (!files.length) return; event.preventDefault(); const kind = document.activeElement?.closest?.("[data-input-kind]")?.dataset.inputKind || state.activePasteTarget; acceptFiles(kind, files);
}
function setupDropTarget(card) {
  const kind = card.dataset.inputKind;
  ["dragenter", "dragover"].forEach((name) => card.addEventListener(name, (event) => { event.preventDefault(); if ([...event.dataTransfer.items].some((i) => i.kind === "file")) card.classList.add("drag-active"); }));
  ["dragleave", "dragend"].forEach((name) => card.addEventListener(name, (event) => { if (name === "dragleave" && card.contains(event.relatedTarget)) return; card.classList.remove("drag-active"); }));
  card.addEventListener("drop", (event) => { event.preventDefault(); card.classList.remove("drag-active"); setPasteTarget(kind); acceptFiles(kind, event.dataTransfer.files); });
}
const blobToDataUrl = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
async function fileToPayload(file) {
  const original = async () => ({ name: file.name, type: file.type, dataUrl: await blobToDataUrl(file) });
  if (file.type === "image/gif") return original();
  try {
    const bitmap = await createImageBitmap(file), maxDimension = 4096, maxPixels = 12_000_000;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height), Math.sqrt(maxPixels / (bitmap.width * bitmap.height)));
    if (scale === 1 && file.size <= 3 * 1024 * 1024 && ["image/png", "image/jpeg", "image/webp"].includes(file.type)) { bitmap.close(); return original(); }
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d", { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    const compressed = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片压缩失败")), "image/webp", .88));
    return { name: file.name, type: compressed.type, dataUrl: await blobToDataUrl(compressed) };
  } catch { return original(); }
}
async function filesToPayload(files) {
  const result = [];
  for (let index = 0; index < files.length; index += 1) {
    setProgress("route", Math.min(20, 8 + Math.round(((index + 1) / Math.max(1, files.length)) * 12)), `正在处理图片 ${index + 1} / ${files.length}`);
    result.push(await fileToPayload(files[index]));
  }
  return result;
}

function setProgress(stage, percent, label) { elements.progress.hidden = false; elements.progressLabel.textContent = label; elements.progressBar.style.width = `${percent}%`; const order = ["route", "sd", "style", "merge"]; $$('.progress-steps span').forEach((item) => item.classList.toggle("active", order.indexOf(item.dataset.stage) <= order.indexOf(stage))); }
function showError(message) { elements.run.disabled = false; elements.run.querySelector("span").textContent = "重新生成"; elements.progress.hidden = true; elements.result.hidden = true; elements.errorPanel.hidden = false; elements.errorText.textContent = message; elements.errorPanel.scrollIntoView({ behavior: "smooth", block: "center" }); }
function renderChecks(data) {
  elements.qaList.innerHTML = ""; const checks = data.checks || [];
  checks.forEach((check) => { const item = document.createElement("li"); item.className = check.pass ? "pass" : "fail"; const dot = document.createElement("span"); item.append(dot, document.createTextNode(check.label)); elements.qaList.append(item); });
  elements.qaCount.textContent = `${checks.filter((x) => x.pass).length} / ${checks.length}`;
  const perf = data.performance || {};
  const seconds = Number(perf.v0TotalMs || 0) / 1000;
  elements.qaIssues.innerHTML = "<p>本版本已移除模型 QA 环节，结果由 SD / Style 工作流和确定性字段合并器直接输出。</p>";
  elements.qaIssues.innerHTML = `<p>V4.2 \u7eaf V0 \u751f\u6210\u94fe\u8def\uff08\u65e0 QA\uff09\u3002</p><p>V0 \u8017\u65f6\uff1a${seconds.toFixed(2)} \u79d2\uff1bToken\uff1a${Number(perf.inputTokens || 0)} \u8f93\u5165 / ${Number(perf.outputTokens || 0)} \u8f93\u51fa / ${Number(perf.totalTokens || 0)} \u603b\u8ba1\u3002</p>`;
}
function renderResult(data, scroll = true) {
  if (!data || typeof data.finalPrompt !== "string" || !data.finalPrompt.trim()) {
    throw new Error("工作流未返回可用的最终提示词，已停止展示空结果。");
  }
  state.currentResult = data; state.historyId = data.historyId || state.historyId;
  elements.output.value = data.finalPrompt || ""; elements.sdTrace.textContent = data.sdMaster || "—"; elements.styleTrace.textContent = data.styleOutput || "未调用 Style Skill";
  elements.sdStatus.textContent = data.sdMaster ? "已调用" : "沿用"; elements.styleStatus.textContent = data.styleUsed ? "已调用" : "跳过"; elements.modelStatus.textContent = data.model || "—"; renderChecks(data);
  elements.result.hidden = false; elements.errorPanel.hidden = true; elements.run.disabled = false; elements.run.querySelector("span").textContent = "再次生成"; setProgress("merge", 100, "工作流完成");
  if (scroll) elements.result.scrollIntoView({ behavior: "smooth", block: "start" });
}
const qaActiveStates = new Set(["queued", "running", "auditing", "semantic_checking", "conclusion_ready", "repairing", "validating"]);
const qaRetryStates = new Set(["failed", "timeout", "repair_timeout", "repair_failed", "repair_rejected", "v1_rejected"]);

function appendQaParagraph(text, className = "") {
  const paragraph = document.createElement("p");
  if (className) paragraph.className = className;
  paragraph.textContent = text;
  elements.qaIssues.append(paragraph);
}

function qaUsage(job) {
  const usage = job?.usage || job?.performance || {};
  const calls = [...(usage.qaAudit || []), ...(usage.qaRepair || [])];
  const sum = (key) => calls.reduce((total, call) => total + Number(call?.[key] || 0), 0);
  return {
    input: Number(usage.inputTokens || sum("inputTokens")), output: Number(usage.outputTokens || sum("outputTokens")),
    total: Number(usage.totalTokens || sum("totalTokens")), milliseconds: Number(job?.totalQaMs || usage.totalMs || usage.qaTotalMs || 0),
  };
}

function renderQaJob(job, versions = {}) {
  if (!job) return;
  const status = job.status || "queued";
  const usage = qaUsage(job);
  const audit = job.audit || {};
  const reportedIssues = Array.isArray(audit.issues) ? audit.issues : (job.issues || []);
  elements.qaIssues.innerHTML = "";
  elements.retryQa.hidden = !qaRetryStates.has(status);
  if (status === "v1_ready" || status === "completed" || status === "passed") {
    const v1 = versions.v1 || job.version || job.v1;
    if (v1?.prompt) {
      if (state.currentResult?.versions) state.currentResult.versions.v1 = v1;
      elements.outputV1.value = v1.prompt;
      elements.outputV1.disabled = false;
      elements.copyV1.disabled = false;
      elements.sourceVersion.options[1].disabled = false;
      elements.sourceVersion.options[1].textContent = "终版 Prompt（V1）";
    }
    elements.v1Status.className = "version-note ready";
    const changedFromV0 = v1?.changedFromV0 ?? job.changed;
    elements.v1Status.textContent = changedFromV0 === false ? "语义检查通过；终版与初版内容一致，并作为独立版本保留。" : "后台语义检查与定向修复完成；初版仍完整保留。";
    elements.qaCount.textContent = "终版已就绪";
    elements.resultStatus.textContent = "初版与终版均已就绪";
    appendQaParagraph(job.summary || "合理性、一致性和镜头描述检查已完成。");
  } else if (qaActiveStates.has(status)) {
    elements.v1Status.className = "version-note pending";
    elements.v1Status.textContent = status === "queued" ? "初版已输出，终版任务正在排队。" : "初版已输出，后台正在检查并生成终版。";
    elements.qaCount.textContent = "后台运行";
    elements.resultStatus.textContent = "初版已就绪 · 终版后台生成";
    appendQaParagraph(job.message || "正在检查剧情合理性、跨镜一致性与镜头描述质量；不会覆盖初版。", "qa-pending");
  } else {
    elements.v1Status.className = "version-note failed";
    elements.v1Status.textContent = "终版任务未完成；初版仍可正常使用。";
    elements.qaCount.textContent = "终版未生成";
    elements.resultStatus.textContent = "初版可用 · 终版任务未完成";
    appendQaParagraph(job.error || job.message || "后台 QA 未能生成安全的终版，请重试。", "qa-error");
  }
  if (audit.summary) appendQaParagraph(`语义检查结论：${audit.summary}`);
  reportedIssues.forEach((issue) => {
    const location = issue.shotId && issue.shotId !== "global" ? issue.shotId : "全局";
    appendQaParagraph(`${location}：${issue.problem || issue.message || "需要语义完善"}`);
  });
  if (usage.total || usage.milliseconds) {
    const auditCalls = (job.performance?.qaAudit || []).length;
    const repairCalls = (job.performance?.qaRepair || []).length;
    const elapsed = usage.milliseconds < 10 ? "少于 0.01 秒" : `${(usage.milliseconds / 1000).toFixed(2)} 秒`;
    const tokenText = usage.total > 0 ? `${usage.input} 输入 / ${usage.output} 输出 / ${usage.total} 总计` : "模型未返回用量";
    const auditCallText = auditCalls > 0 ? `${auditCalls} 次` : (qaRetryStates.has(status) ? "未完成" : "未调用");
    const repairCallText = repairCalls > 0 ? `${repairCalls} 次` : (status.startsWith("repair_") ? "未完成" : "未调用");
    appendQaParagraph(`后台终版耗时：${elapsed}；模型调用：语义检查 ${auditCallText}、定向完善 ${repairCallText}；Token：${tokenText}。`);
  }
}

async function pollQaJob(initialJob, token) {
  let job = initialJob;
  let delay = 900;
  while (job?.jobId && qaActiveStates.has(job.status) && token === state.qaPollToken) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (token !== state.qaPollToken) return;
    try {
      const update = await fetchJson(`/api/jobs/${encodeURIComponent(job.jobId)}`);
      if (token !== state.qaPollToken) return;
      job = update.job || update.qaJob || update;
      state.currentResult.qaJob = job;
      if (update.versions) state.currentResult.versions = update.versions;
      renderQaJob(job, state.currentResult.versions || update.versions || {});
      delay = Math.min(3000, Math.round(delay * 1.35));
    } catch (error) {
      if (token !== state.qaPollToken) return;
      elements.v1Status.className = "version-note failed";
      elements.v1Status.textContent = "暂时无法读取终版进度；初版不受影响。";
      elements.retryQa.hidden = false;
      appendQaParagraph(error.message, "qa-error");
      return;
    }
  }
}

function renderChecksV43(data) {
  elements.qaList.innerHTML = "";
  const checks = data.checks || [];
  checks.forEach((check) => {
    const item = document.createElement("li"); item.className = check.pass ? "pass" : "fail";
    item.append(document.createElement("span"), document.createTextNode(check.label)); elements.qaList.append(item);
  });
  elements.qaCount.textContent = `${checks.filter((x) => x.pass).length} / ${checks.length}`;
  const perf = data.performance || {};
  elements.qaIssues.innerHTML = "";
  appendQaParagraph(`初版耗时：${(Number(perf.v0TotalMs || 0) / 1000).toFixed(2)} 秒；Token：${Number(perf.inputTokens || 0)} 输入 / ${Number(perf.outputTokens || 0)} 输出 / ${Number(perf.totalTokens || 0)} 总计。`);
}

function renderResultV43(data, scroll = true) {
  const v0Prompt = data?.versions?.v0?.prompt || data?.finalPrompt;
  if (!data || typeof v0Prompt !== "string" || !v0Prompt.trim()) throw new Error("服务未返回可用的初版 Prompt。");
  state.qaPollToken += 1;
  const pollToken = state.qaPollToken;
  state.currentResult = data; state.historyId = data.historyId || state.historyId;
  elements.output.value = v0Prompt; elements.output.disabled = false;
  const v1Prompt = data.versions?.v1?.prompt || "";
  elements.outputV1.value = v1Prompt; elements.outputV1.disabled = !v1Prompt; elements.copyV1.disabled = !v1Prompt;
  elements.sourceVersion.value = "v0"; elements.sourceVersion.options[1].disabled = !v1Prompt;
  elements.sourceVersion.options[1].textContent = v1Prompt ? "终版 Prompt（V1）" : "终版 Prompt（V1，生成中）";
  elements.resultStatus.textContent = "初版已就绪 · 终版后台生成";
  elements.sdTrace.textContent = data.sdMaster || "—"; elements.styleTrace.textContent = data.styleOutput || "未调用 Style Skill";
  elements.sdStatus.textContent = data.sdMaster ? "已调用" : "异常"; elements.styleStatus.textContent = data.styleUsed ? "已调用" : "跳过"; elements.modelStatus.textContent = data.model || "—";
  renderChecksV43(data); renderQaJob(data.qaJob, data.versions || {});
  elements.result.hidden = false; elements.errorPanel.hidden = true; elements.run.disabled = false; elements.run.querySelector("span").textContent = "再次生成"; setProgress("merge", 100, "初版已生成，终版在后台处理");
  if (scroll) elements.result.scrollIntoView({ behavior: "smooth", block: "start" });
  if (data.qaJob?.jobId && qaActiveStates.has(data.qaJob.status)) pollQaJob(data.qaJob, pollToken);
}

// V4.3 keeps the legacy call sites while replacing their renderer behavior.
renderChecks = renderChecksV43;
renderResult = renderResultV43;

async function buildInputPayload() {
  const storyImages = await filesToPayload(state.storyFiles);
  const styleImages = await filesToPayload(state.styleFiles);
  return { taskType: elements.taskType.value, storyText: elements.storyText.value.trim(), styleText: elements.styleText.value.trim(), storyImages, styleImages };
}
async function runWorkflow() {
  if (!elements.storyText.value.trim() && !state.storyFiles.length) return showError("请输入剧情 / 分镜文字，或加入至少一张图片。");
  if (!state.apiReady) return openApiModal();
  elements.run.disabled = true; elements.run.querySelector("span").textContent = "执行中…"; elements.result.hidden = true; elements.errorPanel.hidden = true; setProgress("route", 8, "整理输入与图片");
  let waitTicker = null;
  try {
    state.currentPayload = await buildInputPayload(); setProgress("sd", 25, "SD Skill 正在生成母版");
    const startedAt = Date.now();
    waitTicker = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      const minutes = Math.floor(seconds / 60), remainder = String(seconds % 60).padStart(2, "0");
      setProgress(seconds > 90 ? "merge" : "sd", Math.min(92, 28 + Math.floor(seconds / 12)), `后台工作流正在执行 · 已等待 ${minutes ? `${minutes}分${remainder}秒` : `${seconds}秒`} · 请不要关闭窗口`);
    }, 5000);
    const data = await fetchJson("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state.currentPayload) });
    state.chatMessages = []; renderChat(); renderResult(data); await refreshHistory(false);
  } catch (error) { showError(error.message); }
  finally { if (waitTicker) clearInterval(waitTicker); }
}

function escapeHtml(text) { const node = document.createElement("div"); node.textContent = text; return node.innerHTML; }
function renderChat() {
  const visibleMessages = state.chatMessages.filter((message) => message.role !== "user");
  elements.chatMessages.innerHTML = visibleMessages.length ? "" : state.chatMessages.length
    ? '<div class="chat-empty">正在处理本轮修改要求…</div>'
    : '<div class="chat-empty">可以说“只修改第三个镜头的运镜，其他内容保持不变”。</div>';
  visibleMessages.forEach((message) => { const bubble = document.createElement("div"); bubble.className = `chat-message ${message.role}`; bubble.textContent = message.content; elements.chatMessages.append(bubble); });
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}
async function refinePrompt() {
  const instruction = elements.chatInstruction.value.trim(); if (!instruction || !state.currentResult) return;
  if (!state.apiReady) return openApiModal();
  const originalPrompt = elements.output.value.trim(); state.chatMessages.push({ role: "user", content: instruction }); renderChat(); elements.chatInstruction.value = ""; elements.sendRefine.disabled = true; elements.sendRefine.querySelector("span").textContent = "加工中…";
  try {
    const context = { ...(state.currentPayload || {}), styleOutput: state.currentResult.styleOutput || "", sdMaster: state.currentResult.sdMaster || "" };
    const data = await fetchJson("/api/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPrompt: originalPrompt, instruction, context, messages: state.chatMessages, historyId: state.historyId }) });
    state.chatMessages.push({ role: "assistant", content: "本轮加工已完成；本版本未调用 QA Agent。" });
    data.sdMaster = state.currentResult.sdMaster; data.styleOutput = state.currentResult.styleOutput; data.styleUsed = state.currentResult.styleUsed; renderChat(); renderResult(data, false); await refreshHistory(false);
  } catch (error) { state.chatMessages.push({ role: "assistant", content: `加工失败：${error.message}` }); renderChat(); }
  finally { elements.sendRefine.disabled = false; elements.sendRefine.querySelector("span").textContent = "发送并加工"; }
}

async function refinePromptV43() {
  const instruction = elements.chatInstruction.value.trim();
  if (!instruction || !state.currentResult) return;
  if (!state.apiReady) return openApiModal();
  const useV1 = elements.sourceVersion.value === "v1" && Boolean(state.currentResult.versions?.v1?.prompt);
  const sourceVersion = useV1 ? state.currentResult.versions.v1 : state.currentResult.versions?.v0;
  const originalPrompt = useV1 ? elements.outputV1.value.trim() : elements.output.value.trim();
  state.chatMessages.push({ role: "user", content: instruction }); renderChat(); elements.chatInstruction.value = "";
  elements.sendRefine.disabled = true; elements.sendRefine.querySelector("span").textContent = "加工中…";
  try {
    const context = { ...(state.currentPayload || {}), styleOutput: state.currentResult.styleOutput || "", sdMaster: state.currentResult.sdMaster || "" };
    const data = await fetchJson("/api/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPrompt: originalPrompt, sourceVersionId: sourceVersion?.versionId || "", instruction, context, messages: state.chatMessages, historyId: state.historyId }) });
    state.chatMessages.push({ role: "assistant", content: "新的初版已生成，终版正在后台进行语义检查。" });
    renderChat(); renderResultV43(data, false); await refreshHistory(false);
  } catch (error) { state.chatMessages.push({ role: "assistant", content: `加工失败：${error.message}` }); renderChat(); }
  finally { elements.sendRefine.disabled = false; elements.sendRefine.querySelector("span").textContent = "发送并加工"; }
}
refinePrompt = refinePromptV43;

async function copyPrompt(text, successMessage, target) {
  try { await navigator.clipboard.writeText(text); showToast(successMessage); }
  catch {
    target.focus(); target.select();
    if (document.execCommand("copy")) showToast(successMessage);
    else showToast("复制失败，请在文本框中按 Ctrl / ⌘ + C。", true);
  }
}

async function retryQa() {
  const jobId = state.currentResult?.qaJob?.jobId;
  if (!jobId) return;
  elements.retryQa.disabled = true;
  elements.qaIssues.innerHTML = "";
  appendQaParagraph("正在重新运行终版任务；初版 Prompt 不受影响。", "qa-pending");
  try {
    const update = await fetchJson(`/api/jobs/${encodeURIComponent(jobId)}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const job = update.job || update.qaJob || update;
    state.currentResult.qaJob = job;
    if (update.versions) state.currentResult.versions = update.versions;
    state.qaPollToken += 1;
    renderQaJob(job, state.currentResult.versions || {});
    pollQaJob(job, state.qaPollToken);
  } catch (error) {
    elements.qaIssues.innerHTML = "";
    appendQaParagraph(error.message, "qa-error");
  }
  finally { elements.retryQa.disabled = false; }
}

function dataUrlToFile(image) { const [head, body] = image.dataUrl.split(",", 2), type = image.type || head.match(/data:([^;]+)/)?.[1] || "image/png"; const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0)); return new File([bytes], image.name || "history-image", { type }); }
async function checkHistoryConfig(prompt = true) {
  try {
    const config = await fetchJson("/api/history/config"); elements.historyLocation.textContent = config.configured ? config.root : "尚未选择存储目录";
    if (config.configured) elements.historyPathInput.value = config.root;
    if (prompt && !config.configured && !state.historyPromptDismissed) elements.historySetupModal.hidden = false;
    return config;
  } catch { return { configured: false }; }
}
async function loadFolderBrowser(path = "") {
  elements.folderList.innerHTML = '<div class="folder-empty">正在读取文件夹……</div>';
  try {
    const data = await fetchJson(`/api/fs/directories?path=${encodeURIComponent(path)}`);
    state.currentFolderPath = data.current || "";
    elements.currentFolder.textContent = data.isRootList ? "选择一个磁盘或常用位置" : data.current;
    elements.folderUp.disabled = data.isRootList || !data.parent;
    elements.folderUp.dataset.parent = data.parent || "";
    elements.useCurrentFolder.disabled = data.isRootList || !data.current;
    elements.folderList.innerHTML = "";
    if (!data.directories.length) elements.folderList.innerHTML = '<div class="folder-empty">当前目录没有可进入的子文件夹。</div>';
    data.directories.forEach((directory) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "folder-item"; button.textContent = `▸ ${directory.name}`; button.title = directory.path;
      button.onclick = () => loadFolderBrowser(directory.path); elements.folderList.append(button);
    });
    if (data.truncated) elements.historySetupMessage.textContent = "该目录子文件夹较多，仅显示前 500 个；也可以直接输入完整路径。";
  } catch (error) {
    elements.folderList.innerHTML = `<div class="folder-empty">${escapeHtml(error.message)}</div>`;
    elements.useCurrentFolder.disabled = true;
  }
}
function openHistorySetup() {
  elements.historySetupMessage.className = "api-setup-message";
  elements.historySetupMessage.textContent = "请浏览本机文件夹，或直接输入完整路径。";
  elements.historySetupModal.hidden = false;
  checkHistoryConfig(false).then(() => elements.historyPathInput.focus());
}
async function saveHistoryPath() {
  const path = elements.historyPathInput.value.trim();
  if (!path) { elements.historySetupMessage.className = "api-setup-message error"; elements.historySetupMessage.textContent = "请输入本地文件夹路径。"; return; }
  elements.setupHistory.disabled = true; elements.historySetupMessage.className = "api-setup-message"; elements.historySetupMessage.textContent = "正在验证并保存目录……";
  try {
    const result = await fetchJson("/api/history/location/set", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) });
    elements.historyPathInput.value = result.root; elements.historySetupModal.hidden = true; state.historyPromptDismissed = false; sessionStorage.removeItem("historyPromptDismissed");
    await checkHistoryConfig(false); await refreshHistory(false); showToast("历史记录目录已启用");
  } catch (error) { elements.historySetupMessage.className = "api-setup-message error"; elements.historySetupMessage.textContent = error.message; }
  finally { elements.setupHistory.disabled = false; }
}
async function refreshHistory(showModal = true) {
  try {
    const config = await checkHistoryConfig(false); if (!config.configured) { if (showModal) elements.historySetupModal.hidden = false; return; }
    const data = await fetchJson(`/api/history?q=${encodeURIComponent(elements.historySearch.value.trim())}`); elements.historyList.innerHTML = "";
    if (!data.records.length) elements.historyList.innerHTML = '<div class="history-empty">没有匹配的历史记录。</div>';
    data.records.forEach((record) => { const button = document.createElement("button"); button.type = "button"; button.className = "history-item"; button.innerHTML = `<strong>${escapeHtml(record.title)}</strong><small>${new Date(record.createdAt * 1000).toLocaleString()} · ${record.taskType === "optimize" ? "提示词优化" : "生成新提示词"} · ${record.revisionCount} 次加工</small>`; button.onclick = () => selectHistory(record.id); elements.historyList.append(button); });
    if (showModal) elements.historyModal.hidden = false;
  } catch (error) {
    elements.historyList.innerHTML = `<div class="history-empty">${escapeHtml(error.message)}</div>`;
    if (showModal) elements.historyModal.hidden = false;
  }
}
async function selectHistory(id) {
  try {
    const data = await fetchJson(`/api/history/${encodeURIComponent(id)}`); state.selectedHistory = data.record; elements.historyDetail.hidden = false; elements.historyDetailTitle.textContent = (data.record.storyText || "图片输入记录").replace(/\n/g, " ").slice(0, 100); elements.historyDetailMeta.textContent = `${new Date(data.record.createdAt * 1000).toLocaleString()} · ${(data.record.images?.story?.length || 0) + (data.record.images?.style?.length || 0)} 张图片 · ${(data.record.revisions || []).length} 次加工`;
  } catch (error) {
    state.selectedHistory = null; elements.historyDetail.hidden = true; elements.historyList.innerHTML = `<div class="history-empty">${escapeHtml(error.message)}</div>`;
  }
}
function loadSelectedHistory(mode) {
  const record = state.selectedHistory; if (!record) return;
  if (mode !== "output") { elements.storyText.value = record.storyText || ""; elements.styleText.value = record.styleText || ""; selectTaskType(record.taskType || "generate"); state.storyFiles = (record.images?.story || []).map(dataUrlToFile); state.styleFiles = (record.images?.style || []).map(dataUrlToFile); renderFiles("story"); renderFiles("style"); state.currentPayload = { taskType: record.taskType, storyText: record.storyText, styleText: record.styleText, storyImages: record.images?.story || [], styleImages: record.images?.style || [] }; }
  if (mode !== "input") { state.historyId = record.id; const latest = record.result || {}; renderResult(latest); }
  elements.historyModal.hidden = true; showToast(mode === "input" ? "已载入历史输入" : mode === "output" ? "已载入历史输出" : "已载入完整历史记录");
}

function updateTaskMode() { const optimizing = elements.taskType.value === "optimize"; elements.taskRule.textContent = optimizing ? "保留原提示词全部事实，只优化指定范围" : "从剧情或分镜建立完整提示词"; elements.storyHelper.textContent = optimizing ? "粘贴已有提示词，可附加图片作为校准参考。" : "输入剧情、故事或分镜，也可上传角色图、场景图、分镜图。"; }
function selectTaskType(value) { if (!["generate", "optimize"].includes(value)) return; elements.taskType.value = value; elements.taskOptions.forEach((button) => { const selected = button.dataset.taskValue === value; button.classList.toggle("selected", selected); button.setAttribute("aria-checked", String(selected)); }); updateTaskMode(); }

elements.run.onclick = runWorkflow; elements.copy.onclick = async () => {
  try {
    await navigator.clipboard.writeText(elements.output.value); showToast("结果已复制");
  } catch {
    elements.output.focus(); elements.output.select();
    if (document.execCommand("copy")) showToast("结果已复制");
    else showToast("复制失败，请在结果框中按 Ctrl / ⌘ + C", true);
  }
};
elements.copy.onclick = () => copyPrompt(elements.output.value, "初版 Prompt 已复制", elements.output);
elements.copyV1.onclick = () => copyPrompt(elements.outputV1.value, "终版 Prompt 已复制", elements.outputV1);
elements.retryQa.onclick = retryQa;
elements.storyFiles.onchange = (e) => { acceptFiles("story", e.target.files); e.target.value = ""; }; elements.styleFiles.onchange = (e) => { acceptFiles("style", e.target.files); e.target.value = ""; };
elements.pasteStory.onclick = () => pasteFromClipboard("story"); elements.pasteStyle.onclick = () => pasteFromClipboard("style"); document.addEventListener("paste", handlePaste); $$('.drop-target').forEach(setupDropTarget); $$('[data-input-kind]').forEach((card) => card.addEventListener("pointerdown", () => setPasteTarget(card.dataset.inputKind)));
elements.taskOptions.forEach((button) => button.onclick = () => selectTaskType(button.dataset.taskValue));
elements.apiBadge.onclick = openApiModal; elements.apiBackdrop.onclick = closeApiModal; elements.closeApiModal.onclick = closeApiModal; elements.saveApiKey.onclick = configureApiKey; elements.clearApiKey.onclick = clearApiKey; elements.toggleApiKey.onclick = () => { const visible = elements.apiKeyInput.type === "text"; elements.apiKeyInput.type = visible ? "password" : "text"; elements.toggleApiKey.textContent = visible ? "显示" : "隐藏"; };
elements.browseFolders.onclick = () => { elements.folderBrowser.hidden = !elements.folderBrowser.hidden; if (!elements.folderBrowser.hidden) loadFolderBrowser(elements.historyPathInput.value.trim()); };
elements.folderRoots.onclick = () => loadFolderBrowser(""); elements.folderUp.onclick = () => loadFolderBrowser(elements.folderUp.dataset.parent || "");
elements.useCurrentFolder.onclick = () => { if (!state.currentFolderPath) return; elements.historyPathInput.value = state.currentFolderPath; elements.folderBrowser.hidden = true; elements.historySetupMessage.className = "api-setup-message"; elements.historySetupMessage.textContent = "已选中该文件夹，点击“保存此位置”完成设置。"; };
elements.chooseHistory.onclick = openHistorySetup; elements.setupHistory.onclick = saveHistoryPath; elements.openHistory.onclick = () => refreshHistory(true); elements.refreshHistory.onclick = () => refreshHistory(false); elements.historySearch.oninput = () => { clearTimeout(elements.historySearch.timer); elements.historySearch.timer = setTimeout(() => refreshHistory(false), 250); }; $$('[data-close-history]').forEach((button) => button.onclick = () => { elements.historyModal.hidden = true; }); $$('[data-skip-history]').forEach((button) => button.onclick = () => { state.historyPromptDismissed = true; sessionStorage.setItem("historyPromptDismissed", "1"); elements.historySetupModal.hidden = true; });
elements.loadHistoryInput.onclick = () => loadSelectedHistory("input"); elements.loadHistoryOutput.onclick = () => loadSelectedHistory("output"); elements.loadHistoryAll.onclick = () => loadSelectedHistory("all"); elements.sendRefine.onclick = refinePrompt; elements.chatInstruction.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") refinePrompt(); });

function sendHeartbeat() { fetch("/api/heartbeat", { cache: "no-store" }).catch(() => {}); }

selectTaskType("generate"); sendHeartbeat(); setInterval(sendHeartbeat, 10000); checkService(); checkHistoryConfig(true);
