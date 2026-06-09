import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type SleepQuality = "良い" | "普通" | "悪い";
type DailyChoice = "晴れ" | "曇り" | "雨" | "雪" | "その他";
type RiskLevel = "低" | "中" | "高";

type DailyRecord = {
  id: string;
  date: string;
  mood: number | null;
  anxiety: number | null;
  irritability: number | null;
  fatigue: number | null;
  sleepHours: number | null;
  sleepQuality: SleepQuality;
  weather: DailyChoice;
  meal: "しっかり食べた" | "普通" | "少ない" | "食べていない";
  exercise: "なし" | "散歩" | "軽い運動" | "筋トレ" | "その他";
  wentOut: "あり" | "なし";
  socialContact: "多い" | "普通" | "少ない" | "なし";
  medicine: "飲んだ" | "飲んでいない" | "該当なし";
  events: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

type SuddenLog = {
  id: string;
  occurredAt: string;
  stateTags: string[];
  stateType?: string;
  intensity: number | null;
  riskLevel?: RiskLevel;
  triggers: string[];
  place: string;
  symptoms: string[];
  thoughts: string;
  actions: string[];
  afterChange: "変わらない" | "少し落ち着いた" | "かなり落ち着いた" | "落ち着かなかった";
  memo: string;
  createdAt: string;
  updatedAt: string;
};

type SelfCareCategory = "体を整える" | "環境を整える" | "思考を整理する" | "人とつながる" | "休む" | "習慣を見直す";
type SelfCareResult = "少し整った" | "変化は少なめ" | "今は合わなかった" | "後で振り返る";

type SelfCarePlan = {
  id: string;
  title: string;
  category: SelfCareCategory;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

type SelfCareLog = {
  id: string;
  planId: string;
  title: string;
  category: SelfCareCategory;
  result: SelfCareResult;
  memo: string;
  createdAt: string;
};

type ConsultationTarget = "doctor" | "counselor" | "family" | "partner" | "friend" | "ai" | "other";
type ConsultationStatus = "draft" | "planned" | "done" | "pending";

type ConsultationNote = {
  id: string;
  title: string;
  target: ConsultationTarget;
  status: ConsultationStatus;
  mainTopic: string;
  recentConcern: string;
  waveMemo: string;
  lifestyleMemo: string;
  dontForgetMemo: string;
  includeInReport: boolean;
  createdAt: string;
  updatedAt: string;
};

type AutoLockMinutes = 1 | 5 | 15 | 30 | 0;

type PrivacySettings = {
  isLockEnabled: boolean;
  passcodeHash: string;
  autoLockMinutes: AutoLockMinutes;
  privateDisplayMode: boolean;
  updatedAt: string;
};

type BackupPrivacySettings = {
  isLockEnabled: boolean;
  autoLockMinutes: AutoLockMinutes;
  privateDisplayMode: boolean;
  passcodeIncluded: false;
  updatedAt: string;
};

type Insight = {
  id: string;
  title: string;
  description: string;
  relatedCount: number;
  action: string;
  note: string;
  group: "daily" | "sudden" | "selfcare";
};

type Screen = "home" | "recordHub" | "daily" | "sudden" | "records" | "review" | "analysis" | "report" | "data" | "selfcare" | "consultation" | "privacy" | "menu" | "about";
type RecordsTab = "daily" | "sudden";
type DetailItem = { kind: "daily"; record: DailyRecord } | { kind: "sudden"; record: SuddenLog };
type PendingDelete = { kind: "daily"; id: string } | { kind: "sudden"; id: string } | { kind: "selfcare"; id: string } | { kind: "consultation"; id: string } | { kind: "all" };
type BackupData = {
  app: {
    name: string;
    version: string;
    exportedAt: string;
  };
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCarePlans: SelfCarePlan[];
  selfCareLogs: SelfCareLog[];
  consultationNotes: ConsultationNote[];
  privacySettings: BackupPrivacySettings;
};

type DraftEnvelope<T> = {
  formType: string;
  data: T;
  updatedAt: string;
};

const dailyStorageKey = "self-compass-daily-records";
const suddenStorageKey = "self-compass-sudden-logs";
const selfCarePlansStorageKey = "selfCarePlans";
const selfCareLogsStorageKey = "selfCareLogs";
const consultationNotesStorageKey = "consultationNotes";
const privacySettingsStorageKey = "privacySettings";
const onboardingCompletedStorageKey = "onboardingCompleted";
const onboardingCompletedAtStorageKey = "onboardingCompletedAt";
const dailyDraftKey = "dailyRecordDraft";
const suddenDraftKey = "suddenLogDraft";
const consultationDraftKey = "consultationNoteDraft";
const selfCareDraftKey = "selfCareDraft";
const appVersion = "1.0.0";

const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();
const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const stateTagOptions = ["不安感", "そわそわ", "いらだち", "涙が出る", "動きにくさ", "焦り", "ひとり感", "考えすぎ", "身体の重さ", "眠気", "食べたい衝動", "自分を責める感覚", "命に関わる考え", "自分を傷つけたい感覚", "その他"];
const triggerOptions = ["仕事", "LINE・メッセージ", "SNS", "家族", "恋人・パートナー", "友人", "体調不良", "睡眠不足", "天気", "お金", "将来への不安", "理由が分からない", "その他"];
const placeOptions = ["自宅", "外", "職場", "車内", "電車", "店", "その他"];
const symptomOptions = ["動悸", "息苦しさ", "胸の圧迫感", "吐き気", "頭痛", "腹痛", "震え", "涙", "だるさ", "その他"];
const actionOptions = ["寝た", "散歩した", "深呼吸した", "入浴した", "誰かに連絡した", "薬を飲んだ", "食べた", "泣いた", "何もしなかった", "その他"];
const supportTags = ["命に関わる考え", "自分を傷つけたい感覚"];
const supportWords = ["死にたい", "消えたい", "自傷", "薬を大量に飲む", "飛び降りる", "首を吊る", "生きていたくない"];
const consultationTargets: ConsultationTarget[] = ["doctor", "counselor", "family", "partner", "friend", "ai", "other"];
const consultationStatuses: ConsultationStatus[] = ["draft", "planned", "done", "pending"];
const selfCareCategories: SelfCareCategory[] = ["体を整える", "環境を整える", "思考を整理する", "人とつながる", "休む", "習慣を見直す"];
const selfCareCandidates: Array<Pick<SelfCarePlan, "title" | "category" | "memo">> = [
  { title: "朝の光を浴びる", category: "体を整える", memo: "窓辺や外で少し光を感じる" },
  { title: "5分だけ外に出る", category: "体を整える", memo: "短い時間で試せる行動" },
  { title: "深呼吸をする", category: "体を整える", memo: "数回だけでも大丈夫" },
  { title: "水を飲む", category: "体を整える", memo: "ひと口から試せます" },
  { title: "軽く体を動かす", category: "体を整える", memo: "肩や首をゆっくり動かす" },
  { title: "散歩する", category: "体を整える", memo: "近所を少し歩く" },
  { title: "入浴する", category: "休む", memo: "湯船でもシャワーでもOK" },
  { title: "早めに休む", category: "休む", memo: "予定を少し軽くする" },
  { title: "スマホから少し離れる", category: "環境を整える", memo: "数分だけ画面から離れる" },
  { title: "部屋を少し整える", category: "環境を整える", memo: "ひとつだけ片づける" },
  { title: "音楽を聴く", category: "環境を整える", memo: "今の状態に合いそうな曲を選ぶ" },
  { title: "紙に書き出す", category: "思考を整理する", memo: "浮かんだことを短く書く" },
  { title: "信頼できる人に連絡する", category: "人とつながる", memo: "短い一言でも大丈夫" },
  { title: "予定を少し減らす", category: "休む", memo: "調整できる予定を見直す" },
  { title: "食事を整える", category: "習慣を見直す", memo: "食べやすいものを選ぶ" },
  { title: "カフェインを控えめにする", category: "習慣を見直す", memo: "合うかどうか記録で見ていく" },
  { title: "何もしない時間を作る", category: "休む", memo: "短い余白を作る" },
];

const draftDefinitions = [
  { key: dailyDraftKey, label: "今日の記録" },
  { key: suddenDraftKey, label: "突発ログ" },
  { key: consultationDraftKey, label: "相談ノート" },
  { key: selfCareDraftKey, label: "カスタムセルフケア" },
];

const onboardingSteps = [
  {
    title: "Self Compassへようこそ",
    body: "Self Compassは、日々の状態や気づきを記録し、自分の傾向をふり返るためのセルフケア記録アプリです。",
  },
  {
    title: "まずは今日の記録から",
    body: "気分、不安感、睡眠、天気、生活の様子などを短く記録できます。すべてを埋める必要はありません。",
  },
  {
    title: "状態の波をあとから見返せます",
    body: "突発ログや日々の記録から、睡眠・天気・外出・セルフケアとの関係を参考情報として確認できます。",
  },
  {
    title: "相談前の整理にも使えます",
    body: "相談ノートや共有用まとめを使うと、医師・カウンセラー・支援者・AIに伝えたいことを整理しやすくなります。",
  },
  {
    title: "記録はこの端末に保存されます",
    body: "記録は現在お使いのブラウザ内に保存されます。端末変更やブラウザデータ削除に備えて、必要に応じてバックアップしてください。",
  },
];

function readStorage<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function readDraft<T>(key: string): DraftEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEnvelope<T>;
    return parsed?.data ? parsed : null;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, formType: string, data: T) {
  const draft: DraftEnvelope<T> = { formType, data, updatedAt: nowIso() };
  localStorage.setItem(key, JSON.stringify(draft));
}

function removeDraft(key: string) {
  localStorage.removeItem(key);
}

function listDrafts() {
  return draftDefinitions.flatMap((definition) => {
    const draft = readDraft<unknown>(definition.key);
    return draft ? [{ key: definition.key, label: definition.label, updatedAt: draft.updatedAt }] : [];
  });
}

function loadDailyRecords() {
  const records = readStorage<Partial<DailyRecord>>(dailyStorageKey).map(normalizeDailyRecord);
  localStorage.setItem(dailyStorageKey, JSON.stringify(records));
  return records;
}

function loadSuddenLogs() {
  const logs = readStorage<Partial<SuddenLog>>(suddenStorageKey).map(normalizeSuddenLog);
  localStorage.setItem(suddenStorageKey, JSON.stringify(logs));
  return logs;
}

function loadSelfCarePlans() {
  const plans = readStorage<Partial<SelfCarePlan>>(selfCarePlansStorageKey).map(normalizeSelfCarePlan);
  localStorage.setItem(selfCarePlansStorageKey, JSON.stringify(plans));
  return plans;
}

function loadSelfCareLogs() {
  const logs = readStorage<Partial<SelfCareLog>>(selfCareLogsStorageKey).map(normalizeSelfCareLog);
  localStorage.setItem(selfCareLogsStorageKey, JSON.stringify(logs));
  return logs;
}

function loadConsultationNotes() {
  const notes = readStorage<Partial<ConsultationNote>>(consultationNotesStorageKey).map(normalizeConsultationNote);
  localStorage.setItem(consultationNotesStorageKey, JSON.stringify(notes));
  return notes;
}

function loadPrivacySettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(privacySettingsStorageKey) || "{}") as Partial<PrivacySettings>;
    const settings = normalizePrivacySettings(parsed);
    localStorage.setItem(privacySettingsStorageKey, JSON.stringify(settings));
    return settings;
  } catch {
    const settings = defaultPrivacySettings();
    localStorage.setItem(privacySettingsStorageKey, JSON.stringify(settings));
    return settings;
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>(loadDailyRecords);
  const [suddenLogs, setSuddenLogs] = useState<SuddenLog[]>(loadSuddenLogs);
  const [selfCarePlans, setSelfCarePlans] = useState<SelfCarePlan[]>(loadSelfCarePlans);
  const [selfCareLogs, setSelfCareLogs] = useState<SelfCareLog[]>(loadSelfCareLogs);
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>(loadConsultationNotes);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(loadPrivacySettings);
  const [isLocked, setIsLocked] = useState(() => loadPrivacySettings().isLockEnabled);
  const [editingDaily, setEditingDaily] = useState<DailyRecord | null>(null);
  const [editingSudden, setEditingSudden] = useState<SuddenLog | null>(null);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
  const [loggingPlan, setLoggingPlan] = useState<SelfCarePlan | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(onboardingCompletedStorageKey) !== "true");
  const [onboardingMode, setOnboardingMode] = useState<"initial" | "guide">("initial");
  const [activeFormDirty, setActiveFormDirty] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (!privacySettings.isLockEnabled || privacySettings.autoLockMinutes === 0 || isLocked) return;
    let timer = window.setTimeout(() => setIsLocked(true), privacySettings.autoLockMinutes * 60000);
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIsLocked(true), privacySettings.autoLockMinutes * 60000);
    };
    ["pointerdown", "keydown", "touchstart"].forEach((eventName) => window.addEventListener(eventName, resetTimer));
    return () => {
      window.clearTimeout(timer);
      ["pointerdown", "keydown", "touchstart"].forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [privacySettings.isLockEnabled, privacySettings.autoLockMinutes, isLocked]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && privacySettings.isLockEnabled) setIsLocked(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [privacySettings.isLockEnabled]);

  const savePrivacySettings = (settings: PrivacySettings) => {
    setPrivacySettings(settings);
    localStorage.setItem(privacySettingsStorageKey, JSON.stringify(settings));
  };

  const updatePrivacySettings = (settings: PrivacySettings) => {
    savePrivacySettings(settings);
    setFlash("プライバシー設定を更新しました");
  };

  const lockApp = () => {
    if (privacySettings.isLockEnabled) {
      setIsLocked(true);
      setFlash("");
    } else {
      setScreen("privacy");
      setFlash("パスコードを設定するとロックを使えます");
    }
  };

  const saveDaily = (record: DailyRecord) => {
    const isEditing = dailyRecords.some((item) => item.id === record.id);
    const next = isEditing
      ? dailyRecords.map((item) => (item.id === record.id ? record : item))
      : [record, ...dailyRecords];
    setDailyRecords(next);
    localStorage.setItem(dailyStorageKey, JSON.stringify(next));
    localStorage.removeItem(dailyDraftKey);
    setActiveFormDirty(false);
    setEditingDaily(null);
    setFlash(isEditing ? "日々の記録を更新しました" : "今日の記録を保存しました");
    setScreen(isEditing ? "records" : "home");
  };

  const saveSudden = (log: SuddenLog) => {
    const isEditing = suddenLogs.some((item) => item.id === log.id);
    const next = isEditing
      ? suddenLogs.map((item) => (item.id === log.id ? log : item))
      : [log, ...suddenLogs];
    setSuddenLogs(next);
    localStorage.setItem(suddenStorageKey, JSON.stringify(next));
    localStorage.removeItem(suddenDraftKey);
    setActiveFormDirty(false);
    setEditingSudden(null);
    setFlash(isEditing ? "突発ログを更新しました" : "突発ログを保存しました");
    setScreen(isEditing ? "records" : "home");
  };

  const saveSelfCarePlan = (plan: SelfCarePlan) => {
    const isEditing = selfCarePlans.some((item) => item.id === plan.id);
    const next = isEditing ? selfCarePlans.map((item) => (item.id === plan.id ? plan : item)) : [plan, ...selfCarePlans];
    setSelfCarePlans(next);
    localStorage.setItem(selfCarePlansStorageKey, JSON.stringify(next));
    setFlash(isEditing ? "マイプランを更新しました" : "マイプランに追加しました");
  };

  const deleteSelfCarePlan = (id: string) => {
    const next = selfCarePlans.filter((plan) => plan.id !== id);
    setSelfCarePlans(next);
    localStorage.setItem(selfCarePlansStorageKey, JSON.stringify(next));
    setPendingDelete(null);
    setFlash("マイプランから削除しました");
  };

  const saveSelfCareLog = (log: SelfCareLog) => {
    const next = [log, ...selfCareLogs];
    setSelfCareLogs(next);
    localStorage.setItem(selfCareLogsStorageKey, JSON.stringify(next));
    setLoggingPlan(null);
    setFlash("セルフケアの記録を保存しました");
  };

  const saveConsultationNote = (note: ConsultationNote) => {
    const isEditing = consultationNotes.some((item) => item.id === note.id);
    const next = isEditing ? consultationNotes.map((item) => (item.id === note.id ? note : item)) : [note, ...consultationNotes];
    setConsultationNotes(next);
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify(next));
    localStorage.removeItem(consultationDraftKey);
    setActiveFormDirty(false);
    setFlash(isEditing ? "相談メモを更新しました" : "相談メモを保存しました");
  };

  const updateConsultationStatus = (id: string, status: ConsultationStatus) => {
    const next = consultationNotes.map((note) => note.id === id ? { ...note, status, updatedAt: nowIso() } : note);
    setConsultationNotes(next);
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify(next));
    setFlash(status === "done" ? "相談済みにしました" : "相談メモを更新しました");
  };

  const deleteConsultationNote = (id: string) => {
    const next = consultationNotes.filter((note) => note.id !== id);
    setConsultationNotes(next);
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify(next));
    setPendingDelete(null);
    setFlash("相談メモを削除しました");
  };

  const deleteDaily = (id: string) => {
    const next = dailyRecords.filter((record) => record.id !== id);
    setDailyRecords(next);
    localStorage.setItem(dailyStorageKey, JSON.stringify(next));
    setDetailItem(null);
    setPendingDelete(null);
    setFlash("日々の記録を削除しました");
  };

  const deleteSudden = (id: string) => {
    const next = suddenLogs.filter((log) => log.id !== id);
    setSuddenLogs(next);
    localStorage.setItem(suddenStorageKey, JSON.stringify(next));
    setDetailItem(null);
    setPendingDelete(null);
    setFlash("突発ログを削除しました");
  };

  const importBackup = (backup: BackupData) => {
    setDailyRecords(backup.dailyRecords);
    setSuddenLogs(backup.suddenLogs);
    setSelfCarePlans(backup.selfCarePlans);
    setSelfCareLogs(backup.selfCareLogs);
    setConsultationNotes(backup.consultationNotes);
    const nextPrivacy = normalizeImportedPrivacySettings(backup.privacySettings, privacySettings);
    setPrivacySettings(nextPrivacy);
    localStorage.setItem(dailyStorageKey, JSON.stringify(backup.dailyRecords));
    localStorage.setItem(suddenStorageKey, JSON.stringify(backup.suddenLogs));
    localStorage.setItem(selfCarePlansStorageKey, JSON.stringify(backup.selfCarePlans));
    localStorage.setItem(selfCareLogsStorageKey, JSON.stringify(backup.selfCareLogs));
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify(backup.consultationNotes));
    localStorage.setItem(privacySettingsStorageKey, JSON.stringify(nextPrivacy));
    setPendingImport(null);
    setDetailItem(null);
    setFlash("バックアップを読み込みました");
    setScreen("data");
  };

  const deleteAllData = () => {
    setDailyRecords([]);
    setSuddenLogs([]);
    setSelfCarePlans([]);
    setSelfCareLogs([]);
    setConsultationNotes([]);
    const nextPrivacy = { ...privacySettings, privateDisplayMode: false, updatedAt: nowIso() };
    setPrivacySettings(nextPrivacy);
    localStorage.setItem(dailyStorageKey, JSON.stringify([]));
    localStorage.setItem(suddenStorageKey, JSON.stringify([]));
    localStorage.setItem(selfCarePlansStorageKey, JSON.stringify([]));
    localStorage.setItem(selfCareLogsStorageKey, JSON.stringify([]));
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify([]));
    localStorage.setItem(privacySettingsStorageKey, JSON.stringify(nextPrivacy));
    setPendingDelete(null);
    setDetailItem(null);
    setFlash("保存されている記録を削除しました");
    setScreen("data");
  };

  const openDaily = () => {
    setFlash("");
    setEditingDaily(dailyRecords.find((record) => record.date === today()) || null);
    setScreen("daily");
  };

  const confirmNavigation = () => {
    if (!activeFormDirty) return true;
    return window.confirm("まだ保存していない内容があります。移動しますか？");
  };

  const moveToScreen = (nextScreen: Screen) => {
    if (!confirmNavigation()) return;
    setActiveFormDirty(false);
    setFlash("");
    setScreen(nextScreen);
  };

  const openSudden = () => {
    setFlash("");
    setEditingSudden(null);
    setScreen("sudden");
  };

  const openRecords = () => {
    setFlash("");
    setScreen("records");
  };

  const openAnalysis = () => {
    setFlash("");
    setScreen("analysis");
  };

  const openReport = () => {
    setFlash("");
    setScreen("report");
  };

  const openConsultation = () => {
    setFlash("");
    setScreen("consultation");
  };

  const openData = () => {
    setFlash("");
    setScreen("data");
  };

  const openPrivacy = () => {
    setFlash("");
    setScreen("privacy");
  };

  const openGuide = () => {
    setFlash("");
    setOnboardingMode("guide");
    setShowOnboarding(true);
  };

  const openAbout = () => {
    setFlash("");
    setScreen("about");
  };

  const closeOnboarding = (markCompleted: boolean) => {
    if (markCompleted) {
      localStorage.setItem(onboardingCompletedStorageKey, "true");
      localStorage.setItem(onboardingCompletedAtStorageKey, nowIso());
    }
    setShowOnboarding(false);
    setOnboardingMode("initial");
    setScreen("home");
  };

  if (isLocked && privacySettings.isLockEnabled) {
    return <LockScreen settings={privacySettings} onUnlock={() => setIsLocked(false)} />;
  }

  if (showOnboarding) {
    return <OnboardingGuide mode={onboardingMode} onClose={() => closeOnboarding(onboardingMode === "initial")} />;
  }

  return (
    <div className="app-shell">
      <main className="screen">
        {screen === "home" && (
          <Home
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            selfCarePlans={selfCarePlans}
            selfCareLogs={selfCareLogs}
            consultationNotes={consultationNotes}
            privateDisplayMode={privacySettings.privateDisplayMode}
            flash={flash}
            onCareDone={setLoggingPlan}
            onConsultation={openConsultation}
            onLock={lockApp}
            onDaily={openDaily}
            onSudden={openSudden}
          />
        )}
        {screen === "recordHub" && (
          <RecordHub
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            onDaily={openDaily}
            onSudden={openSudden}
            onRecords={openRecords}
          />
        )}
        {screen === "daily" && <DailyForm key={editingDaily?.id || "new-daily"} initial={editingDaily} onSave={saveDaily} onCancel={() => moveToScreen("home")} onDirtyChange={setActiveFormDirty} />}
        {screen === "sudden" && <SuddenForm key={editingSudden?.id || "new-sudden"} initial={editingSudden} onSave={saveSudden} onCancel={() => moveToScreen("home")} onDirtyChange={setActiveFormDirty} />}
        {screen === "records" && (
          <RecordsScreen
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            privateDisplayMode={privacySettings.privateDisplayMode}
            flash={flash}
            onDetail={setDetailItem}
            onEditDaily={(record) => {
              setFlash("");
              setEditingDaily(record);
              setScreen("daily");
            }}
            onEditSudden={(log) => {
              setFlash("");
              setEditingSudden(log);
              setScreen("sudden");
            }}
            onDeleteDaily={(id) => setPendingDelete({ kind: "daily", id })}
            onDeleteSudden={(id) => setPendingDelete({ kind: "sudden", id })}
          />
        )}
        {screen === "review" && (
          <ReviewHub
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            selfCareLogs={selfCareLogs}
            onAnalysis={openAnalysis}
            onReport={openReport}
            onConsultation={openConsultation}
          />
        )}
        {screen === "analysis" && <Analysis dailyRecords={dailyRecords} suddenLogs={suddenLogs} selfCareLogs={selfCareLogs} />}
        {screen === "report" && <Report dailyRecords={dailyRecords} suddenLogs={suddenLogs} selfCareLogs={selfCareLogs} consultationNotes={consultationNotes} onOpenConsultation={openConsultation} />}
        {screen === "selfcare" && (
          <SelfCareScreen
            plans={selfCarePlans}
            logs={selfCareLogs}
            flash={flash}
            onSavePlan={saveSelfCarePlan}
            onDeletePlan={(id) => setPendingDelete({ kind: "selfcare", id })}
            onCareDone={setLoggingPlan}
            onDirtyChange={setActiveFormDirty}
          />
        )}
        {screen === "consultation" && (
          <ConsultationScreen
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            selfCareLogs={selfCareLogs}
            notes={consultationNotes}
            flash={flash}
            onSave={saveConsultationNote}
            onDelete={(id) => setPendingDelete({ kind: "consultation", id })}
            onMarkDone={(id) => updateConsultationStatus(id, "done")}
            privateDisplayMode={privacySettings.privateDisplayMode}
            onDirtyChange={setActiveFormDirty}
          />
        )}
        {screen === "privacy" && (
          <PrivacyScreen
            settings={privacySettings}
            flash={flash}
            onSave={updatePrivacySettings}
            onLock={lockApp}
          />
        )}
        {screen === "menu" && (
          <MenuScreen
            onConsultation={openConsultation}
            onData={openData}
            onPrivacy={openPrivacy}
            onGuide={openGuide}
            onAbout={openAbout}
          />
        )}
        {screen === "about" && <AboutScreen />}
        {screen === "data" && (
          <DataManagement
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            selfCarePlans={selfCarePlans}
            selfCareLogs={selfCareLogs}
            consultationNotes={consultationNotes}
            privacySettings={privacySettings}
            flash={flash}
            onImportRequest={setPendingImport}
            onDeleteAllRequest={() => setPendingDelete({ kind: "all" })}
          />
        )}
      </main>
      {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
      {pendingDelete && (
        <ConfirmDeleteModal
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            if (pendingDelete.kind === "daily") deleteDaily(pendingDelete.id);
            if (pendingDelete.kind === "sudden") deleteSudden(pendingDelete.id);
            if (pendingDelete.kind === "selfcare") deleteSelfCarePlan(pendingDelete.id);
            if (pendingDelete.kind === "consultation") deleteConsultationNote(pendingDelete.id);
            if (pendingDelete.kind === "all") deleteAllData();
          }}
          isAllData={pendingDelete.kind === "all"}
        />
      )}
      {loggingPlan && <SelfCareLogModal plan={loggingPlan} onCancel={() => setLoggingPlan(null)} onSave={saveSelfCareLog} />}
      {pendingImport && (
        <ConfirmImportModal
          onCancel={() => setPendingImport(null)}
          onConfirm={() => importBackup(pendingImport)}
        />
      )}
      <nav className="bottom-nav" aria-label="主要ナビゲーション">
        {[
          ["home", "ホーム"],
          ["recordHub", "記録"],
          ["review", "ふり返り"],
          ["selfcare", "セルフケア"],
          ["menu", "メニュー"],
        ].map(([id, label]) => (
          <button
            className={navGroup(screen) === id ? "active" : ""}
            key={id}
            onClick={() => {
              moveToScreen(id as Screen);
            }}
          >
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function LockScreen({ settings, onUnlock }: { settings: PrivacySettings; onUnlock: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const unlock = async () => {
    const hash = await hashPasscode(passcode);
    if (hash === settings.passcodeHash) {
      setPasscode("");
      setError("");
      onUnlock();
      return;
    }
    setError("パスコードが一致しません。もう一度確認してください。");
  };

  return (
    <main className="lock-screen">
      <section className="lock-card">
        <p className="eyebrow">Self Compass</p>
        <h1>ロック中です</h1>
        <p className="soft-text">これは記録内容を見えにくくするための簡易ロックです。医療情報レベルの完全な保護ではありません。</p>
        {error && <div className="error-message">{error}</div>}
        <label className="field">
          <span>パスコード</span>
          <input
            className="passcode-input"
            inputMode="numeric"
            pattern="[0-9]*"
            type="password"
            minLength={4}
            maxLength={6}
            value={passcode}
            onChange={(event) => setPasscode(onlyDigits(event.target.value).slice(0, 6))}
            onKeyDown={(event) => {
              if (event.key === "Enter") void unlock();
            }}
          />
        </label>
        <button className="primary-btn" onClick={unlock}>ロック解除</button>
      </section>
    </main>
  );
}

function OnboardingGuide({ mode, onClose }: { mode: "initial" | "guide"; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = onboardingSteps[step];
  const isLast = step === onboardingSteps.length - 1;

  return (
    <main className="onboarding-screen">
      <section className="onboarding-card">
        <p className="eyebrow">{mode === "initial" ? "はじめに" : "使い方ガイド"}</p>
        <div className="step-indicator" aria-label={`ステップ ${step + 1} / ${onboardingSteps.length}`}>
          {onboardingSteps.map((item, index) => (
            <span className={index === step ? "active" : ""} key={item.title} />
          ))}
        </div>
        <h1>{current.title}</h1>
        <p className="onboarding-text">{current.body}</p>
        {isLast && (
          <div className="notice compact-notice">
            このアプリは診断・治療・服薬指示を行いません。記録は相談時の参考情報として使えます。
          </div>
        )}
        <div className="onboarding-actions">
          <button className="secondary-btn no-margin" onClick={() => (step > 0 ? setStep(step - 1) : onClose())}>
            {step > 0 ? "戻る" : mode === "initial" ? "スキップ" : "閉じる"}
          </button>
          {isLast ? (
            <button className="primary-btn" onClick={onClose}>{mode === "initial" ? "はじめる" : "ホームへ戻る"}</button>
          ) : (
            <button className="primary-btn" onClick={() => setStep(step + 1)}>次へ</button>
          )}
        </div>
      </section>
    </main>
  );
}

function PrivacyScreen({ settings, flash, onSave, onLock }: { settings: PrivacySettings; flash: string; onSave: (settings: PrivacySettings) => void; onLock: () => void }) {
  const [newPasscode, setNewPasscode] = useState("");
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [changePasscode, setChangePasscode] = useState("");
  const [disablePasscode, setDisablePasscode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDisable, setConfirmDisable] = useState(false);

  const clearInputs = () => {
    setNewPasscode("");
    setCurrentPasscode("");
    setChangePasscode("");
    setDisablePasscode("");
  };

  const validatePasscode = (value: string) => /^\d{4,6}$/.test(value);

  const setPasscode = async () => {
    setError("");
    if (!validatePasscode(newPasscode)) {
      setError("パスコードは4〜6桁の数字で入力してください。");
      return;
    }
    onSave({ ...settings, isLockEnabled: true, passcodeHash: await hashPasscode(newPasscode), updatedAt: nowIso() });
    clearInputs();
    setMessage("パスコードを設定しました");
  };

  const changeCurrentPasscode = async () => {
    setError("");
    if (!validatePasscode(changePasscode)) {
      setError("新しいパスコードは4〜6桁の数字で入力してください。");
      return;
    }
    if ((await hashPasscode(currentPasscode)) !== settings.passcodeHash) {
      setError("現在のパスコードが一致しません。もう一度確認してください。");
      return;
    }
    onSave({ ...settings, isLockEnabled: true, passcodeHash: await hashPasscode(changePasscode), updatedAt: nowIso() });
    clearInputs();
    setMessage("パスコードを変更しました");
  };

  const disableLock = async () => {
    setError("");
    if ((await hashPasscode(disablePasscode)) !== settings.passcodeHash) {
      setError("パスコードが一致しません。もう一度確認してください。");
      return;
    }
    setConfirmDisable(true);
  };

  const confirmDisableLock = () => {
    onSave({ ...settings, isLockEnabled: false, passcodeHash: "", updatedAt: nowIso() });
    clearInputs();
    setConfirmDisable(false);
    setMessage("簡易ロックを解除しました");
  };

  const updateAutoLock = (label: string) => {
    onSave({ ...settings, autoLockMinutes: autoLockFromLabel(label), updatedAt: nowIso() });
    setMessage("自動ロック時間を更新しました");
  };

  const togglePrivateMode = () => {
    onSave({ ...settings, privateDisplayMode: !settings.privateDisplayMode, updatedAt: nowIso() });
    setMessage(!settings.privateDisplayMode ? "プライベート表示モードをONにしました" : "プライベート表示モードをOFFにしました");
  };

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">表示を守る</p>
          <h1>プライバシー設定</h1>
        </div>
      </header>
      <p className="soft-text">記録内容を開いたままにしないための簡易ロックや、画面表示の保護を設定できます。</p>
      <div className="notice">このロックは、記録内容をすぐに見えないようにするための簡易的な保護機能です。完全な暗号化や医療情報レベルの保護ではありません。</div>
      {flash && <div className="success-message">{flash}</div>}
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <section className="section-block data-card">
        <h2>簡易パスコード</h2>
        <p className="soft-text">{settings.isLockEnabled ? "パスコードが設定されています。" : "4〜6桁の数字でパスコードを設定できます。"}</p>
        {!settings.isLockEnabled ? (
          <>
            <PasscodeField label="新しいパスコード" value={newPasscode} onChange={setNewPasscode} />
            <button className="primary-btn" onClick={setPasscode}>パスコードを設定</button>
          </>
        ) : (
          <>
            <FormSection title="変更">
              <PasscodeField label="現在のパスコード" value={currentPasscode} onChange={setCurrentPasscode} />
              <PasscodeField label="新しいパスコード" value={changePasscode} onChange={setChangePasscode} />
              <button className="primary-btn" onClick={changeCurrentPasscode}>パスコードを変更</button>
            </FormSection>
            <FormSection title="解除">
              <PasscodeField label="現在のパスコード" value={disablePasscode} onChange={setDisablePasscode} />
              <button className="delete-action full-width" onClick={disableLock}>簡易ロックを解除</button>
            </FormSection>
            <button className="secondary-btn no-margin" onClick={onLock}>今すぐロック</button>
          </>
        )}
      </section>

      <section className="section-block data-card">
        <h2>自動ロック</h2>
        <p className="soft-text">操作がない時間が続いたときに、記録画面を閉じてロック画面に戻します。</p>
        <Choice label="自動ロック時間" options={["1分", "5分", "15分", "30分", "自動ロックしない"]} value={autoLockLabel(settings.autoLockMinutes)} onChange={updateAutoLock} />
      </section>

      <section className="section-block data-card">
        <h2>プライベート表示モード</h2>
        <p className="soft-text">ホームの数値、記録一覧や相談ノートの本文プレビューを見えにくくします。</p>
        <button className={settings.privateDisplayMode ? "primary-btn" : "secondary-btn no-margin"} onClick={togglePrivateMode}>
          {settings.privateDisplayMode ? "ONになっています" : "OFFになっています"}
        </button>
      </section>

      {confirmDisable && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <h2>簡易ロックを解除しますか？</h2>
            <p>記録内容は同じ端末・同じブラウザでは表示できる状態になります。必要になったら、また設定できます。</p>
            <div className="confirm-actions">
              <button className="secondary-action" onClick={() => setConfirmDisable(false)}>キャンセル</button>
              <button className="delete-action" onClick={confirmDisableLock}>解除する</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PasscodeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="passcode-input"
        inputMode="numeric"
        pattern="[0-9]*"
        type="password"
        minLength={4}
        maxLength={6}
        value={value}
        onChange={(event) => onChange(onlyDigits(event.target.value).slice(0, 6))}
      />
    </label>
  );
}

function Home({
  dailyRecords,
  suddenLogs,
  selfCarePlans,
  selfCareLogs,
  consultationNotes,
  privateDisplayMode,
  flash,
  onDaily,
  onSudden,
  onConsultation,
  onLock,
  onCareDone,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCarePlans: SelfCarePlan[];
  selfCareLogs: SelfCareLog[];
  consultationNotes: ConsultationNote[];
  privateDisplayMode: boolean;
  flash: string;
  onDaily: () => void;
  onSudden: () => void;
  onConsultation: () => void;
  onLock: () => void;
  onCareDone: (plan: SelfCarePlan) => void;
}) {
  const todayRecord = dailyRecords.find((record) => record.date === today());
  const todayPlans = selfCarePlans.slice(0, 3);
  const todayInsight = calculateInsights(dailyRecords, suddenLogs, selfCareLogs)[0];
  const openNotes = consultationNotes.filter((note) => note.status !== "done");
  const latestNote = [...consultationNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const showFirstUseHint = dailyRecords.length === 0 && suddenLogs.length === 0;

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">Self Compass</p>
        <h1>今日の状態を、短く残す</h1>
      </header>

      <div className="notice">
        このアプリは診断・治療・服薬指示を行いません。医療機関や専門家への相談の代わりにはなれません。
      </div>
      {flash && <div className="success-message">{flash}</div>}
      {showFirstUseHint && (
        <div className="notice compact-notice">
          まずは今日の記録から始められます。すべてを入力しなくても大丈夫です。
        </div>
      )}

      <section className="status-panel">
        <div>
          <p className="label">今日の記録</p>
          <h2>{todayRecord ? "記録済み" : "まだ未記録"}</h2>
        </div>
        <div className="quick-grid">
          <Metric label="気分" value={privateDisplayMode && todayRecord ? "記録あり" : todayRecord ? formatScore(todayRecord.mood) : "-"} />
          <Metric label="不安" value={privateDisplayMode && todayRecord ? "記録あり" : todayRecord ? formatScore(todayRecord.anxiety) : "-"} />
          <Metric label="睡眠" value={privateDisplayMode && todayRecord ? "記録あり" : todayRecord ? formatSleepHours(todayRecord.sleepHours) : "-"} />
        </div>
      </section>

      <div className="action-stack">
        <button className="secondary-btn no-margin" onClick={onLock}>ロック</button>
        <button className="urgent-btn" onClick={onSudden}>突発ログを記録</button>
        <button className="primary-btn" onClick={onDaily}>今日の記録をする</button>
      </div>

      <section className="section-block">
        <h2>今日の気づき</h2>
        {todayInsight ? (
          <article className="mini-insight">
            <strong>{todayInsight.title}</strong>
            <p>{todayInsight.description}</p>
          </article>
        ) : (
          <p className="soft-text">記録が増えると、睡眠・天気・外出などとの関係が見えやすくなります。</p>
        )}
      </section>

      <section className="section-block">
        <h2>今日の小さな一手</h2>
        {todayPlans.length === 0 ? (
          <p className="soft-text">セルフケアから自分に合いそうな行動を追加できます。</p>
        ) : (
          <div className="mini-plan-list">
            {todayPlans.map((plan) => (
              <article className="mini-plan" key={plan.id}>
                <div>
                  <strong>{plan.title}</strong>
                  <span>{plan.category}</span>
                </div>
                <button className="secondary-action" onClick={() => onCareDone(plan)}>できた</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <h2>相談ノート</h2>
        <p className="soft-text">話したいことを少しずつメモしておけます。</p>
        <div className="summary-list">
          <Metric label="未相談メモ" value={`${openNotes.length}件`} />
          <Metric label="直近更新" value={privateDisplayMode && latestNote ? "メモあり" : latestNote ? latestNote.title : "なし"} />
        </div>
        <button className="secondary-btn" onClick={onConsultation}>相談ノートを開く</button>
      </section>

    </section>
  );
}

function RecordHub({ dailyRecords, suddenLogs, onDaily, onSudden, onRecords }: { dailyRecords: DailyRecord[]; suddenLogs: SuddenLog[]; onDaily: () => void; onSudden: () => void; onRecords: () => void }) {
  const todayRecord = dailyRecords.find((record) => record.date === today());
  const recentDaily = [...dailyRecords].sort((a, b) => b.date.localeCompare(a.date))[0];
  const recentSudden = [...suddenLogs].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">残す</p>
          <h1>記録</h1>
        </div>
      </header>
      <p className="soft-text">日々の状態と、急な状態の変化を短く残せます。</p>

      <section className="section-block">
        <h2>記録する</h2>
        <div className="data-actions">
          <button className="primary-btn" onClick={onDaily}>{todayRecord ? "今日の記録を確認・編集" : "今日の記録をする"}</button>
          <button className="urgent-btn" onClick={onSudden}>突発ログを記録</button>
          <button className="secondary-btn no-margin" onClick={onRecords}>記録一覧を見る</button>
        </div>
      </section>

      <section className="section-block">
        <h2>最近の記録</h2>
        <div className="summary-list">
          <Metric label="日々の記録" value={recentDaily ? recentDaily.date : "なし"} />
          <Metric label="突発ログ" value={recentSudden ? formatDateTime(recentSudden.occurredAt) : "なし"} />
        </div>
      </section>
    </section>
  );
}

function ReviewHub({
  dailyRecords,
  suddenLogs,
  selfCareLogs,
  onAnalysis,
  onReport,
  onConsultation,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCareLogs: SelfCareLog[];
  onAnalysis: () => void;
  onReport: () => void;
  onConsultation: () => void;
}) {
  const insight = calculateInsights(dailyRecords, suddenLogs, selfCareLogs)[0];

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">見返す</p>
          <h1>ふり返り</h1>
        </div>
      </header>
      <p className="soft-text">記録から見える傾向や共有用まとめを確認できます。</p>

      <section className="section-block insights-section">
        <h2>記録から見える傾向</h2>
        {insight ? <InsightCard insight={insight} /> : <p className="soft-text">記録が増えると、睡眠・きっかけ・セルフケアとの関係が見えやすくなります。</p>}
      </section>

      <section className="section-block">
        <h2>開く</h2>
        <div className="data-actions">
          <button className="primary-btn" onClick={onAnalysis}>ふり返りを見る</button>
          <button className="secondary-btn no-margin" onClick={onReport}>共有用まとめを作る</button>
          <button className="secondary-btn no-margin" onClick={onConsultation}>相談前まとめを作る</button>
          <button className="secondary-btn no-margin" onClick={onConsultation}>AI相談文を作る</button>
        </div>
      </section>
    </section>
  );
}

function MenuScreen({
  onConsultation,
  onData,
  onPrivacy,
  onGuide,
  onAbout,
}: {
  onConsultation: () => void;
  onData: () => void;
  onPrivacy: () => void;
  onGuide: () => void;
  onAbout: () => void;
}) {
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">設定と管理</p>
          <h1>メニュー</h1>
        </div>
      </header>
      <p className="soft-text">相談メモ、データ出力、表示の保護をまとめています。</p>

      <section className="section-block">
        <h2>開く</h2>
        <div className="data-actions">
          <button className="secondary-btn no-margin" onClick={onConsultation}>相談ノート</button>
          <button className="secondary-btn no-margin" onClick={onData}>データ管理</button>
          <button className="secondary-btn no-margin" onClick={onPrivacy}>プライバシー設定</button>
          <button className="secondary-btn no-margin" onClick={onGuide}>使い方ガイド</button>
          <button className="secondary-btn no-margin" onClick={onAbout}>アプリについて</button>
        </div>
      </section>

      <section className="section-block">
        <h2>ホーム画面に追加</h2>
        <p className="soft-text">スマホでは、ブラウザの共有ボタンから「ホーム画面に追加」を選ぶと、アプリのように起動できます。</p>
      </section>

      <section className="section-block">
        <h2>サポートが必要なとき</h2>
        <p className="soft-text">命に関わる可能性があると感じるときや、一人で抱えるのが難しいと感じるときは、すぐに119番、近くの救急外来、または信頼できる人に連絡してください。このアプリは医療機関や専門家の支援を代わりに行うものではありません。</p>
      </section>
    </section>
  );
}

function AboutScreen() {
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Self Compass</p>
          <h1>アプリについて</h1>
        </div>
      </header>

      <section className="section-block">
        <h2>Self Compassとは</h2>
        <p className="soft-text">Self Compassは、自分の状態を記録し、状態の波や整いやすい行動をふり返るためのセルフケア記録アプリです。</p>
      </section>

      <section className="section-block">
        <h2>このアプリでできること</h2>
        <ul className="soft-list">
          <li>日々の状態を記録する</li>
          <li>突発的な状態の変化を記録する</li>
          <li>記録から見える傾向を確認する</li>
          <li>セルフケアの候補を管理する</li>
          <li>相談前のメモを整理する</li>
          <li>データをバックアップする</li>
        </ul>
      </section>

      <section className="section-block">
        <h2>このアプリでできないこと</h2>
        <ul className="soft-list">
          <li>診断すること</li>
          <li>治療方針を決めること</li>
          <li>薬やサプリの服用を指示すること</li>
          <li>医師や専門家の代わりになること</li>
        </ul>
      </section>

      <section className="section-block">
        <h2>データ保存について</h2>
        <p className="soft-text">記録は現在お使いのブラウザ内に保存されます。共有URLを開いた人同士で記録が共有されるわけではありません。端末やブラウザが変わると記録は引き継がれないため、必要に応じてデータ管理からJSONバックアップを保存してください。</p>
      </section>

      <section className="section-block">
        <h2>サポートが必要なとき</h2>
        <p className="soft-text">命に関わる可能性があると感じるときや、一人で抱えるのが難しいと感じるときは、すぐに119番、近くの救急外来、または信頼できる人に連絡してください。このアプリは医療機関や専門家の支援を代わりに行うものではありません。</p>
      </section>
    </section>
  );
}

function DataManagement({
  dailyRecords,
  suddenLogs,
  selfCarePlans,
  selfCareLogs,
  consultationNotes,
  privacySettings,
  flash,
  onImportRequest,
  onDeleteAllRequest,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCarePlans: SelfCarePlan[];
  selfCareLogs: SelfCareLog[];
  consultationNotes: ConsultationNote[];
  privacySettings: PrivacySettings;
  flash: string;
  onImportRequest: (backup: BackupData) => void;
  onDeleteAllRequest: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState(() => listDrafts());

  const backup: BackupData = {
    app: {
      name: "Self Compass",
      version: appVersion,
      exportedAt: nowIso(),
    },
    dailyRecords,
    suddenLogs,
    selfCarePlans,
    selfCareLogs,
    consultationNotes,
    privacySettings: toBackupPrivacySettings(privacySettings),
  };

  const handleImport = async (file: File | undefined) => {
    setMessage("");
    setError("");
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      setError("JSONファイルを選んでください。");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<BackupData> | Partial<DailyRecord>[] | { daily?: Partial<DailyRecord>[]; sudden?: Partial<SuddenLog>[] };
      const normalized = normalizeBackupData(parsed);
      onImportRequest(normalized);
    } catch {
      setError("バックアップファイルを読み込めませんでした。形式を確認してください。");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const exportDailyCsv = () => {
    if (!dailyRecords.length) {
      setError("出力できる日々の記録がありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`daily-records-${today()}.csv`, toDailyCsv(dailyRecords), "text/csv;charset=utf-8");
    setError("");
    setMessage("日々の記録CSVを作成しました。");
  };

  const exportSuddenCsv = () => {
    if (!suddenLogs.length) {
      setError("出力できる突発ログがありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`sudden-logs-${today()}.csv`, toSuddenCsv(suddenLogs), "text/csv;charset=utf-8");
    setError("");
    setMessage("突発ログCSVを作成しました。");
  };

  const exportSelfCareCsv = () => {
    if (!selfCareLogs.length) {
      setError("出力できるセルフケア記録がありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`self-care-logs-${today()}.csv`, toSelfCareCsv(selfCareLogs), "text/csv;charset=utf-8");
    setError("");
    setMessage("セルフケア記録CSVを作成しました。");
  };

  const exportConsultationCsv = () => {
    if (!consultationNotes.length) {
      setError("出力できる相談メモがありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`consultation-notes-${today()}.csv`, toConsultationCsv(consultationNotes), "text/csv;charset=utf-8");
    setError("");
    setMessage("相談メモCSVを作成しました。");
  };

  const refreshDrafts = () => setDrafts(listDrafts());

  const deleteDraft = (key: string) => {
    if (!window.confirm("途中保存された下書きを削除します。保存済みの記録は削除されません。")) return;
    removeDraft(key);
    refreshDrafts();
    setError("");
    setMessage("下書きを削除しました。");
  };

  const deleteAllDrafts = () => {
    if (!window.confirm("途中保存された下書きを削除します。保存済みの記録は削除されません。")) return;
    draftDefinitions.forEach((draft) => removeDraft(draft.key));
    refreshDrafts();
    setError("");
    setMessage("下書きをまとめて削除しました。");
  };

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">保存と出力</p>
          <h1>データ管理</h1>
        </div>
      </header>
      {flash && <div className="success-message">{flash}</div>}
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <section className="section-block">
        <h2>保存について</h2>
        <p className="soft-text">このアプリの記録は、現在お使いのブラウザ内に保存されます。ブラウザのデータを消したり、端末を変更した場合、記録が失われることがあります。大切な記録は定期的にバックアップしてください。</p>
        <p className="soft-text">共有URLを開いた人同士で記録が共有されるわけではありません。ただし、同じ端末・同じブラウザを使う人には見える可能性があります。必要に応じて、プライバシー設定を利用してください。</p>
        <p className="soft-text">このアプリは診断や治療を行うものではありません。記録は医師や専門家に相談するための参考情報として利用してください。</p>
      </section>

      <section className="section-block data-card">
        <h2>JSONバックアップ</h2>
        <p className="soft-text">日々の記録、突発ログ、マイプラン、セルフケア記録、相談メモ、プライバシー設定をまとめて、端末内でファイル化します。パスコードそのものは含めません。</p>
        <button className="primary-btn" onClick={() => downloadBackup(backup)}>JSONバックアップを保存</button>
      </section>

      <section className="section-block data-card">
        <h2>JSONインポート</h2>
        <p className="soft-text">保存したバックアップファイルから記録を読み込みます。読み込み前に確認画面を表示します。</p>
        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept="application/json,.json"
          onChange={(event) => handleImport(event.target.files?.[0])}
        />
        <button className="secondary-btn no-margin" onClick={() => fileInputRef.current?.click()}>JSONファイルを選ぶ</button>
      </section>

      <section className="section-block data-card">
        <h2>CSV出力</h2>
        <p className="soft-text">共有や振り返りに使いやすい表形式で出力します。</p>
        <div className="data-actions">
          <button className="secondary-btn no-margin" onClick={exportDailyCsv}>日々の記録CSV</button>
          <button className="secondary-btn no-margin" onClick={exportSuddenCsv}>突発ログCSV</button>
          <button className="secondary-btn no-margin" onClick={exportSelfCareCsv}>セルフケア記録CSV</button>
          <button className="secondary-btn no-margin" onClick={exportConsultationCsv}>相談メモCSV</button>
        </div>
      </section>

      <section className="section-block data-card">
        <h2>下書きの削除</h2>
        <p className="soft-text">途中保存された下書きだけを削除できます。保存済みの記録はそのまま残ります。</p>
        {drafts.length === 0 ? (
          <p className="empty-box">保存中の下書きはありません。</p>
        ) : (
          <>
            <div className="detail-list">
              {drafts.map((draft) => (
                <div className="detail-row" key={draft.key}>
                  <span>{draft.label}</span>
                  <strong>{formatDateTime(draft.updatedAt)}</strong>
                  <button className="delete-action full-width" onClick={() => deleteDraft(draft.key)}>この下書きを削除</button>
                </div>
              ))}
            </div>
            <button className="delete-action full-width" onClick={deleteAllDrafts}>下書きをすべて削除</button>
          </>
        )}
      </section>

      <section className="section-block data-card danger-zone">
        <h2>全データ削除</h2>
        <p className="soft-text">保存されている記録、マイプラン、セルフケア記録、相談メモをすべて削除します。先にバックアップを取ることをおすすめします。</p>
        <button className="delete-action full-width" onClick={onDeleteAllRequest}>すべての記録を削除</button>
      </section>
    </section>
  );
}

function SelfCareScreen({
  plans,
  logs,
  flash,
  onSavePlan,
  onDeletePlan,
  onCareDone,
  onDirtyChange,
}: {
  plans: SelfCarePlan[];
  logs: SelfCareLog[];
  flash: string;
  onSavePlan: (plan: SelfCarePlan) => void;
  onDeletePlan: (id: string) => void;
  onCareDone: (plan: SelfCarePlan) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState<SelfCareCategory>("体を整える");
  const [customMemo, setCustomMemo] = useState("");
  const [editingPlan, setEditingPlan] = useState<SelfCarePlan | null>(null);
  const [customDirty, setCustomDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [showRestore, setShowRestore] = useState(() => Boolean(readDraft<{ title: string; category: SelfCareCategory; memo: string }>(selfCareDraftKey)));
  const [customMessage, setCustomMessage] = useState("");
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const addPlan = (item: Pick<SelfCarePlan, "title" | "category" | "memo">) => {
    onSavePlan({
      id: newId(),
      title: item.title,
      category: item.category,
      memo: item.memo,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  };

  const saveCustom = () => {
    const title = customTitle.trim();
    if (!title) {
      setCustomMessage("保存するにはタイトルが必要です。短い名前で大丈夫です。");
      return;
    }
    if (isSavingCustom) return;
    setIsSavingCustom(true);
    onSavePlan({
      id: editingPlan?.id || newId(),
      title,
      category: customCategory,
      memo: customMemo,
      createdAt: editingPlan?.createdAt || nowIso(),
      updatedAt: nowIso(),
    });
    setCustomTitle("");
    setCustomMemo("");
    setCustomCategory("体を整える");
    setEditingPlan(null);
    removeDraft(selfCareDraftKey);
    setCustomDirty(false);
    setCustomMessage("");
    setIsSavingCustom(false);
  };

  useEffect(() => {
    onDirtyChange(customDirty);
    return () => onDirtyChange(false);
  }, [customDirty, onDirtyChange]);

  useEffect(() => {
    if (!customDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [customDirty]);

  useEffect(() => {
    if (editingPlan || showRestore || !customDirty) return;
    setDraftStatus("下書きを保存中です");
    const timer = window.setTimeout(() => {
      writeDraft(selfCareDraftKey, "selfcare", { title: customTitle, category: customCategory, memo: customMemo });
      setDraftStatus("下書きを保存しました");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [customTitle, customCategory, customMemo, editingPlan, showRestore, customDirty]);

  const updateCustomTitle = (value: string) => {
    setCustomTitle(value);
    setCustomDirty(true);
    setCustomMessage("");
  };

  const updateCustomCategory = (value: SelfCareCategory) => {
    setCustomCategory(value);
    setCustomDirty(true);
  };

  const updateCustomMemo = (value: string) => {
    setCustomMemo(value);
    setCustomDirty(true);
  };

  const restoreDraft = () => {
    const draft = readDraft<{ title: string; category: SelfCareCategory; memo: string }>(selfCareDraftKey);
    if (draft) {
      setCustomTitle(draft.data.title || "");
      setCustomCategory(normalizeSelfCareCategory(draft.data.category));
      setCustomMemo(draft.data.memo || "");
      setCustomDirty(true);
      setDraftStatus("下書きを再開しました");
    }
    setShowRestore(false);
  };

  const discardDraft = () => {
    removeDraft(selfCareDraftKey);
    setShowRestore(false);
    setDraftStatus("");
  };

  const groupedCandidates = selfCareCategories.map((category) => ({
    category,
    items: selfCareCandidates.filter((item) => item.category === category),
  }));
  const recentLogs = logs.slice(0, 5);

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">試せることを選ぶ</p>
          <h1>セルフケア</h1>
        </div>
      </header>
      {flash && <div className="success-message">{flash}</div>}
      <div className="notice">ここでの候補は、治療法ではなくセルフケアのヒントです。合うかどうかを記録しながら、無理のないものを選んでください。</div>

      <section className="section-block">
        <h2>マイプラン</h2>
        {plans.length === 0 && <p className="soft-text">自分に合いそうな小さな行動を追加できます。</p>}
        <div className="record-list">
          {plans.map((plan) => (
            <article className="record-card" key={plan.id}>
              <div className="record-card-head">
                <div>
                  <p className="label">{plan.category}</p>
                  <h2>{plan.title}</h2>
                </div>
                <span className="badge">マイプラン</span>
              </div>
              {plan.memo && <p className="record-snippet">{plan.memo}</p>}
              <div className="card-actions">
                <button className="secondary-action" onClick={() => onCareDone(plan)}>できた</button>
                <button
                  className="secondary-action"
                  onClick={() => {
                    setEditingPlan(plan);
                    setCustomTitle(plan.title);
                    setCustomCategory(plan.category);
                    setCustomMemo(plan.memo);
                    setShowRestore(false);
                    setCustomDirty(false);
                  }}
                >
                  編集
                </button>
                <button className="delete-action" onClick={() => onDeletePlan(plan.id)}>削除</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block data-card">
        <h2>{editingPlan ? "マイプランを編集" : "カスタム項目を追加"}</h2>
        {!editingPlan && showRestore && <DraftRestoreNotice onRestore={restoreDraft} onDiscard={discardDraft} />}
        {draftStatus && <p className="draft-status">{draftStatus}</p>}
        {customMessage && <div className="error-message">{customMessage}</div>}
        <label className="field">
          <span>タイトル <small>必要</small></span>
          <input value={customTitle} onChange={(event) => updateCustomTitle(event.target.value)} placeholder="例: 5分だけ静かに座る" />
        </label>
        <Choice label="カテゴリ" options={selfCareCategories} value={customCategory} onChange={(value) => updateCustomCategory(value as SelfCareCategory)} />
        <TextArea label="メモ" helper="任意。自分向けの短いメモを書けます" value={customMemo} onChange={updateCustomMemo} />
        <div className="data-actions">
          <button className="primary-btn" disabled={isSavingCustom} onClick={saveCustom}>{isSavingCustom ? "保存しています" : editingPlan ? "更新する" : "追加する"}</button>
          {editingPlan && <button className="secondary-btn no-margin" onClick={() => {
            setEditingPlan(null);
            setCustomDirty(false);
          }}>編集をやめる</button>}
        </div>
      </section>

      <section className="section-block">
        <h2>セルフケア候補</h2>
        {groupedCandidates.map((group) => (
          <div className="candidate-group" key={group.category}>
            <h3>{group.category}</h3>
            <div className="record-list">
              {group.items.map((item) => (
                <article className="candidate-card" key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.memo}</p>
                  </div>
                  <button className="secondary-action" onClick={() => addPlan(item)}>追加</button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="section-block">
        <h2>最近のセルフケア記録</h2>
        {recentLogs.length === 0 ? (
          <p className="soft-text">まだ実行ログはありません。</p>
        ) : (
          <div className="detail-list">
            {recentLogs.map((log) => (
              <div className="detail-row" key={log.id}>
                <span>{formatDateTime(log.createdAt)} ・ {log.category}</span>
                <strong>{log.title} / {log.result}</strong>
                {log.memo && <p className="record-snippet">{log.memo}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function SelfCareLogModal({ plan, onCancel, onSave }: { plan: SelfCarePlan; onCancel: () => void; onSave: (log: SelfCareLog) => void }) {
  const [result, setResult] = useState<SelfCareResult>("後で振り返る");
  const [memo, setMemo] = useState("");

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <h2>できた記録</h2>
        <p>{plan.title}</p>
        <Choice label="実行後の感じ方" options={["少し整った", "変化は少なめ", "今は合わなかった", "後で振り返る"]} value={result} onChange={(value) => setResult(value as SelfCareResult)} />
        <TextArea label="メモ" helper="短く残せます" value={memo} onChange={setMemo} />
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel}>キャンセル</button>
          <button
            className="primary-btn"
            onClick={() =>
              onSave({
                id: newId(),
                planId: plan.id,
                title: plan.title,
                category: plan.category,
                result,
                memo,
                createdAt: nowIso(),
              })
            }
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsultationScreen({
  dailyRecords,
  suddenLogs,
  selfCareLogs,
  notes,
  flash,
  onSave,
  onDelete,
  onMarkDone,
  privateDisplayMode,
  onDirtyChange,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCareLogs: SelfCareLog[];
  notes: ConsultationNote[];
  flash: string;
  onSave: (note: ConsultationNote) => void;
  onDelete: (id: string) => void;
  onMarkDone: (id: string) => void;
  privateDisplayMode: boolean;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [editing, setEditing] = useState<ConsultationNote | null>(null);
  const [detail, setDetail] = useState<ConsultationNote | null>(null);
  const [period, setPeriod] = useState(14);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");
  const blank = createConsultationDraft();
  const [form, setForm] = useState<ConsultationNote>(blank);
  const [isDirty, setIsDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [showRestore, setShowRestore] = useState(() => Boolean(readDraft<ConsultationNote>(consultationDraftKey)));
  const [isSaving, setIsSaving] = useState(false);
  const sortedNotes = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const prepSummary = buildConsultationSummary(period, dailyRecords, suddenLogs, selfCareLogs, notes);
  const aiText = buildConsultationAiPrompt(prepSummary);

  const startEdit = (note: ConsultationNote) => {
    setEditing(note);
    setForm(note);
    setIsDirty(false);
    setShowRestore(false);
    setMessage("");
  };

  const resetForm = () => {
    const next = createConsultationDraft();
    setEditing(null);
    setForm(next);
    setIsDirty(false);
    setIsSaving(false);
  };

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (editing || showRestore || !isDirty) return;
    setDraftStatus("下書きを保存中です");
    const timer = window.setTimeout(() => {
      writeDraft(consultationDraftKey, "consultation", form);
      setDraftStatus("下書きを保存しました");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, editing, showRestore, isDirty]);

  const updateForm = (next: ConsultationNote) => {
    setForm(next);
    setIsDirty(true);
  };

  const restoreDraft = () => {
    const draft = readDraft<ConsultationNote>(consultationDraftKey);
    if (draft) {
      setForm(normalizeConsultationNote(draft.data));
      setIsDirty(true);
      setDraftStatus("下書きを再開しました");
    }
    setShowRestore(false);
  };

  const discardDraft = () => {
    removeDraft(consultationDraftKey);
    setShowRestore(false);
    setDraftStatus("");
  };

  const saveForm = () => {
    if (isSaving) return;
    setIsSaving(true);
    const title = form.title.trim() || "無題の相談メモ";
    onSave({ ...form, title, updatedAt: nowIso(), createdAt: form.createdAt || nowIso() });
    resetForm();
  };

  const copyText = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">伝えたいことを整理</p>
          <h1>相談ノート</h1>
        </div>
      </header>
      <p className="soft-text">診察や相談の前に、伝えたいこと・気になること・記録から見えた傾向を整理できます。</p>
      {flash && <div className="success-message">{flash}</div>}
      {message && <div className="success-message">{message}</div>}
      {copied && <div className="success-message">{copied}をコピーしました</div>}

      <section className="section-block data-card">
        <h2>{editing ? "相談メモを編集" : "相談メモを作る"}</h2>
        {!editing && showRestore && <DraftRestoreNotice onRestore={restoreDraft} onDiscard={discardDraft} />}
        {draftStatus && <p className="draft-status">{draftStatus}</p>}
        <label className="field">
          <span>タイトル <small>任意</small></span>
          <input value={form.title} onChange={(event) => updateForm({ ...form, title: event.target.value })} placeholder="空欄なら無題の相談メモになります" />
        </label>
        <Choice label="相談先の種類" options={consultationTargets.map(targetLabel)} value={targetLabel(form.target)} onChange={(value) => updateForm({ ...form, target: targetFromLabel(value) })} />
        <Choice label="ステータス" options={consultationStatuses.map(statusLabel)} value={statusLabel(form.status)} onChange={(value) => updateForm({ ...form, status: statusFromLabel(value) })} />
        <FormSection title="相談したい内容">
          <TextArea label="相談したいこと" helper="任意。あとから編集できます" value={form.mainTopic} onChange={(value) => updateForm({ ...form, mainTopic: value })} />
          <TextArea label="最近気になっていること" helper="任意" value={form.recentConcern} onChange={(value) => updateForm({ ...form, recentConcern: value })} />
          <TextArea label="状態の波が大きかった場面" helper="任意" value={form.waveMemo} onChange={(value) => updateForm({ ...form, waveMemo: value })} />
        </FormSection>
        <FormSection title="補足メモ">
          <TextArea label="生活面で気になっていること" helper="任意" value={form.lifestyleMemo} onChange={(value) => updateForm({ ...form, lifestyleMemo: value })} />
          <TextArea label="話し忘れたくないこと" helper="任意" value={form.dontForgetMemo} onChange={(value) => updateForm({ ...form, dontForgetMemo: value })} />
          <label className="check-row">
            <input type="checkbox" checked={form.includeInReport} onChange={(event) => updateForm({ ...form, includeInReport: event.target.checked })} />
            <span>レポートに含める</span>
          </label>
        </FormSection>
        <div className="data-actions">
          <button className="primary-btn" disabled={isSaving} onClick={saveForm}>{isSaving ? "保存しています" : editing ? "更新する" : "保存する"}</button>
          {editing && <button className="secondary-btn no-margin" onClick={resetForm}>編集をやめる</button>}
        </div>
      </section>

      <section className="section-block">
        <h2>相談メモ一覧</h2>
        {sortedNotes.length === 0 ? (
          <p className="soft-text">まだ相談メモはありません。話したいことを短く残しておけます。</p>
        ) : (
          <div className="record-list">
            {sortedNotes.map((note) => (
              <article className="record-card" key={note.id}>
                <div className="record-card-head">
                  <div>
                    <p className="label">{targetLabel(note.target)} ・ {statusLabel(note.status)}</p>
                    <h2>{note.title}</h2>
                  </div>
                  <span className="badge">{formatDateTime(note.updatedAt)}</span>
                </div>
                <p className="record-snippet">{privateDisplayMode ? "メモは非表示です" : shortText(note.mainTopic || note.recentConcern || note.dontForgetMemo)}</p>
                <div className="card-actions">
                  <button className="secondary-action" onClick={() => setDetail(note)}>詳細</button>
                  <button className="secondary-action" onClick={() => startEdit(note)}>編集</button>
                  {note.status !== "done" && <button className="secondary-action" onClick={() => onMarkDone(note.id)}>相談済みにする</button>}
                  <button className="delete-action" onClick={() => onDelete(note.id)}>削除</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-block data-card">
        <h2>診察前まとめ</h2>
        <Choice label="期間" options={["7日間", "14日間", "30日間"]} value={`${period}日間`} onChange={(value) => setPeriod(Number(value.replace("日間", "")))} />
        <button className="primary-btn" onClick={() => setMessage("診察前まとめを作成しました")}>診察前まとめを作る</button>
        <textarea className="report-text" readOnly value={prepSummary} />
        <div className="data-actions">
          <button className="secondary-btn no-margin" onClick={() => copyText("診察前まとめ", prepSummary)}>診察前まとめをコピー</button>
          <button className="secondary-btn no-margin" onClick={() => copyText("AI相談文", aiText)}>AI相談文をコピー</button>
        </div>
      </section>

      {detail && (
        <ConsultationDetailModal
          note={detail}
          summary={buildSingleConsultationSummary(detail)}
          aiText={buildConsultationAiPrompt(buildSingleConsultationSummary(detail))}
          onClose={() => setDetail(null)}
          onCopy={copyText}
          onToggleReport={() => {
            onSave({ ...detail, includeInReport: !detail.includeInReport, updatedAt: nowIso() });
            setDetail({ ...detail, includeInReport: !detail.includeInReport, updatedAt: nowIso() });
          }}
        />
      )}
    </section>
  );
}

function ConsultationDetailModal({
  note,
  summary,
  aiText,
  onClose,
  onCopy,
  onToggleReport,
}: {
  note: ConsultationNote;
  summary: string;
  aiText: string;
  onClose: () => void;
  onCopy: (label: string, text: string) => void;
  onToggleReport: () => void;
}) {
  const rows = [
    ["タイトル", note.title],
    ["相談先の種類", targetLabel(note.target)],
    ["ステータス", statusLabel(note.status)],
    ["作成日", formatDateTime(note.createdAt)],
    ["更新日", formatDateTime(note.updatedAt)],
    ["相談したいこと", note.mainTopic || "未記入"],
    ["最近気になっていること", note.recentConcern || "未記入"],
    ["状態の波が大きかった場面", note.waveMemo || "未記入"],
    ["生活面で気になっていること", note.lifestyleMemo || "未記入"],
    ["話し忘れたくないこと", note.dontForgetMemo || "未記入"],
    ["レポートに含める", note.includeInReport ? "含める" : "含めない"],
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="detail-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">相談ノート</p>
            <h2>詳細</h2>
          </div>
          <button className="ghost-btn" onClick={onClose}>閉じる</button>
        </div>
        <div className="detail-list">
          {rows.map(([label, value]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="data-actions modal-actions">
          <button className="secondary-btn no-margin" onClick={() => onCopy("相談メモ", summary)}>コピー</button>
          <button className="secondary-btn no-margin" onClick={onToggleReport}>レポートに含める</button>
          <button className="secondary-btn no-margin" onClick={() => onCopy("AI相談文", aiText)}>AI相談文を作成</button>
        </div>
      </div>
    </div>
  );
}

function RecordsScreen({
  dailyRecords,
  suddenLogs,
  privateDisplayMode,
  flash,
  onDetail,
  onEditDaily,
  onEditSudden,
  onDeleteDaily,
  onDeleteSudden,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  privateDisplayMode: boolean;
  flash: string;
  onDetail: (item: DetailItem) => void;
  onEditDaily: (record: DailyRecord) => void;
  onEditSudden: (log: SuddenLog) => void;
  onDeleteDaily: (id: string) => void;
  onDeleteSudden: (id: string) => void;
}) {
  const [tab, setTab] = useState<RecordsTab>("daily");
  const sortedDaily = [...dailyRecords].sort((a, b) => b.date.localeCompare(a.date));
  const sortedSudden = [...suddenLogs].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">確認・調整</p>
          <h1>記録一覧</h1>
        </div>
      </header>
      {flash && <div className="success-message">{flash}</div>}
      <div className="tab-switch" role="tablist" aria-label="記録の種類">
        <button className={tab === "daily" ? "selected" : ""} onClick={() => setTab("daily")} type="button">日々の記録</button>
        <button className={tab === "sudden" ? "selected" : ""} onClick={() => setTab("sudden")} type="button">突発ログ</button>
      </div>

      {tab === "daily" && (
        <div className="record-list">
          {sortedDaily.length === 0 && <EmptyState text="まだ日々の記録がありません。まずは今日の状態を記録してみましょう。" />}
          {sortedDaily.map((record) => (
            <article className="record-card" key={record.id}>
              <div className="record-card-head">
                <div>
                  <p className="label">記録日</p>
                  <h2>{record.date}</h2>
                </div>
                <span className="badge">{record.weather}</span>
              </div>
              <div className="compact-metrics">
                <Metric label="気分" value={privateDisplayMode ? "記録あり" : formatScore(record.mood)} />
                <Metric label="不安" value={privateDisplayMode ? "記録あり" : formatScore(record.anxiety)} />
                <Metric label="イライラ" value={privateDisplayMode ? "記録あり" : formatScore(record.irritability)} />
                <Metric label="疲労" value={privateDisplayMode ? "記録あり" : formatScore(record.fatigue)} />
                <Metric label="睡眠" value={privateDisplayMode ? "記録あり" : formatSleepHours(record.sleepHours)} />
              </div>
              <p className="record-snippet"><strong>出来事:</strong> {privateDisplayMode ? "メモは非表示です" : shortText(record.events)}</p>
              <p className="record-snippet"><strong>メモ:</strong> {privateDisplayMode ? "メモは非表示です" : shortText(record.memo)}</p>
              <div className="card-actions">
                <button className="secondary-action" onClick={() => onDetail({ kind: "daily", record })}>詳細</button>
                <button className="secondary-action" onClick={() => onEditDaily(record)}>編集</button>
                <button className="delete-action" onClick={() => onDeleteDaily(record.id)}>削除</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "sudden" && (
        <div className="record-list">
          {sortedSudden.length === 0 && <EmptyState text="まだ突発ログはありません。急な状態の変化があったときに記録できます。" />}
          {sortedSudden.map((log) => (
            <article className="record-card" key={log.id}>
              <div className="record-card-head">
                <div>
                  <p className="label">発生日時</p>
                  <h2>{formatDateTime(log.occurredAt)}</h2>
                </div>
                <span className="badge">突発ログ</span>
              </div>
              <TagList tags={log.stateTags} empty="状態タグなし" />
              <div className="compact-metrics">
                <Metric label="強さ" value={privateDisplayMode ? "記録あり" : formatScore(log.intensity)} />
                <Metric label="場所" value={log.place} />
                <Metric label="変化" value={log.afterChange} />
              </div>
              <p className="record-snippet"><strong>きっかけ:</strong> {privateDisplayMode ? "メモは非表示です" : shortText(log.triggers.join("、"))}</p>
              <p className="record-snippet"><strong>メモ:</strong> {privateDisplayMode ? "メモは非表示です" : shortText(log.memo)}</p>
              <div className="card-actions">
                <button className="secondary-action" onClick={() => onDetail({ kind: "sudden", record: log })}>詳細</button>
                <button className="secondary-action" onClick={() => onEditSudden(log)}>編集</button>
                <button className="delete-action" onClick={() => onDeleteSudden(log.id)}>削除</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DailyForm({
  initial,
  onSave,
  onCancel,
  onDirtyChange,
}: {
  initial: DailyRecord | null;
  onSave: (record: DailyRecord) => void;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<DailyRecord>(
    initial || {
      id: newId(),
      date: today(),
      mood: null,
      anxiety: null,
      irritability: null,
      fatigue: null,
      sleepHours: null,
      sleepQuality: "普通",
      weather: "晴れ",
      meal: "普通",
      exercise: "なし",
      wentOut: "なし",
      socialContact: "普通",
      medicine: "該当なし",
      events: "",
      memo: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  );
  const [sleepHoursInput, setSleepHoursInput] = useState(initial?.sleepHours == null ? "" : String(initial.sleepHours));
  const [isDirty, setIsDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [showRestore, setShowRestore] = useState(() => !initial && Boolean(readDraft<{ form: DailyRecord; sleepHoursInput: string }>(dailyDraftKey)));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (initial || showRestore || !isDirty) return;
    setDraftStatus("下書きを保存中です");
    const timer = window.setTimeout(() => {
      writeDraft(dailyDraftKey, "daily", { form, sleepHoursInput });
      setDraftStatus("下書きを保存しました");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, sleepHoursInput, initial, showRestore, isDirty]);

  const updateForm = (next: DailyRecord) => {
    setForm(next);
    setIsDirty(true);
  };

  const restoreDraft = () => {
    const draft = readDraft<{ form: DailyRecord; sleepHoursInput: string }>(dailyDraftKey);
    if (draft) {
      setForm(normalizeDailyRecord(draft.data.form));
      setSleepHoursInput(draft.data.sleepHoursInput || "");
      setIsDirty(true);
      setDraftStatus("下書きを再開しました");
    }
    setShowRestore(false);
  };

  const discardDraft = () => {
    removeDraft(dailyDraftKey);
    setShowRestore(false);
    setDraftStatus("");
  };

  const save = () => {
    if (isSaving) return;
    setIsSaving(true);
    onSave({ ...form, sleepHours: parseSleepHoursInput(sleepHoursInput), updatedAt: nowIso() });
  };

  return (
    <section>
      <FormHead title={initial ? "記録を編集中" : "今日の記録"} sub="その日全体の状態を記録します" onCancel={onCancel} />
      {!initial && showRestore && <DraftRestoreNotice onRestore={restoreDraft} onDiscard={discardDraft} />}
      {draftStatus && <p className="draft-status">{draftStatus}</p>}
      <div className="form-card">
        <FormSection title="基本スコア">
          <label className="field">
            <span>記録日 <small>必須</small></span>
            <input type="date" value={form.date} onChange={(event) => updateForm({ ...form, date: event.target.value })} />
          </label>
          <ScoreField label="気分" value={form.mood} onChange={(mood) => updateForm({ ...form, mood })} />
          <ScoreField label="不安度" value={form.anxiety} onChange={(anxiety) => updateForm({ ...form, anxiety })} />
          <ScoreField label="イライラ度" value={form.irritability} onChange={(irritability) => updateForm({ ...form, irritability })} />
          <ScoreField label="疲労度" value={form.fatigue} onChange={(fatigue) => updateForm({ ...form, fatigue })} />
        </FormSection>

        <FormSection title="睡眠と生活">
          <label className="field">
            <span>睡眠時間 <small>任意</small></span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="24"
              step="0.5"
              value={sleepHoursInput}
              placeholder="例：6.5"
              onChange={(event) => {
                setSleepHoursInput(event.target.value);
                setIsDirty(true);
              }}
            />
          </label>
          <Choice label="睡眠の質" options={["良い", "普通", "悪い"]} value={form.sleepQuality} onChange={(sleepQuality) => updateForm({ ...form, sleepQuality: sleepQuality as SleepQuality })} />
          <Choice label="天気" options={["晴れ", "曇り", "雨", "雪", "その他"]} value={form.weather} onChange={(weather) => updateForm({ ...form, weather: weather as DailyChoice })} />
          <Choice label="食事" options={["しっかり食べた", "普通", "少ない", "食べていない"]} value={form.meal} onChange={(meal) => updateForm({ ...form, meal: meal as DailyRecord["meal"] })} />
          <Choice label="運動" options={["なし", "散歩", "軽い運動", "筋トレ", "その他"]} value={form.exercise} onChange={(exercise) => updateForm({ ...form, exercise: exercise as DailyRecord["exercise"] })} />
          <Choice label="外出" options={["あり", "なし"]} value={form.wentOut} onChange={(wentOut) => updateForm({ ...form, wentOut: wentOut as DailyRecord["wentOut"] })} />
          <Choice label="人との接触" options={["多い", "普通", "少ない", "なし"]} value={form.socialContact} onChange={(socialContact) => updateForm({ ...form, socialContact: socialContact as DailyRecord["socialContact"] })} />
          <Choice label="薬・サプリ" options={["飲んだ", "飲んでいない", "該当なし"]} value={form.medicine} onChange={(medicine) => updateForm({ ...form, medicine: medicine as DailyRecord["medicine"] })} />
        </FormSection>

        <FormSection title="できごと・メモ">
          <TextArea label="今日の主な出来事" helper="任意。あとから編集できます" value={form.events} onChange={(events) => updateForm({ ...form, events })} />
          <TextArea label="今日のメモ" helper="任意。短くても空欄でも大丈夫です" value={form.memo} onChange={(memo) => updateForm({ ...form, memo })} />
        </FormSection>
      </div>
      <button className="primary-btn sticky-save" disabled={isSaving} onClick={save}>{isSaving ? "保存しています" : "保存する"}</button>
    </section>
  );
}

function SuddenForm({
  initial,
  onSave,
  onCancel,
  onDirtyChange,
}: {
  initial: SuddenLog | null;
  onSave: (log: SuddenLog) => void;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<SuddenLog>(
    initial || {
      id: newId(),
      occurredAt: nowIso(),
      stateTags: [],
      intensity: null,
      triggers: [],
      place: "自宅",
      symptoms: [],
      thoughts: "",
      actions: [],
      afterChange: "変わらない",
      memo: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  );
  const [isDirty, setIsDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [showRestore, setShowRestore] = useState(() => !initial && Boolean(readDraft<SuddenLog>(suddenDraftKey)));
  const [isSaving, setIsSaving] = useState(false);
  const showSupport = form.stateTags.some((tag) => supportTags.includes(tag)) || supportWords.some((word) => `${form.memo} ${form.thoughts}`.includes(word));

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (initial || showRestore || !isDirty) return;
    setDraftStatus("下書きを保存中です");
    const timer = window.setTimeout(() => {
      writeDraft(suddenDraftKey, "sudden", form);
      setDraftStatus("下書きを保存しました");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, initial, showRestore, isDirty]);

  const updateForm = (next: SuddenLog) => {
    setForm(next);
    setIsDirty(true);
  };

  const restoreDraft = () => {
    const draft = readDraft<SuddenLog>(suddenDraftKey);
    if (draft) {
      setForm(normalizeSuddenLog(draft.data));
      setIsDirty(true);
      setDraftStatus("下書きを再開しました");
    }
    setShowRestore(false);
  };

  const discardDraft = () => {
    removeDraft(suddenDraftKey);
    setShowRestore(false);
    setDraftStatus("");
  };

  const save = () => {
    if (isSaving) return;
    setIsSaving(true);
    onSave({ ...form, updatedAt: nowIso() });
  };

  return (
    <section>
      <FormHead title={initial ? "突発ログを編集中" : "突発ログ"} sub="急な状態の変化を短く記録します" onCancel={onCancel} />
      {!initial && showRestore && <DraftRestoreNotice onRestore={restoreDraft} onDiscard={discardDraft} />}
      {draftStatus && <p className="draft-status">{draftStatus}</p>}
      {showSupport && <SupportNotice />}
      <div className="form-card">
        <FormSection title="まず記録">
          <label className="field">
            <span>発生日時 <small>自動</small></span>
            <input type="datetime-local" value={toDateTimeLocal(form.occurredAt)} onChange={(event) => updateForm({ ...form, occurredAt: new Date(event.target.value).toISOString() })} />
          </label>
          <MultiChoice label="状態タグ" options={stateTagOptions} values={form.stateTags} onChange={(stateTags) => updateForm({ ...form, stateTags })} />
          <ScoreField label="強さ" value={form.intensity} onChange={(intensity) => updateForm({ ...form, intensity })} />
        </FormSection>

        <FormSection title="状況">
          <MultiChoice label="直前にあったこと" options={triggerOptions} values={form.triggers} onChange={(triggers) => updateForm({ ...form, triggers })} />
          <Choice label="場所" options={placeOptions} value={form.place} onChange={(place) => updateForm({ ...form, place })} />
          <MultiChoice label="身体のサイン" options={symptomOptions} values={form.symptoms} onChange={(symptoms) => updateForm({ ...form, symptoms })} />
          <TextArea label="頭に浮かんだ言葉・思考" helper="任意。書ける範囲で大丈夫です" value={form.thoughts} onChange={(thoughts) => updateForm({ ...form, thoughts })} />
        </FormSection>

        <FormSection title="対処">
          <MultiChoice label="実際に取った行動" options={actionOptions} values={form.actions} onChange={(actions) => updateForm({ ...form, actions })} />
          <Choice label="対処後の変化" options={["変わらない", "少し落ち着いた", "かなり落ち着いた", "落ち着かなかった"]} value={form.afterChange} onChange={(afterChange) => updateForm({ ...form, afterChange: afterChange as SuddenLog["afterChange"] })} />
        </FormSection>

        <FormSection title="任意メモ">
          <TextArea label="メモ" helper="書けるときだけで大丈夫です" value={form.memo} onChange={(memo) => updateForm({ ...form, memo })} />
        </FormSection>
      </div>
      <button className="urgent-btn sticky-save" disabled={isSaving} onClick={save}>{isSaving ? "保存しています" : "突発ログを保存"}</button>
    </section>
  );
}

function Analysis({ dailyRecords, suddenLogs, selfCareLogs }: { dailyRecords: DailyRecord[]; suddenLogs: SuddenLog[]; selfCareLogs: SelfCareLog[] }) {
  const sortedDaily = [...dailyRecords].sort((a, b) => a.date.localeCompare(b.date));
  const highDaily = sortedDaily.slice(-14);
  const insights = calculateInsights(dailyRecords, suddenLogs, selfCareLogs);
  const weatherMood = groupedAverage(dailyRecords, (record) => record.weather, (record) => record.mood);
  const exerciseMood = groupedAverage(dailyRecords, (record) => (record.exercise === "なし" ? "運動なし" : "運動あり"), (record) => record.mood);
  const sleepRecords = dailyRecords.filter(hasSleepHours);
  const sleepTrendRecords = highDaily.filter(hasSleepHours);
  const sleepLow = sleepRecords.filter((record) => record.sleepHours! < 6);
  const sleepOk = sleepRecords.filter((record) => record.sleepHours! >= 6);
  const suddenByTag = countFlat(suddenLogs.flatMap((log) => log.stateTags));
  const triggerCounts = countFlat(suddenLogs.flatMap((log) => log.triggers));
  const symptomCounts = countFlat(suddenLogs.flatMap((log) => log.symptoms));
  const helpfulActions = countFlat(suddenLogs.filter((log) => log.afterChange.includes("落ち着いた")).flatMap((log) => log.actions));
  const dayCounts = countBy(suddenLogs, (log) => ["日", "月", "火", "水", "木", "金", "土"][new Date(log.occurredAt).getDay()]);
  const hourCounts = countBy(suddenLogs, (log) => `${new Date(log.occurredAt).getHours()}時台`);
  const selfCareCounts = countBy(selfCareLogs, (log) => log.title);
  const selfCareResultCounts = countBy(selfCareLogs, (log) => log.result);

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">記録上の傾向です</p>
        <h1>分析</h1>
      </header>
      <p className="soft-text">記録上の傾向です。関連している可能性があります。参考情報として見てください。医師や専門家に相談する材料として使えます。</p>

      <section className="section-block insights-section">
        <h2>記録から見える傾向</h2>
        <p className="soft-text">ここに表示される内容は、記録上の傾向です。診断や治療判断ではなく、自分を知るための参考情報として見てください。</p>
        {insights.length === 0 ? (
          <div className="notice">まだ記録が少ないため、傾向は参考程度です。もう少し記録が増えると、状態の波が見えやすくなります。</div>
        ) : (
          <div className="insight-list">
            {insights.map((insight) => <InsightCard insight={insight} key={insight.id} />)}
          </div>
        )}
      </section>

      <section className="section-block">
        <h2>日々の記録</h2>
        {dailyRecords.length === 0 ? (
          <EmptyState text="まだ記録がありません" />
        ) : (
          <>
            <div className="summary-list">
              <Metric label="平均気分" value={`${formatAverage(dailyRecords.map((record) => record.mood))}/10`} />
              <Metric label="平均不安" value={`${formatAverage(dailyRecords.map((record) => record.anxiety))}/10`} />
              <Metric label="平均睡眠" value={`${formatAverage(validSleepHours(dailyRecords))}h`} />
              <Metric label="平均疲労" value={`${formatAverage(dailyRecords.map((record) => record.fatigue))}/10`} />
            </div>
            <MiniTrend title="気分の推移" values={highDaily.map((record) => record.mood)} labels={highDaily.map((record) => record.date.slice(5))} />
            <MiniTrend title="不安度の推移" values={highDaily.map((record) => record.anxiety)} labels={highDaily.map((record) => record.date.slice(5))} />
            <MiniTrend title="睡眠時間の推移" values={sleepTrendRecords.map((record) => record.sleepHours!)} labels={sleepTrendRecords.map((record) => record.date.slice(5))} max={10} />
            <MiniTrend title="疲労度の推移" values={highDaily.map((record) => record.fatigue)} labels={highDaily.map((record) => record.date.slice(5))} />
            <KeyValueList title="天気別の気分傾向" items={weatherMood} suffix="/10" />
            <KeyValueList title="睡眠時間と不安度の傾向" items={[["6時間未満", formatAverage(sleepLow.map((record) => record.anxiety))], ["6時間以上", formatAverage(sleepOk.map((record) => record.anxiety))]]} suffix="/10" />
            <KeyValueList title="運動した日としていない日の気分傾向" items={exerciseMood} suffix="/10" />
          </>
        )}
      </section>

      <section className="section-block">
        <h2>突発ログ</h2>
        {suddenLogs.length === 0 ? (
          <EmptyState text="まだ記録がありません" />
        ) : (
          <>
            <div className="summary-list">
              <Metric label="回数" value={`${suddenLogs.length}件`} />
              <Metric label="平均強さ" value={formatAverage(suddenLogs.map((log) => log.intensity))} />
            </div>
            <KeyValueList title="よく出る状態タグ" items={suddenByTag} suffix="件" />
            <KeyValueList title="よく出るきっかけ" items={triggerCounts} suffix="件" />
            <KeyValueList title="よく出る身体のサイン" items={symptomCounts} suffix="件" />
            <KeyValueList title="効果がありそうだった対処法" items={helpfulActions} suffix="件" />
            <KeyValueList title="突発ログが多い曜日" items={dayCounts} suffix="件" />
            <KeyValueList title="突発ログが多い時間帯" items={hourCounts} suffix="件" />
          </>
        )}
      </section>

      <section className="section-block">
        <h2>セルフケア</h2>
        {selfCareLogs.length === 0 ? (
          <EmptyState text="まだセルフケア記録がありません" />
        ) : (
          <>
            <p className="soft-text">記録上の傾向です。この行動が合いやすい可能性があります。参考情報として見てください。</p>
            <div className="summary-list">
              <Metric label="実行回数" value={`${selfCareLogs.length}件`} />
              <Metric label="最近の記録" value={formatDateTime(selfCareLogs[0].createdAt)} />
            </div>
            <KeyValueList title="よく使ったセルフケア" items={selfCareCounts} suffix="件" />
            <KeyValueList title="実行後の感じ方の傾向" items={selfCareResultCounts} suffix="件" />
          </>
        )}
      </section>
    </section>
  );
}

function Report({
  dailyRecords,
  suddenLogs,
  selfCareLogs,
  consultationNotes,
  onOpenConsultation,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCareLogs: SelfCareLog[];
  consultationNotes: ConsultationNote[];
  onOpenConsultation: () => void;
}) {
  const [period, setPeriod] = useState(7);
  const [doctorMemo, setDoctorMemo] = useState("");
  const daily = dailyRecords.filter((record) => daysAgo(record.date) < period);
  const sudden = suddenLogs.filter((log) => daysAgo(log.occurredAt.slice(0, 10)) < period);
  const careInPeriod = selfCareLogs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < period);
  const hasFewRecords = daily.length < 3 && sudden.length < 2 && careInPeriod.length < 3;
  const reportInsights = calculateInsights(daily, sudden, careInPeriod);
  const insightSummary = reportInsights.length
    ? reportInsights.slice(0, 5).map((insight) => `- ${insight.title}: ${insight.description} ${insight.note}`).join("\n")
    : "記録が少ないため、傾向は参考程度です。もう少し記録が増えると、睡眠・天気・外出・きっかけ・セルフケアとの関係が見えやすくなります。";
  const topTags = countFlat(sudden.flatMap((log) => log.stateTags)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topTriggers = countFlat(sudden.flatMap((log) => log.triggers)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topSymptoms = countFlat(sudden.flatMap((log) => log.symptoms)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topActions = countFlat(sudden.filter((log) => log.afterChange.includes("落ち着いた")).flatMap((log) => log.actions)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const waveDays = daily.filter(hasLargeWaveScore).map((record) => record.date).join("、") || "目立つ記録なし";
  const topCare = countBy(careInPeriod, (log) => log.title).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const settledCare = countBy(careInPeriod.filter((log) => log.result === "少し整った"), (log) => log.title).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const notFitCare = countBy(careInPeriod.filter((log) => log.result === "今は合わなかった"), (log) => log.title).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const pendingNotes = consultationNotes.filter((note) => note.status !== "done");
  const doneNotes = consultationNotes.filter((note) => note.status === "done");
  const includedNotes = consultationNotes.filter((note) => note.includeInReport || note.status !== "done").slice(0, 5);
  const consultationSummary = includedNotes.length
    ? includedNotes.map((note) => `- ${note.title}（${targetLabel(note.target)} / ${statusLabel(note.status)}）: ${note.mainTopic || note.dontForgetMemo || "内容未記入"}`).join("\n")
    : "相談メモはまだありません。";

  const fewRecordsNote = hasFewRecords ? "記録が少ないため参考程度です。\n" : "";
  const summary = `過去${period}日間のセルフ記録です。このアプリは診断・治療・服薬指示を行うものではありません。
${fewRecordsNote}

気分平均: ${formatAverage(daily.map((record) => record.mood))}/10
不安平均: ${formatAverage(daily.map((record) => record.anxiety))}/10
睡眠平均: ${formatAverage(validSleepHours(daily))}時間
状態の波が大きかった日: ${waveDays}
期間内の突発ログ回数: ${sudden.length}件
多かった状態タグ: ${topTags}
多かったきっかけ: ${topTriggers}
多かった身体のサイン: ${topSymptoms}
効果がありそうだった対処: ${topActions}
よく使ったセルフケア: ${topCare}
実行後に整ったと感じた行動: ${settledCare}
今は合わなかった行動: ${notFitCare}
未相談のメモ: ${pendingNotes.length}件
相談済みのメモ: ${doneNotes.length}件

相談ノート:
${consultationSummary}

記録上見えている傾向:
${insightSummary}

相談時に伝えたいこと: ${doctorMemo || "未記入"}`;

  const prompt = `以下はメンタルヘルスのセルフ記録です。診断や治療判断、服薬指示はしないでください。
記録上の傾向として整理してください。
医師や専門家に相談すべき点を分けてください。
生活面で見直せそうな候補は、断定せず「可能性」「参考情報」として提示してください。
睡眠、天気、外出、突発ログ、セルフケアの要約も含めてください。

${summary}`;

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">共有用</p>
        <h1>レポート</h1>
      </header>
      {hasFewRecords && <div className="notice">記録が少ないため参考程度です。無理に分析せず、共有用の整理メモとして使えます。</div>}
      <Choice label="期間" options={["7日間", "14日間", "30日間"]} value={`${period}日間`} onChange={(value) => setPeriod(Number(value.replace("日間", "")))} />
      <TextArea label="相談時に伝えたいことメモ" value={doctorMemo} onChange={setDoctorMemo} />
      <section className="section-block data-card">
        <h2>相談ノート</h2>
        <p className="soft-text">未相談のメモ {pendingNotes.length}件 / 相談済みのメモ {doneNotes.length}件。診察前まとめは相談ノート画面で作れます。</p>
        <button className="secondary-btn no-margin" onClick={onOpenConsultation}>診察前まとめを開く</button>
      </section>
      <ReportBox title="医師に見せる用の文章" text={summary} />
      <ReportBox title="AI相談用プロンプト" text={prompt} />
    </section>
  );
}

function ReportBox({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="section-block">
      <h2>{title}</h2>
      <textarea className="report-text" readOnly value={text} />
      <button
        className="secondary-btn"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "コピーしました" : "コピー"}
      </button>
    </section>
  );
}

function History({ title, records, onEdit, onDelete }: { title: string; records: DailyRecord[]; onEdit: (record: DailyRecord) => void; onDelete: (id: string) => void }) {
  return (
    <section className="section-block">
      <h2>{title}履歴</h2>
      {records.slice(0, 8).map((record) => (
        <article className="history-item" key={record.id}>
          <div>
            <strong>{record.date}</strong>
            <p>気分 {formatScore(record.mood)} ・ 不安 {formatScore(record.anxiety)} ・ 睡眠 {formatSleepHours(record.sleepHours)}</p>
          </div>
          <div className="row-actions">
            <button onClick={() => onEdit(record)}>編集</button>
            <button onClick={() => onDelete(record.id)}>削除</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function SuddenHistory({ records, onEdit, onDelete }: { records: SuddenLog[]; onEdit: (record: SuddenLog) => void; onDelete: (id: string) => void }) {
  return (
    <section className="section-block">
      <h2>突発ログ履歴</h2>
      {records.slice(0, 8).map((record) => (
        <article className="history-item" key={record.id}>
          <div>
            <strong>{new Date(record.occurredAt).toLocaleString("ja-JP")}</strong>
            <p>{joinTags(record.stateTags)} ・ 強さ {formatScore(record.intensity)}</p>
          </div>
          <div className="row-actions">
            <button onClick={() => onEdit(record)}>編集</button>
            <button onClick={() => onDelete(record.id)}>削除</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function DetailModal({ item, onClose }: { item: DetailItem; onClose: () => void }) {
  const rows =
    item.kind === "daily"
      ? [
          ["記録日", item.record.date],
          ["気分", formatScore(item.record.mood)],
          ["不安度", formatScore(item.record.anxiety)],
          ["イライラ度", formatScore(item.record.irritability)],
          ["疲労度", formatScore(item.record.fatigue)],
          ["睡眠時間", formatSleepHours(item.record.sleepHours)],
          ["睡眠の質", item.record.sleepQuality],
          ["天気", item.record.weather],
          ["食事", item.record.meal],
          ["運動", item.record.exercise],
          ["外出", item.record.wentOut],
          ["人との接触", item.record.socialContact],
          ["薬・サプリ", item.record.medicine],
          ["今日の主な出来事", item.record.events || "未記入"],
          ["今日のメモ", item.record.memo || "未記入"],
        ]
      : [
          ["発生日時", formatDateTime(item.record.occurredAt)],
          ["状態タグ", joinTags(item.record.stateTags)],
          ["強さ", formatScore(item.record.intensity)],
          ["きっかけ", item.record.triggers.join("、") || "未記入"],
          ["場所", item.record.place],
          ["身体のサイン", item.record.symptoms.join("、") || "未記入"],
          ["頭に浮かんだ言葉・思考", item.record.thoughts || "未記入"],
          ["実際に取った行動", item.record.actions.join("、") || "未記入"],
          ["対処後の変化", item.record.afterChange],
          ["メモ", item.record.memo || "未記入"],
        ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="detail-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">{item.kind === "daily" ? "日々の記録" : "突発ログ"}</p>
            <h2>詳細</h2>
          </div>
          <button className="ghost-btn" onClick={onClose}>閉じる</button>
        </div>
        <div className="detail-list">
          {rows.map(([label, value]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ onCancel, onConfirm, isAllData = false }: { onCancel: () => void; onConfirm: () => void; isAllData?: boolean }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <h2>{isAllData ? "すべて削除しますか？" : "削除しますか？"}</h2>
        <p>{isAllData ? "保存されている記録をすべて削除します。この操作は元に戻せません。先にバックアップを取ることをおすすめします。" : "この記録を削除しますか？この操作は元に戻せません。"}</p>
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel}>キャンセル</button>
          <button className="delete-action" onClick={onConfirm}>{isAllData ? "すべて削除" : "削除する"}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmImportModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <h2>読み込みますか？</h2>
        <p>現在の記録にバックアップデータを読み込みます。既存の記録は上書きされる可能性があります。続行しますか？</p>
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel}>キャンセル</button>
          <button className="primary-btn" onClick={onConfirm}>読み込む</button>
        </div>
      </div>
    </div>
  );
}

function DraftRestoreNotice({ onRestore, onDiscard }: { onRestore: () => void; onDiscard: () => void }) {
  return (
    <div className="draft-restore">
      <div>
        <strong>途中まで入力した内容があります。</strong>
        <p>再開するか、下書きだけ破棄できます。本文はここには表示しません。</p>
      </div>
      <div className="confirm-actions">
        <button className="secondary-action" onClick={onDiscard}>破棄する</button>
        <button className="primary-btn" onClick={onRestore}>再開する</button>
      </div>
    </div>
  );
}

function FormHead({ title, sub, onCancel }: { title: string; sub: string; onCancel: () => void }) {
  return (
    <header className="page-head form-head">
      <div>
        <p className="eyebrow">{sub}</p>
        <h1>{title}</h1>
      </div>
      <button className="ghost-btn" onClick={onCancel}>戻る</button>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="form-section">
      <h2>{title}</h2>
      <div className="form-section-body">{children}</div>
    </section>
  );
}

function ScoreField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return (
    <div className="field">
      <div className="score-head">
        <span>{label} <small>任意</small></span>
        <strong>{formatScore(value)}</strong>
      </div>
      <div className="score-grid">
        <button className={value === null ? "score-button selected" : "score-button"} onClick={() => onChange(null)} type="button">
          未入力
        </button>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
          <button className={value === score ? "score-button selected" : "score-button"} key={score} onClick={() => onChange(score)} type="button">
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

function Choice({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="chip-grid">
        {options.map((option) => (
          <button className={value === option ? "chip selected" : "chip"} key={option} onClick={() => onChange(option)} type="button">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChoice({ label, options, values, onChange }: { label: string; options: string[]; values: string[]; onChange: (values: string[]) => void }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            className={values.includes(option) ? "chip selected" : "chip"}
            key={option}
            onClick={() => onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option])}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextArea({ label, helper, value, onChange }: { label: string; helper?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      {helper && <small className="helper-text">{helper}</small>}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

function SupportNotice() {
  return (
    <div className="danger-notice">
      この記録には、ひとりで抱え込まない方がよい内容が含まれている可能性があります。命に関わる可能性がある場合は、すぐに119番、近くの救急外来、または信頼できる人に連絡してください。このアプリは医療機関や専門家の支援を代わりに行うものではありません。
    </div>
  );
}

function TagList({ tags, empty }: { tags: string[]; empty: string }) {
  if (!tags.length) return <p className="tag-empty">{empty}</p>;
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="empty empty-box">{text}</p>;
}

function MiniTrend({ title, values, labels, max = 10 }: { title: string; values: Array<number | null | undefined>; labels: string[]; max?: number }) {
  const points = values
    .map((value, index) => ({ value, label: labels[index] }))
    .filter((point): point is { value: number; label: string } => isFiniteNumber(point.value));
  return (
    <div className="trend">
      <h3>{title}</h3>
      <div className="bars">
        {points.length === 0 && <p className="empty">記録がまだありません</p>}
        {points.map((point, index) => (
          <div className="bar-wrap" key={`${point.label}-${index}`}>
            <div className="bar" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} />
            <small>{point.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyValueList({ title, items, suffix }: { title: string; items: [string, string | number][]; suffix: string }) {
  return (
    <div className="kv-list">
      <h3>{title}</h3>
      {items.length === 0 && <p className="empty">記録がまだありません</p>}
      {items.slice(0, 6).map(([key, value]) => (
        <div className="kv-row" key={key}>
          <span>{key}</span>
          <strong>{value}{suffix}</strong>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className="insight-card">
      <div className="insight-card-head">
        <span>{insight.group === "daily" ? "日々の記録" : insight.group === "sudden" ? "突発ログ" : "セルフケア"}</span>
        <strong>{insight.relatedCount}件</strong>
      </div>
      <h3>{insight.title}</h3>
      <p>{insight.description}</p>
      <div className="insight-action">
        <span>参考アクション</span>
        <p>{insight.action}</p>
      </div>
      <small>{insight.note}</small>
    </article>
  );
}

function formatAverage(values: Array<number | null | undefined>) {
  const valid = values.filter(isFiniteNumber);
  if (!valid.length) return "-";
  return (valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1);
}

function formatScore(value: number | null | undefined) {
  return isFiniteNumber(value) ? `${value}/10` : "未入力";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validSleepHours(records: DailyRecord[]) {
  return records.map((record) => record.sleepHours).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function formatSleepHours(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${value}h` : "未入力";
}

function hasSleepHours(record: DailyRecord) {
  return typeof record.sleepHours === "number" && Number.isFinite(record.sleepHours);
}

function hasLargeWaveScore(record: DailyRecord) {
  return (isFiniteNumber(record.mood) && record.mood <= 3)
    || (isFiniteNumber(record.anxiety) && record.anxiety >= 8)
    || (isFiniteNumber(record.fatigue) && record.fatigue >= 8);
}

function parseSleepHoursInput(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function daysAgo(date: string) {
  const start = new Date(today()).getTime();
  const target = new Date(date).getTime();
  return Math.floor((start - target) / 86400000);
}

function toDateTimeLocal(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function countBy<T>(items: T[], keyer: (item: T) => string): [string, number][] {
  return countFlat(items.map(keyer));
}

function countFlat(items: string[]): [string, number][] {
  const map = new Map<string, number>();
  items.filter(Boolean).forEach((item) => map.set(item, (map.get(item) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function groupedAverage<T>(items: T[], keyer: (item: T) => string, valuer: (item: T) => number | null | undefined): [string, string][] {
  const groups = new Map<string, Array<number | null | undefined>>();
  items.forEach((item) => {
    const key = keyer(item);
    groups.set(key, [...(groups.get(key) || []), valuer(item)]);
  });
  return [...groups.entries()].map(([key, values]) => [key, formatAverage(values)]);
}

function calculateInsights(dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[]) {
  return [
    ...calculateSleepInsights(dailyRecords),
    ...calculateWeatherInsights(dailyRecords),
    ...calculateActivityInsights(dailyRecords),
    ...calculateSocialInsights(dailyRecords),
    ...calculateSuddenLogInsights(suddenLogs),
    ...calculateSelfCareInsights(selfCareLogs),
  ].slice(0, 8);
}

function calculateSleepInsights(records: DailyRecord[]): Insight[] {
  const recent = records.filter((record) => daysAgo(record.date) < 30 && hasSleepHours(record));
  if (recent.length < 3) return [];
  const short = recent.filter((record) => record.sleepHours! < 5);
  const mid = recent.filter((record) => record.sleepHours! >= 5 && record.sleepHours! < 7);
  const long = recent.filter((record) => record.sleepHours! >= 7);
  const usual = [...mid, ...long];
  if (short.length < 2 || usual.length < 2) return [];

  const shortAnxiety = average(short.map((record) => record.anxiety));
  const usualAnxiety = average(usual.map((record) => record.anxiety));
  const shortFatigue = average(short.map((record) => record.fatigue));
  const usualFatigue = average(usual.map((record) => record.fatigue));
  const shortMood = average(short.map((record) => record.mood));
  const usualMood = average(usual.map((record) => record.mood));
  const hasWave = shortAnxiety - usualAnxiety >= 0.8 || shortFatigue - usualFatigue >= 0.8 || usualMood - shortMood >= 0.8;
  if (!hasWave) return [];

  return [{
    id: "sleep-short",
    group: "daily",
    title: "睡眠が短い日は、状態の波が大きめに記録されています",
    description: `過去30日間では、睡眠5時間未満の日が${short.length}件あります。不安感${shortAnxiety.toFixed(1)}/10、疲労${shortFatigue.toFixed(1)}/10、気分${shortMood.toFixed(1)}/10として記録されています。`,
    relatedCount: short.length,
    action: "睡眠時間、寝る前のスマホ、カフェイン、翌日の予定などを一緒に見直す材料にできます。",
    note: "記録上の傾向です。原因を断定するものではありません。",
  }];
}

function calculateWeatherInsights(records: DailyRecord[]): Insight[] {
  const recent = records.filter((record) => daysAgo(record.date) < 30);
  if (recent.length < 3) return [];
  const overallMood = average(recent.map((record) => record.mood));
  const overallAnxiety = average(recent.map((record) => record.anxiety));
  const groups = groupItems(recent, (record) => record.weather);

  return [...groups.entries()].flatMap(([weather, items]) => {
    if (items.length < 2) return [];
    const mood = average(items.map((record) => record.mood));
    const anxiety = average(items.map((record) => record.anxiety));
    if (overallMood - mood < 0.8 && anxiety - overallAnxiety < 0.8) return [];
    return [{
      id: `weather-${weather}`,
      group: "daily" as const,
      title: `${weather}の日は、状態の波が少し見えています`,
      description: `過去30日間の${weather}の日は${items.length}件で、気分平均${mood.toFixed(1)}/10、不安感平均${anxiety.toFixed(1)}/10です。`,
      relatedCount: items.length,
      action: "天気、予定量、睡眠、外出しやすさを並べて見ると、相談時の材料にできます。",
      note: "記録上の傾向です。天気だけが理由とは限りません。",
    }];
  }).slice(0, 2);
}

function calculateActivityInsights(records: DailyRecord[]): Insight[] {
  const recent = records.filter((record) => daysAgo(record.date) < 30);
  if (recent.length < 3) return [];
  const insights: Insight[] = [];
  const active = recent.filter((record) => record.exercise !== "なし");
  const inactive = recent.filter((record) => record.exercise === "なし");
  if (active.length >= 2 && inactive.length >= 2) {
    const activeMood = average(active.map((record) => record.mood));
    const inactiveMood = average(inactive.map((record) => record.mood));
    const activeAnxiety = average(active.map((record) => record.anxiety));
    const inactiveAnxiety = average(inactive.map((record) => record.anxiety));
    if (Math.abs(activeMood - inactiveMood) >= 0.8 || Math.abs(activeAnxiety - inactiveAnxiety) >= 0.8) {
      insights.push({
        id: "activity-exercise",
        group: "daily",
        title: "体を動かした日と、状態の記録に違いがあります",
        description: `運動ありの日は${active.length}件、運動なしの日は${inactive.length}件です。気分は${activeMood.toFixed(1)}と${inactiveMood.toFixed(1)}、不安感は${activeAnxiety.toFixed(1)}と${inactiveAnxiety.toFixed(1)}です。`,
        relatedCount: active.length + inactive.length,
        action: "散歩や軽い運動が合う日、休む方が合う日を分けて振り返れます。",
        note: "関連している可能性があります。無理に増やす必要はありません。",
      });
    }
  }

  const outside = recent.filter((record) => record.wentOut === "あり");
  const inside = recent.filter((record) => record.wentOut === "なし");
  if (outside.length >= 2 && inside.length >= 2) {
    const outsideMood = average(outside.map((record) => record.mood));
    const insideMood = average(inside.map((record) => record.mood));
    const outsideAnxiety = average(outside.map((record) => record.anxiety));
    const insideAnxiety = average(inside.map((record) => record.anxiety));
    if (Math.abs(outsideMood - insideMood) >= 0.8 || Math.abs(outsideAnxiety - insideAnxiety) >= 0.8) {
      insights.push({
        id: "activity-outside",
        group: "daily",
        title: "外出の有無と、状態の記録に違いがあります",
        description: `外出ありの日は${outside.length}件、外出なしの日は${inside.length}件です。気分と不安感の平均に少し差が見えています。`,
        relatedCount: outside.length + inside.length,
        action: "外に出る時間、予定の重さ、帰宅後の疲れを一緒に見直す材料にできます。",
        note: "記録上の傾向です。外出の良し悪しを決めるものではありません。",
      });
    }
  }

  const walks = recent.filter((record) => record.exercise === "散歩");
  const nonWalks = recent.filter((record) => record.exercise !== "散歩");
  if (walks.length >= 2 && nonWalks.length >= 2) {
    const walkMood = average(walks.map((record) => record.mood));
    const otherMood = average(nonWalks.map((record) => record.mood));
    if (Math.abs(walkMood - otherMood) >= 0.8) {
      insights.push({
        id: "activity-walk",
        group: "daily",
        title: "散歩した日の気分記録に違いがあります",
        description: `散歩した日は${walks.length}件で、気分平均は${walkMood.toFixed(1)}/10です。散歩していない日との違いが少し見えています。`,
        relatedCount: walks.length,
        action: "散歩の長さや時間帯を、合いやすい条件として見ていけます。",
        note: "参考情報として見てください。必ず合うという意味ではありません。",
      });
    }
  }
  return insights.slice(0, 2);
}

function calculateSocialInsights(records: DailyRecord[]): Insight[] {
  const recent = records.filter((record) => daysAgo(record.date) < 30);
  if (recent.length < 3) return [];
  const many = recent.filter((record) => record.socialContact === "多い" || record.socialContact === "普通");
  const few = recent.filter((record) => record.socialContact === "少ない" || record.socialContact === "なし");
  if (many.length < 2 || few.length < 2) return [];
  const manyFatigue = average(many.map((record) => record.fatigue));
  const fewFatigue = average(few.map((record) => record.fatigue));
  const manyAnxiety = average(many.map((record) => record.anxiety));
  const fewAnxiety = average(few.map((record) => record.anxiety));
  if (Math.abs(manyFatigue - fewFatigue) < 0.8 && Math.abs(manyAnxiety - fewAnxiety) < 0.8) return [];
  return [{
    id: "social-contact",
    group: "daily",
    title: "人との接触量と、疲労・不安感の記録に違いがあります",
    description: `接触が多め/普通の日は${many.length}件、少なめ/なしの日は${few.length}件です。疲労と不安感の平均に少し差があります。`,
    relatedCount: many.length + few.length,
    action: "会う人数、時間、休む時間の取り方を相談時の材料にできます。",
    note: "人と会うことの良し悪しを判断するものではありません。",
  }];
}

function calculateSuddenLogInsights(logs: SuddenLog[]): Insight[] {
  const recent = logs.filter((log) => daysAgo(log.occurredAt.slice(0, 10)) < 30);
  if (recent.length < 3) return [];
  const insights: Insight[] = [];
  const topTrigger = countFlat(recent.flatMap((log) => log.triggers))[0];
  const topTag = countFlat(recent.flatMap((log) => log.stateTags))[0];
  const topSymptom = countFlat(recent.flatMap((log) => log.symptoms))[0];
  const topDay = countBy(recent, (log) => ["日", "月", "火", "水", "木", "金", "土"][new Date(log.occurredAt).getDay()])[0];
  const topHour = countBy(recent, (log) => `${new Date(log.occurredAt).getHours()}時台`)[0];

  if (topTrigger && topTrigger[1] >= 2) {
    insights.push({
      id: "sudden-trigger",
      group: "sudden",
      title: "よく記録されるきっかけがあります",
      description: `過去30日間では「${topTrigger[0]}」が${topTrigger[1]}件記録されています。状態の波と関連している可能性があります。`,
      relatedCount: topTrigger[1],
      action: "その前後の睡眠、予定、連絡量を一緒に見直す材料にできます。",
      note: "原因を断定するものではありません。",
    });
  }
  if (topTag && topTag[1] >= 2) {
    insights.push({
      id: "sudden-tag",
      group: "sudden",
      title: "よく出る状態タグがあります",
      description: `「${topTag[0]}」が${topTag[1]}件記録されています。どんな場面で出やすいか振り返る材料にできます。`,
      relatedCount: topTag[1],
      action: "きっかけ、場所、身体のサインと並べて見ると整理しやすくなります。",
      note: "記録上の傾向です。",
    });
  }
  if (topSymptom && topSymptom[1] >= 2) {
    insights.push({
      id: "sudden-symptom",
      group: "sudden",
      title: "よく記録される身体のサインがあります",
      description: `「${topSymptom[0]}」が${topSymptom[1]}件記録されています。早めに気づく合図として使える可能性があります。`,
      relatedCount: topSymptom[1],
      action: "出やすい身体のサインを、医師や専門家に伝える材料にできます。",
      note: "診断ではなく、相談時の参考情報です。",
    });
  }
  if (topDay && topHour && (topDay[1] >= 2 || topHour[1] >= 2)) {
    insights.push({
      id: "sudden-time",
      group: "sudden",
      title: "記録されやすい曜日や時間帯があります",
      description: `${topDay[0]}曜日、または${topHour[0]}の記録がやや多めです。予定や休み方と関連している可能性があります。`,
      relatedCount: Math.max(topDay[1], topHour[1]),
      action: "その時間帯の前後に、予定を少し軽くする余地があるか見直せます。",
      note: "参考情報として見てください。",
    });
  }
  return insights.slice(0, 3);
}

function calculateSelfCareInsights(logs: SelfCareLog[]): Insight[] {
  const recent = logs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < 30);
  if (recent.length < 3) return [];
  const insights: Insight[] = [];
  const topCare = countBy(recent, (log) => log.title)[0];
  const settled = countBy(recent.filter((log) => log.result === "少し整った"), (log) => log.title)[0];
  const notFit = countBy(recent.filter((log) => log.result === "今は合わなかった"), (log) => log.title)[0];

  if (topCare && topCare[1] >= 2) {
    insights.push({
      id: "care-frequent",
      group: "selfcare",
      title: "よく使っているセルフケアがあります",
      description: `「${topCare[0]}」が${topCare[1]}件記録されています。自分が選びやすい整え方として見えてきています。`,
      relatedCount: topCare[1],
      action: "どんな状態の日に選びやすいか、突発ログや日々の記録と一緒に見られます。",
      note: "記録上の傾向です。効果を断定するものではありません。",
    });
  }
  if (settled && settled[1] >= 2) {
    insights.push({
      id: "care-settled",
      group: "selfcare",
      title: "整いやすい可能性があるセルフケアがあります",
      description: `「${settled[0]}」は、実行後に「少し整った」と${settled[1]}件記録されています。`,
      relatedCount: settled[1],
      action: "合いやすい条件や時間帯をメモしておくと、相談時の材料になります。",
      note: "合いやすい可能性があります。必ず同じ結果になるとは限りません。",
    });
  }
  if (notFit && notFit[1] >= 2) {
    insights.push({
      id: "care-not-fit",
      group: "selfcare",
      title: "今の状態では合いにくい日があるかもしれません",
      description: `「${notFit[0]}」は、「今は合わなかった」と${notFit[1]}件記録されています。`,
      relatedCount: notFit[1],
      action: "タイミングや負担感を見直し、別の小さな行動候補も並べておけます。",
      note: "参考情報として見てください。無理に続ける必要はありません。",
    });
  }
  return insights.slice(0, 3);
}

function groupItems<T>(items: T[], keyer: (item: T) => string) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyer(item);
    groups.set(key, [...(groups.get(key) || []), item]);
  });
  return groups;
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter(isFiniteNumber);
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function firstKey(items: [string, number][]) {
  return items[0]?.[0] || "記録なし";
}

function navGroup(screen: Screen) {
  if (screen === "daily" || screen === "sudden" || screen === "records") return "recordHub";
  if (screen === "analysis" || screen === "report") return "review";
  if (screen === "consultation" || screen === "data" || screen === "privacy" || screen === "about") return "menu";
  return screen;
}

function createConsultationDraft(): ConsultationNote {
  const timestamp = nowIso();
  return {
    id: newId(),
    title: "",
    target: "doctor",
    status: "draft",
    mainTopic: "",
    recentConcern: "",
    waveMemo: "",
    lifestyleMemo: "",
    dontForgetMemo: "",
    includeInReport: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildConsultationSummary(period: number, dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[], notes: ConsultationNote[]) {
  const daily = dailyRecords.filter((record) => daysAgo(record.date) < period);
  const sudden = suddenLogs.filter((log) => daysAgo(log.occurredAt.slice(0, 10)) < period);
  const care = selfCareLogs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < period);
  const insights = calculateInsights(daily, sudden, care);
  const waveDays = daily.filter(hasLargeWaveScore).map((record) => record.date).join("、") || "目立つ記録なし";
  const topTags = countFlat(sudden.flatMap((log) => log.stateTags)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topTriggers = countFlat(sudden.flatMap((log) => log.triggers)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topSymptoms = countFlat(sudden.flatMap((log) => log.symptoms)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topCare = countBy(care, (log) => log.title).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const settledCare = countBy(care.filter((log) => log.result === "少し整った"), (log) => log.title).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const noteLines = notes.length
    ? notes.slice(0, 8).map((note) => `- ${note.title || "相談メモ"}（${targetLabel(note.target)} / ${statusLabel(note.status)}）: ${note.mainTopic || note.recentConcern || note.dontForgetMemo || "内容未記入"}`).join("\n")
    : "相談メモはまだありません。";
  const insightLines = insights.length
    ? insights.slice(0, 6).map((insight) => `- ${insight.title}: ${insight.description} ${insight.note}`).join("\n")
    : "記録が少ないため、傾向は参考程度です。もう少し記録が増えると、状態の波が見えやすくなります。";

  return `以下は、過去${period}日間のセルフ記録をもとにした相談用メモです。診断や治療判断ではなく、相談時に状態を伝えるための参考情報として作成しています。

期間内の気分平均: ${formatAverage(daily.map((record) => record.mood))}/10
期間内の不安感平均: ${formatAverage(daily.map((record) => record.anxiety))}/10
睡眠時間の平均: ${formatAverage(validSleepHours(daily))}時間
状態の波が大きかった日: ${waveDays}
多かった状態タグ: ${topTags}
多かったきっかけ: ${topTriggers}
多かった身体のサイン: ${topSymptoms}
よく使ったセルフケア: ${topCare}
整いやすい可能性があったセルフケア: ${settledCare}

記録から見える傾向:
${insightLines}

保存した相談メモ:
${noteLines}

次回相談時に伝えたいこと:
記録上の傾向です。原因を断定するものではありません。相談時の材料として使えます。`;
}

function buildSingleConsultationSummary(note: ConsultationNote) {
  return `相談メモです。この内容は診断や治療判断ではなく、相談時に伝える材料として整理しています。

タイトル: ${note.title}
相談先の種類: ${targetLabel(note.target)}
ステータス: ${statusLabel(note.status)}
相談したいこと: ${note.mainTopic || "未記入"}
最近気になっていること: ${note.recentConcern || "未記入"}
状態の波が大きかった場面: ${note.waveMemo || "未記入"}
生活面で気になっていること: ${note.lifestyleMemo || "未記入"}
話し忘れたくないこと: ${note.dontForgetMemo || "未記入"}`;
}

function buildConsultationAiPrompt(summary: string) {
  return `以下は相談前に整理したセルフ記録と相談メモです。
診断しないでください。
治療判断をしないでください。
服薬やサプリの指示はしないでください。
記録上の傾向として整理してください。
医師や専門家に相談した方がよい点を分けてください。
生活面で見直せそうな候補があれば、断定せずに提示してください。

${summary}`;
}

function targetLabel(target: ConsultationTarget) {
  const labels: Record<ConsultationTarget, string> = {
    doctor: "医師",
    counselor: "カウンセラー",
    family: "家族",
    partner: "パートナー",
    friend: "友人",
    ai: "AI相談",
    other: "その他",
  };
  return labels[target];
}

function targetFromLabel(label: string): ConsultationTarget {
  return consultationTargets.find((target) => targetLabel(target) === label) || "doctor";
}

function statusLabel(status: ConsultationStatus) {
  const labels: Record<ConsultationStatus, string> = {
    draft: "未整理",
    planned: "相談予定",
    done: "相談済み",
    pending: "保留",
  };
  return labels[status];
}

function statusFromLabel(label: string): ConsultationStatus {
  return consultationStatuses.find((status) => statusLabel(status) === label) || "draft";
}

function defaultPrivacySettings(): PrivacySettings {
  return {
    isLockEnabled: false,
    passcodeHash: "",
    autoLockMinutes: 5,
    privateDisplayMode: false,
    updatedAt: nowIso(),
  };
}

function normalizePrivacySettings(settings: Partial<PrivacySettings>): PrivacySettings {
  return {
    isLockEnabled: Boolean(settings.isLockEnabled && settings.passcodeHash),
    passcodeHash: settings.passcodeHash || "",
    autoLockMinutes: normalizeAutoLock(settings.autoLockMinutes),
    privateDisplayMode: Boolean(settings.privateDisplayMode),
    updatedAt: settings.updatedAt || nowIso(),
  };
}

function normalizeImportedPrivacySettings(settings: BackupPrivacySettings | undefined, current: PrivacySettings): PrivacySettings {
  if (!settings) return current;
  return {
    ...current,
    isLockEnabled: false,
    passcodeHash: "",
    autoLockMinutes: normalizeAutoLock(settings.autoLockMinutes),
    privateDisplayMode: Boolean(settings.privateDisplayMode),
    updatedAt: nowIso(),
  };
}

function toBackupPrivacySettings(settings: PrivacySettings): BackupPrivacySettings {
  return {
    isLockEnabled: false,
    autoLockMinutes: settings.autoLockMinutes,
    privateDisplayMode: settings.privateDisplayMode,
    passcodeIncluded: false,
    updatedAt: settings.updatedAt,
  };
}

function normalizeAutoLock(value: unknown): AutoLockMinutes {
  return [1, 5, 15, 30, 0].includes(value as number) ? (value as AutoLockMinutes) : 5;
}

function autoLockLabel(value: AutoLockMinutes) {
  if (value === 0) return "自動ロックしない";
  return `${value}分`;
}

function autoLockFromLabel(label: string): AutoLockMinutes {
  if (label === "1分") return 1;
  if (label === "15分") return 15;
  if (label === "30分") return 30;
  if (label === "自動ロックしない") return 0;
  return 5;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

async function hashPasscode(passcode: string) {
  const text = `self-compass-lock:${passcode}`;
  if (crypto.subtle) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  let hash = 5381;
  for (const char of text) hash = (hash * 33) ^ char.charCodeAt(0);
  return `fallback-${(hash >>> 0).toString(16)}`;
}

function downloadBackup(backup: BackupData) {
  downloadTextFile(`mental-health-record-backup-${today()}.json`, JSON.stringify(backup, null, 2), "application/json;charset=utf-8");
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeBackupData(data: unknown): BackupData {
  if (Array.isArray(data)) {
    return {
      app: { name: "Self Compass", version: appVersion, exportedAt: nowIso() },
      dailyRecords: data.map((record) => normalizeDailyRecord(record as Partial<DailyRecord>)),
      suddenLogs: [],
      selfCarePlans: [],
      selfCareLogs: [],
      consultationNotes: [],
      privacySettings: toBackupPrivacySettings(defaultPrivacySettings()),
    };
  }

  if (!data || typeof data !== "object") throw new Error("Invalid backup");
  const source = data as {
    dailyRecords?: Partial<DailyRecord>[];
    suddenLogs?: Partial<SuddenLog>[];
    selfCarePlans?: Partial<SelfCarePlan>[];
    selfCareLogs?: Partial<SelfCareLog>[];
    consultationNotes?: Partial<ConsultationNote>[];
    privacySettings?: BackupPrivacySettings;
    daily?: Partial<DailyRecord>[];
    sudden?: Partial<SuddenLog>[];
  };
  const daily = source.dailyRecords || source.daily;
  const sudden = source.suddenLogs || source.sudden;
  const plans = source.selfCarePlans || [];
  const logs = source.selfCareLogs || [];
  const notes = source.consultationNotes || [];
  if (!Array.isArray(daily) || !Array.isArray(sudden)) throw new Error("Invalid backup");

  return {
    app: { name: "Self Compass", version: appVersion, exportedAt: nowIso() },
    dailyRecords: daily.map(normalizeDailyRecord),
    suddenLogs: sudden.map(normalizeSuddenLog),
    selfCarePlans: Array.isArray(plans) ? plans.map(normalizeSelfCarePlan) : [],
    selfCareLogs: Array.isArray(logs) ? logs.map(normalizeSelfCareLog) : [],
    consultationNotes: Array.isArray(notes) ? notes.map(normalizeConsultationNote) : [],
    privacySettings: source.privacySettings ? {
      isLockEnabled: false,
      autoLockMinutes: normalizeAutoLock(source.privacySettings.autoLockMinutes),
      privateDisplayMode: Boolean(source.privacySettings.privateDisplayMode),
      passcodeIncluded: false,
      updatedAt: source.privacySettings.updatedAt || nowIso(),
    } : toBackupPrivacySettings(defaultPrivacySettings()),
  };
}

function toDailyCsv(records: DailyRecord[]) {
  const rows = [
    ["記録日", "気分", "不安度", "イライラ度", "疲労度", "睡眠時間", "睡眠の質", "天気", "食事", "運動", "外出", "人との接触", "薬・サプリ", "今日の主な出来事", "今日のメモ"],
    ...records.map((record) => [
      record.date,
      record.mood,
      record.anxiety,
      record.irritability,
      record.fatigue,
      record.sleepHours ?? "未入力",
      record.sleepQuality,
      record.weather,
      record.meal,
      record.exercise,
      record.wentOut,
      record.socialContact,
      record.medicine,
      record.events,
      record.memo,
    ]),
  ];
  return `\uFEFF${rows.map(csvRow).join("\n")}`;
}

function toSuddenCsv(logs: SuddenLog[]) {
  const rows = [
    ["発生日時", "状態タグ", "強さ", "直前にあったこと", "場所", "身体のサイン", "頭に浮かんだ言葉・思考", "実際に取った行動", "対処後の変化", "メモ"],
    ...logs.map((log) => [
      formatDateTime(log.occurredAt),
      joinTags(log.stateTags),
      log.intensity,
      log.triggers.join("、"),
      log.place,
      log.symptoms.join("、"),
      log.thoughts,
      log.actions.join("、"),
      log.afterChange,
      log.memo,
    ]),
  ];
  return `\uFEFF${rows.map(csvRow).join("\n")}`;
}

function toSelfCareCsv(logs: SelfCareLog[]) {
  const rows = [
    ["実行日時", "セルフケア名", "カテゴリ", "実行後の感じ方", "メモ"],
    ...logs.map((log) => [formatDateTime(log.createdAt), log.title, log.category, log.result, log.memo]),
  ];
  return `\uFEFF${rows.map(csvRow).join("\n")}`;
}

function toConsultationCsv(notes: ConsultationNote[]) {
  const rows = [
    ["作成日", "更新日", "タイトル", "相談先の種類", "ステータス", "相談したいこと", "最近気になっていること", "状態の波が大きかった場面", "生活面で気になっていること", "話し忘れたくないこと"],
    ...notes.map((note) => [
      formatDateTime(note.createdAt),
      formatDateTime(note.updatedAt),
      note.title,
      targetLabel(note.target),
      statusLabel(note.status),
      note.mainTopic,
      note.recentConcern,
      note.waveMemo,
      note.lifestyleMemo,
      note.dontForgetMemo,
    ]),
  ];
  return `\uFEFF${rows.map(csvRow).join("\n")}`;
}

function csvRow(values: Array<string | number | null>) {
  return values.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",");
}

function normalizeDailyRecord(record: Partial<DailyRecord>): DailyRecord {
  const timestamp = record.createdAt || nowIso();
  return {
    id: record.id || newId(),
    date: record.date || today(),
    mood: normalizeScore(record.mood),
    anxiety: normalizeScore(record.anxiety),
    irritability: normalizeScore(record.irritability),
    fatigue: normalizeScore(record.fatigue),
    sleepHours: typeof record.sleepHours === "number" && Number.isFinite(record.sleepHours) ? record.sleepHours : null,
    sleepQuality: record.sleepQuality || "普通",
    weather: record.weather || "その他",
    meal: record.meal || "普通",
    exercise: record.exercise || "なし",
    wentOut: record.wentOut || "なし",
    socialContact: record.socialContact || "普通",
    medicine: record.medicine || "該当なし",
    events: record.events || "",
    memo: record.memo || "",
    createdAt: timestamp,
    updatedAt: record.updatedAt || timestamp,
  };
}

function normalizeSuddenLog(log: Partial<SuddenLog>): SuddenLog {
  const timestamp = log.createdAt || nowIso();
  const stateTags = normalizeStateTags(log.stateTags, log.stateType);
  return {
    id: log.id || newId(),
    occurredAt: log.occurredAt || nowIso(),
    stateTags,
    stateType: log.stateType,
    intensity: normalizeScore(log.intensity),
    riskLevel: log.riskLevel,
    triggers: log.triggers || [],
    place: log.place || "自宅",
    symptoms: log.symptoms || [],
    thoughts: log.thoughts || "",
    actions: log.actions || [],
    afterChange: normalizeAfterChange(log.afterChange),
    memo: log.memo || "",
    createdAt: timestamp,
    updatedAt: log.updatedAt || timestamp,
  };
}

function normalizeSelfCarePlan(plan: Partial<SelfCarePlan>): SelfCarePlan {
  const timestamp = plan.createdAt || nowIso();
  return {
    id: plan.id || newId(),
    title: plan.title || "セルフケア",
    category: normalizeSelfCareCategory(plan.category),
    memo: plan.memo || "",
    createdAt: timestamp,
    updatedAt: plan.updatedAt || timestamp,
  };
}

function normalizeSelfCareLog(log: Partial<SelfCareLog>): SelfCareLog {
  return {
    id: log.id || newId(),
    planId: log.planId || "",
    title: log.title || "セルフケア",
    category: normalizeSelfCareCategory(log.category),
    result: normalizeSelfCareResult(log.result),
    memo: log.memo || "",
    createdAt: log.createdAt || nowIso(),
  };
}

function normalizeConsultationNote(note: Partial<ConsultationNote>): ConsultationNote {
  const timestamp = note.createdAt || nowIso();
  return {
    id: note.id || newId(),
    title: note.title || "相談メモ",
    target: consultationTargets.includes(note.target as ConsultationTarget) ? (note.target as ConsultationTarget) : "doctor",
    status: consultationStatuses.includes(note.status as ConsultationStatus) ? (note.status as ConsultationStatus) : "draft",
    mainTopic: note.mainTopic || "",
    recentConcern: note.recentConcern || "",
    waveMemo: note.waveMemo || "",
    lifestyleMemo: note.lifestyleMemo || "",
    dontForgetMemo: note.dontForgetMemo || "",
    includeInReport: note.includeInReport ?? true,
    createdAt: timestamp,
    updatedAt: note.updatedAt || timestamp,
  };
}

function normalizeSelfCareCategory(category?: string): SelfCareCategory {
  return selfCareCategories.includes(category as SelfCareCategory) ? (category as SelfCareCategory) : "体を整える";
}

function normalizeSelfCareResult(result?: string): SelfCareResult {
  const options: SelfCareResult[] = ["少し整った", "変化は少なめ", "今は合わなかった", "後で振り返る"];
  return options.includes(result as SelfCareResult) ? (result as SelfCareResult) : "後で振り返る";
}

function normalizeScore(value: unknown) {
  if (!isFiniteNumber(value)) return null;
  return Math.min(10, Math.max(1, Math.round(value)));
}

function normalizeStateTags(tags?: string[], legacyState?: string) {
  const source = tags?.length ? tags : legacyState ? [legacyState] : [];
  return source.map(mapLegacyStateTag).filter(Boolean);
}

function mapLegacyStateTag(tag: string) {
  const map: Record<string, string> = {
    強い不安: "不安感",
    パニック: "そわそわ",
    怒り: "いらだち",
    涙が止まらない: "涙が出る",
    無気力: "動きにくさ",
    孤独感: "ひとり感",
    希死念慮: "命に関わる考え",
    自傷衝動: "自分を傷つけたい感覚",
    過食衝動: "食べたい衝動",
  };
  return map[tag] || tag;
}

function normalizeAfterChange(value?: SuddenLog["afterChange"] | "悪化した") {
  if (value === "悪化した") return "落ち着かなかった";
  return value || "変わらない";
}

function joinTags(tags: string[]) {
  return tags.length ? tags.join("、") : "未記入";
}

function shortText(text: string) {
  if (!text) return "未記入";
  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}
