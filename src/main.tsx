import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type SleepQuality = "良い" | "普通" | "悪い";
type DailyChoice = "晴れ" | "曇り" | "雨" | "雪" | "その他";
type RiskLevel = "低" | "中" | "高";

type SampleMeta = {
  sample?: boolean;
  source?: "sample";
  sampleBatchId?: string;
};

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
  thoughtTags?: string[];
  createdAt: string;
  updatedAt: string;
} & SampleMeta;

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
} & SampleMeta;

type SelfCareCategory = "体を整える" | "環境を整える" | "思考を整理する" | "人とつながる" | "休む" | "習慣を見直す";
type SelfCareResult = "少し整った" | "変化は少なめ" | "今は合わなかった" | "後で振り返る";
type IfThenCategory = SelfCareCategory | "記録する" | "その他";
type IfThenEase = "すぐできそう" | "少し準備が必要" | "今は小さくした方がよさそう";

type SelfCarePlan = {
  id: string;
  title: string;
  category: SelfCareCategory;
  memo: string;
  createdAt: string;
  updatedAt: string;
} & SampleMeta;

type SelfCareLog = {
  id: string;
  planId: string;
  title: string;
  category: SelfCareCategory;
  result: SelfCareResult;
  memo: string;
  createdAt: string;
} & SampleMeta;

type IfThenPlan = {
  id: string;
  title: string;
  ifText: string;
  thenText: string;
  category: IfThenCategory;
  relatedStateTags: string[];
  relatedThoughtTags: string[];
  ease: IfThenEase;
  memo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} & SampleMeta;

type IfThenPrefill = Partial<Pick<IfThenPlan, "title" | "ifText" | "thenText" | "category" | "relatedStateTags" | "relatedThoughtTags" | "memo">>;

type IfThenLog = {
  id: string;
  planId: string;
  planTitle: string;
  ifText: string;
  thenText: string;
  fitScore: number | null;
  easeScore: number | null;
  legacyResult?: SelfCareResult;
  memo: string;
  createdAt: string;
} & SampleMeta;

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
} & SampleMeta;

type ThoughtNote = {
  id: string;
  date: string;
  situation: string;
  thought: string;
  emotion: string;
  intensity: number | null;
  thoughtTags: string[];
  alternativeView: string;
  selfCompassion: string;
  relatedAction: string;
  memo: string;
  sourceLogId?: string;
  createdAt: string;
  updatedAt: string;
} & SampleMeta;

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

type ReminderTimeType = "朝" | "昼" | "夕方" | "夜" | "自由入力";
type WeeklyGoalType = "週に1回" | "週に3回" | "できる日に記録する" | "カスタム";

type HabitSettings = {
  enabled: boolean;
  reminderTimeType: ReminderTimeType;
  customReminderTime: string;
  reminderMessage: string;
  weeklyGoalType: WeeklyGoalType;
  customWeeklyGoal: number;
  updatedAt: string;
} & SampleMeta;

type ReminderDismissal = {
  date: string;
  dismissedAt: string;
};

type DisplayTheme = "standard" | "soft" | "clear";
type DisplayFontSize = "standard" | "large" | "xlarge";

type DisplaySettings = {
  theme: DisplayTheme;
  fontSize: DisplayFontSize;
  updatedAt: string;
};

type DemoDisplayMode = "all" | "realOnly" | "sampleOnly";

type DemoDisplaySettings = {
  mode: DemoDisplayMode;
  isDemoModeEnabled: boolean;
  updatedAt: string;
};

type Insight = {
  id: string;
  title: string;
  description: string;
  relatedCount: number;
  action: string;
  note: string;
  group: "daily" | "sudden" | "selfcare" | "thought" | "ifthen";
};

type StabilityPart = {
  key: "basic" | "sleep" | "lifestyle" | "wave" | "thought" | "selfcare" | "ifthen" | "recording";
  label: string;
  score: number | null;
  note: string;
};

type StabilityScore = {
  score: number | null;
  parts: StabilityPart[];
  isReference: boolean;
  note: string;
  supportText: string;
  waveText: string;
};

type MonthlyReflection = {
  summary: string;
  sections: {
    overall: string;
    sleep: string;
    anxiety: string;
    activity: string;
    suddenLogs: string;
    thoughtNotes: string;
    selfCare: string;
    ifThen: string;
    nextHint: string;
  };
  hasEnoughData: boolean;
  topTrigger: string;
  topStateTag: string;
  topThoughtTag: string;
  topSelfCare: string;
  topIfThen: string;
};

type Screen = "home" | "recordHub" | "daily" | "sudden" | "records" | "review" | "analysis" | "report" | "calendar" | "data" | "selfcare" | "consultation" | "privacy" | "menu" | "about" | "habit" | "display" | "thought" | "ifthen" | "metricDetail";
type MetricType = "sleep" | "anxiety" | "activity";
type ChartMetricType = MetricType | "mood" | "stability";
type TrendRange = "month" | "week" | "day";
type TrendPoint = { label: string; value: number | null; date: string; isActive?: boolean; showLabel?: boolean; count?: number };
type MonthChartView = "bar" | "ring";
type CalendarView = "calendar" | "ring" | "bar";
type DailyRingData = {
  date: string;
  day: number;
  moodScore: number | null;
  anxietyScore: number | null;
  stabilityScore: number | null;
  sleepScore: number | null;
  sleepHours: number | null;
  activityScore: number | null;
  hasDailyRecord: boolean;
  isToday: boolean;
  isMissing: boolean;
  suddenLogCount: number;
  thoughtNoteCount: number;
  ifThenLogCount: number;
  selfCareLogCount: number;
};
type RingMonthlySummary = {
  recordDays: number;
  averageStability: number | null;
  averageSleep: number | null;
  activityDays: number;
  suddenCount: number;
  thoughtCount: number;
  ifThenCount: number;
  selfCareCount: number;
};
type RecordsTab = "daily" | "sudden";
type DetailItem = { kind: "daily"; record: DailyRecord } | { kind: "sudden"; record: SuddenLog };
type PendingDelete = { kind: "daily"; id: string } | { kind: "sudden"; id: string } | { kind: "selfcare"; id: string } | { kind: "consultation"; id: string } | { kind: "thought"; id: string } | { kind: "ifthen"; id: string } | { kind: "all" };
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
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  consultationNotes: ConsultationNote[];
  thoughtNotes: ThoughtNote[];
  privacySettings: BackupPrivacySettings;
  habitSettings: HabitSettings;
  reminderDismissals: ReminderDismissal[];
  displaySettings: DisplaySettings;
  demoDisplaySettings: DemoDisplaySettings;
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
const ifThenPlansStorageKey = "ifThenPlans";
const ifThenLogsStorageKey = "ifThenLogs";
const consultationNotesStorageKey = "consultationNotes";
const thoughtNotesStorageKey = "thoughtNotes";
const privacySettingsStorageKey = "privacySettings";
const introCompletedStorageKey = "introCompleted";
const introCompletedAtStorageKey = "introCompletedAt";
const onboardingCompletedStorageKey = "onboardingCompleted";
const onboardingCompletedAtStorageKey = "onboardingCompletedAt";
const dailyDraftKey = "dailyRecordDraft";
const suddenDraftKey = "suddenLogDraft";
const consultationDraftKey = "consultationNoteDraft";
const thoughtDraftKey = "thoughtNoteDraft";
const ifThenDraftKey = "ifThenPlanDraft";
const selfCareDraftKey = "selfCareDraft";
const habitSettingsStorageKey = "habitSettings";
const reminderDismissalsStorageKey = "reminderDismissals";
const displaySettingsStorageKey = "displaySettings";
const demoDisplaySettingsStorageKey = "demoDisplaySettings";
const appVersion = "0.1.0";
const appUpdatedAt = "2026-06-21";

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
const ifThenCategories: IfThenCategory[] = ["体を整える", "環境を整える", "思考を整理する", "人とつながる", "休む", "記録する", "その他"];
const ifThenEaseOptions: IfThenEase[] = ["すぐできそう", "少し準備が必要", "今は小さくした方がよさそう"];
const reminderTimeTypes: ReminderTimeType[] = ["朝", "昼", "夕方", "夜", "自由入力"];
const weeklyGoalTypes: WeeklyGoalType[] = ["週に1回", "週に3回", "できる日に記録する", "カスタム"];
const displayThemes: DisplayTheme[] = ["standard", "soft", "clear"];
const displayFontSizes: DisplayFontSize[] = ["standard", "large", "xlarge"];
const thoughtTagOptions = ["自分を責める", "白黒で考える", "先のことを考えすぎる", "悪い方に決めつける", "相手の気持ちを読みすぎる", "すべきが強くなる", "完璧にやろうとする", "一度のことを全部に広げる", "よい面を見落とす", "比べすぎる", "早く答えを出そうとする", "その他"];
const defaultReminderMessages = [
  "今日の状態を少しだけ記録してみませんか？",
  "全部入力しなくても大丈夫です",
  "今の自分を短く残しておけます",
];
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
  { title: "頭に浮かんだ考えを書き出す", category: "思考を整理する", memo: "頭の中から一度外に置いてみる" },
  { title: "事実と想像を分ける", category: "思考を整理する", memo: "分かっていることと想像を分けて見る" },
  { title: "今できることだけに分ける", category: "思考を整理する", memo: "今日できる小さな単位に分ける" },
  { title: "自分に声をかける", category: "思考を整理する", memo: "友人に言うような短い言葉を選ぶ" },
  { title: "友人に言うなら何と言うか考える", category: "思考を整理する", memo: "少し距離を取るための問いかけ" },
  { title: "今日は結論を出さない", category: "思考を整理する", memo: "急いで答えを決めない時間を作る" },
  { title: "5分だけ置いておく", category: "思考を整理する", memo: "考えを少し横に置いてみる" },
  { title: "別の見方を1つだけ探す", category: "思考を整理する", memo: "無理のない範囲で見方を増やす" },
  { title: "信頼できる人に連絡する", category: "人とつながる", memo: "短い一言でも大丈夫" },
  { title: "予定を少し減らす", category: "休む", memo: "調整できる予定を見直す" },
  { title: "食事を整える", category: "習慣を見直す", memo: "食べやすいものを選ぶ" },
  { title: "カフェインを控えめにする", category: "習慣を見直す", memo: "合うかどうか記録で見ていく" },
  { title: "何もしない時間を作る", category: "休む", memo: "短い余白を作る" },
];

const ifThenExamples = [
  { ifText: "朝起きて体が重かったら", thenText: "カーテンを開けて、コップ1杯の水を飲む" },
  { ifText: "LINEの後に考えすぎていたら", thenText: "事実と想像を1つずつ分けてメモする" },
  { ifText: "曇りの日に気分が沈みやすかったら", thenText: "外の光を3分だけ浴びる" },
  { ifText: "自分を責める考えが出たら", thenText: "友人に言うなら何と言うかを1行だけ書く" },
  { ifText: "寝る前に考えが止まらなかったら", thenText: "今日は結論を出さないとメモして、画面を閉じる" },
];

const sampleBatchId = "self-compass-sample-month-v1";

type SampleDataBundle = {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  thoughtNotes: ThoughtNote[];
  selfCarePlans: SelfCarePlan[];
  selfCareLogs: SelfCareLog[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  consultationNotes: ConsultationNote[];
  habitSettings: HabitSettings;
};

function withSample<T extends object>(item: T): T & Required<Pick<SampleMeta, "sample" | "source" | "sampleBatchId">> {
  return { ...item, sample: true, source: "sample", sampleBatchId };
}

function sampleMetaFrom(item?: SampleMeta): SampleMeta {
  return item?.sample || item?.source === "sample" || item?.sampleBatchId ? {
    sample: Boolean(item.sample || item.source === "sample"),
    source: "sample",
    sampleBatchId: item.sampleBatchId || sampleBatchId,
  } : {};
}

function isSampleItem(item: unknown): item is SampleMeta {
  return Boolean(item && typeof item === "object" && ((item as SampleMeta).sample || (item as SampleMeta).source === "sample" || (item as SampleMeta).sampleBatchId === sampleBatchId));
}

function removeSampleItems<T>(items: T[]) {
  return items.filter((item) => !isSampleItem(item));
}

function sampleIso(date: string, hour: number, minute = 0) {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`).toISOString();
}

function buildSampleMonthDates() {
  const base = new Date();
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => localDateString(new Date(year, month, index + 1)));
}

function sampleDayNumber(date: string) {
  return Number(date.slice(8, 10));
}

function generateMonthlySampleData(): SampleDataBundle {
  const dates = buildSampleMonthDates();
  const createdAt = nowIso();
  const skippedDailyDays = new Set([6, 14, 23, 29].filter((day) => day <= dates.length));
  const weatherPattern: DailyChoice[] = ["晴れ", "曇り", "晴れ", "雨", "曇り", "晴れ", "晴れ", "雨", "曇り", "晴れ"];

  const dailyRecords = dates
    .filter((date) => !skippedDailyDays.has(sampleDayNumber(date)))
    .map((date): DailyRecord => {
      const day = sampleDayNumber(date);
      const weather = weatherPattern[day % weatherPattern.length];
      const shortSleep = day % 9 === 3 || day % 11 === 0;
      const walked = day % 3 === 0 || day % 7 === 1;
      const rainyWave = weather === "雨" || (weather === "曇り" && day % 4 === 0);
      const mood = Math.max(4, Math.min(9, 7 + (walked ? 1 : 0) - (rainyWave ? 1 : 0) - (shortSleep ? 1 : 0) + (day % 10 === 2 ? 1 : 0)));
      const anxiety = Math.max(2, Math.min(8, 4 + (rainyWave ? 2 : 0) + (shortSleep ? 1 : 0) - (walked ? 1 : 0)));
      const fatigue = Math.max(3, Math.min(9, 5 + (shortSleep ? 2 : 0) + (day % 6 === 0 ? 1 : 0) - (walked ? 1 : 0)));
      const thoughtTags = day % 8 === 0 ? ["先のことを考えすぎる"] : day % 13 === 0 ? ["比べすぎる"] : [];

      return withSample<DailyRecord>({
        id: `sample-daily-${date}`,
        date,
        mood,
        anxiety,
        irritability: Math.max(2, Math.min(8, anxiety - 1 + (day % 5 === 0 ? 1 : 0))),
        fatigue,
        sleepHours: shortSleep ? 4.8 : day % 5 === 0 ? 6 : 7.2,
        sleepQuality: shortSleep ? "悪い" : day % 4 === 0 ? "普通" : "良い",
        weather,
        meal: day % 10 === 0 ? "少ない" : day % 3 === 0 ? "しっかり食べた" : "普通",
        exercise: walked ? "散歩" : day % 5 === 0 ? "軽い運動" : "なし",
        wentOut: walked || day % 2 === 0 ? "あり" : "なし",
        socialContact: day % 7 === 0 ? "少ない" : day % 4 === 0 ? "多い" : "普通",
        medicine: "該当なし",
        events: rainyWave ? "天気や予定の影響を少し感じた日" : walked ? "短い散歩を入れられた日" : "いつものペースで過ごした日",
        memo: shortSleep ? "睡眠が短めだったので、夕方は予定を軽くした。" : "架空サンプルの記録です。短く状態を残しています。",
        thoughtTags,
        createdAt: sampleIso(date, 21, 0),
        updatedAt: sampleIso(date, 21, 8),
      });
    });

  const suddenSeeds = [
    { day: 2, tags: ["考えすぎ", "そわそわ"], trigger: "LINE・メッセージ", symptom: "動悸", place: "自宅", thought: "返信の意味を考え続けていた", action: "深呼吸した", after: "少し落ち着いた", intensity: 6 },
    { day: 5, tags: ["身体の重さ"], trigger: "睡眠不足", symptom: "だるさ", place: "自宅", thought: "今日は少し重たい感じがした", action: "寝た", after: "少し落ち着いた", intensity: 5 },
    { day: 8, tags: ["不安感"], trigger: "天気", symptom: "胸の圧迫感", place: "外", thought: "雨の日は予定が重く感じた", action: "散歩した", after: "少し落ち着いた", intensity: 6 },
    { day: 11, tags: ["焦り"], trigger: "仕事", symptom: "頭痛", place: "職場", thought: "やることが重なっていると感じた", action: "何もしなかった", after: "変わらない", intensity: 7 },
    { day: 13, tags: ["ひとり感"], trigger: "SNS", symptom: "だるさ", place: "自宅", thought: "人と比べて少し焦った", action: "スマホから離れた", after: "少し落ち着いた", intensity: 5 },
    { day: 17, tags: ["いらだち"], trigger: "家族", symptom: "胸の圧迫感", place: "自宅", thought: "言葉の受け取り方が気になった", action: "入浴した", after: "かなり落ち着いた", intensity: 6 },
    { day: 20, tags: ["そわそわ"], trigger: "将来への不安", symptom: "震え", place: "自宅", thought: "先の予定を考えすぎていた", action: "紙に書き出した", after: "少し落ち着いた", intensity: 6 },
    { day: 22, tags: ["涙が出る"], trigger: "友人", symptom: "涙", place: "外", thought: "会話のあとで少し疲れを感じた", action: "誰かに連絡した", after: "少し落ち着いた", intensity: 5 },
    { day: 25, tags: ["動きにくさ"], trigger: "体調不良", symptom: "だるさ", place: "自宅", thought: "今日はゆっくりめでよさそう", action: "寝た", after: "少し落ち着いた", intensity: 4 },
    { day: 28, tags: ["考えすぎ"], trigger: "理由が分からない", symptom: "頭痛", place: "自宅", thought: "寝る前に考えが回っていた", action: "深呼吸した", after: "変わらない", intensity: 6 },
  ];
  const suddenLogs = suddenSeeds
    .filter((seed) => seed.day <= dates.length)
    .map((seed): SuddenLog => {
      const date = dates[seed.day - 1];
      return withSample<SuddenLog>({
        id: `sample-sudden-${date}-${seed.day}`,
        occurredAt: sampleIso(date, seed.day % 2 ? 21 : 18, 20),
        stateTags: seed.tags,
        intensity: seed.intensity,
        triggers: [seed.trigger],
        place: seed.place,
        symptoms: [seed.symptom],
        thoughts: seed.thought,
        actions: [seed.action],
        afterChange: seed.after as SuddenLog["afterChange"],
        memo: "架空サンプルです。短い記録として残しています。",
        createdAt: sampleIso(date, seed.day % 2 ? 21 : 18, 24),
        updatedAt: sampleIso(date, seed.day % 2 ? 21 : 18, 24),
      });
    });

  const thoughtSeeds = [
    ["LINEの返信が遅い場面", "返信が遅い理由を考えすぎていた", "不安", 6, ["先のことを考えすぎる", "相手の気持ちを読みすぎる"], "確認できていることと想像を分けると少し見やすいかもしれない。"],
    ["予定が多い朝", "全部やらなきゃと思った", "焦り", 7, ["すべきが強くなる", "完璧にやろうとする"], "今日やることを1つ減らしてもよさそう。"],
    ["小さなつまずきのあと", "ひとつつまずくと全部だめに感じた", "落ち込み", 6, ["一度のことを全部に広げる"], "一部の出来事として置いておけるかもしれない。"],
    ["SNSを見たあと", "人と比べて焦った", "焦り", 5, ["比べすぎる"], "自分のペースを確認する時間にする。"],
    ["寝る前", "明日のことを考え続けた", "そわそわ", 6, ["先のことを考えすぎる"], "今日は結論を出さないとメモして閉じる。"],
    ["作業前", "うまくできないかもしれないと思った", "緊張", 5, ["悪い方に決めつける"], "まずは5分だけ始める形にする。"],
    ["人と話したあと", "変なことを言ったかもしれないと思った", "気がかり", 6, ["相手の気持ちを読みすぎる"], "相手の反応には別の理由もありそう。"],
    ["休む前", "休んでいる自分を責めていた", "重さ", 5, ["自分を責める"], "休むことも翌日の準備になるかもしれない。"],
    ["雨の日の午後", "今日は何も進まないと感じた", "だるさ", 5, ["よい面を見落とす"], "小さくできたことも一緒に見る。"],
  ] as const;
  const thoughtDays = [2, 4, 7, 10, 13, 18, 21, 24, 27];
  const thoughtNotes = thoughtSeeds.map((seed, index): ThoughtNote => {
    const date = dates[Math.min(thoughtDays[index] - 1, dates.length - 1)];
    return withSample<ThoughtNote>({
      id: `sample-thought-${index + 1}`,
      date,
      situation: seed[0],
      thought: seed[1],
      emotion: seed[2],
      intensity: seed[3],
      thoughtTags: [...seed[4]],
      alternativeView: seed[5],
      selfCompassion: index % 2 === 0 ? "全部を一度に解決しなくても大丈夫。" : "今日は小さく整えるだけでいい。",
      relatedAction: index % 3 === 0 ? "紙に書き出す" : "短くメモする",
      memo: "架空サンプルの思考メモです。",
      createdAt: sampleIso(date, 20, 10 + index),
      updatedAt: sampleIso(date, 20, 20 + index),
    });
  });

  const selfCarePlans = [
    ["sample-care-light", "朝の光を浴びる", "体を整える", "カーテンを開けて少し光を感じる"],
    ["sample-care-walk", "5分だけ散歩する", "体を整える", "近くを短く歩く"],
    ["sample-care-water", "水を飲む", "体を整える", "ひと口から始める"],
    ["sample-care-write", "紙に書き出す", "思考を整理する", "頭の中から一度外に置く"],
    ["sample-care-phone", "スマホから少し離れる", "環境を整える", "数分だけ画面を閉じる"],
    ["sample-care-room", "部屋を1分だけ整える", "環境を整える", "目の前のものをひとつ戻す"],
    ["sample-care-rest", "早めに休む", "休む", "予定を少し軽くする"],
  ].map(([id, title, category, memo], index): SelfCarePlan => withSample<SelfCarePlan>({
    id,
    title,
    category: category as SelfCareCategory,
    memo,
    createdAt: sampleIso(dates[0], 9, index),
    updatedAt: sampleIso(dates[0], 9, index),
  }));

  const selfCareLogs = dates
    .filter((_, index) => index % 2 === 0 || index % 7 === 0)
    .slice(0, 22)
    .map((date, index): SelfCareLog => {
      const plan = selfCarePlans[index % selfCarePlans.length];
      const result: SelfCareResult = index % 6 === 0 ? "変化は少なめ" : index % 9 === 0 ? "後で振り返る" : "少し整った";
      return withSample<SelfCareLog>({
        id: `sample-care-log-${date}-${index}`,
        planId: plan.id,
        title: plan.title,
        category: plan.category,
        result,
        memo: result === "少し整った" ? "短い時間でも少し整った感じがあった。" : "その日の状態に合わせて試した。",
        createdAt: sampleIso(date, index % 2 ? 19 : 8, 10),
      });
    });

  const ifThenPlans = [
    ["sample-ifthen-water", "朝の重さに水と光", "朝起きて体が重かったら", "カーテンを開けてコップ1杯の水を飲む", "体を整える", ["身体の重さ"], [], "すぐできそう"],
    ["sample-ifthen-line", "LINE後の整理", "LINEの後に考えすぎていたら", "事実と想像を1つずつ分けてメモする", "思考を整理する", ["考えすぎ"], ["相手の気持ちを読みすぎる"], "少し準備が必要"],
    ["sample-ifthen-cloudy", "曇りの日の光", "曇りの日に気分が沈みやすかったら", "外の光を3分だけ浴びる", "体を整える", ["身体の重さ"], [], "すぐできそう"],
    ["sample-ifthen-blame", "責める考えを置く", "自分を責める考えが出たら", "友人に言うなら何と言うかを1行だけ書く", "思考を整理する", ["考えすぎ"], ["自分を責める"], "少し準備が必要"],
    ["sample-ifthen-night", "寝る前に結論を出さない", "寝る前に考えが止まらなかったら", "今日は結論を出さないとメモして、画面を閉じる", "休む", ["そわそわ"], ["先のことを考えすぎる"], "今は小さくした方がよさそう"],
  ].map(([id, title, ifText, thenText, category, stateTags, thoughtTags, ease], index): IfThenPlan => withSample<IfThenPlan>({
    id: id as string,
    title: title as string,
    ifText: ifText as string,
    thenText: thenText as string,
    category: category as IfThenCategory,
    relatedStateTags: stateTags as string[],
    relatedThoughtTags: thoughtTags as string[],
    ease: ease as IfThenEase,
    memo: "架空サンプルのIf-Thenプランです。",
    isActive: true,
    createdAt: sampleIso(dates[0], 10, index),
    updatedAt: sampleIso(dates[0], 10, index),
  }));

  const ifThenLogPlanIndexes = [0, 0, 0, 1, 1, 2, 2, 2, 3, 4, 0, 1, 3, 2, 4, 0, 1];
  const ifThenLogDays = [2, 4, 8, 9, 12, 13, 16, 20, 21, 22, 24, 25, 27, 28, 29, 30, 18].filter((day) => day <= dates.length);
  const ifThenLogs = ifThenLogDays.map((day, index): IfThenLog => {
    const plan = ifThenPlans[ifThenLogPlanIndexes[index] % ifThenPlans.length];
    const high = plan.id === "sample-ifthen-water" || plan.id === "sample-ifthen-cloudy";
    const fitScore = high ? (index % 3 === 0 ? 8 : 7) : plan.id === "sample-ifthen-night" ? 5 : index % 4 === 0 ? 6 : 7;
    const easeScore = high ? (index % 4 === 0 ? 9 : 8) : plan.id === "sample-ifthen-night" ? 4 : 6;
    return withSample<IfThenLog>({
      id: `sample-ifthen-log-${day}-${index}`,
      planId: plan.id,
      planTitle: plan.title,
      ifText: plan.ifText,
      thenText: plan.thenText,
      fitScore,
      easeScore,
      memo: fitScore >= 7 ? "短く試せて、少し整った感じがあった。" : "今日は少し小さくした方がよさそうだった。",
      createdAt: sampleIso(dates[day - 1], 20, index),
    });
  });

  const consultationNotes = [
    ["sample-consult-sleep", "睡眠が短い日の翌日について", "doctor", "planned", "睡眠が短い翌日に不安感が高めに記録されることについて相談したい。"],
    ["sample-consult-weather", "曇りの日の状態の波", "counselor", "draft", "曇りの日に気分が沈みやすい傾向について話したい。"],
    ["sample-consult-ifthen", "続けやすかった小さな行動", "ai", "done", "If-Thenプランで続けやすかった行動を共有したい。"],
    ["sample-consult-night", "寝る前の考えすぎ", "doctor", "pending", "寝る前に考えが続く日の整理について相談したい。"],
  ].map(([id, title, target, status, mainTopic], index): ConsultationNote => withSample<ConsultationNote>({
    id,
    title,
    target: target as ConsultationTarget,
    status: status as ConsultationStatus,
    mainTopic,
    recentConcern: index % 2 === 0 ? "睡眠や天気との関係を記録で見ています。" : "考えが続く場面を思考メモに残しています。",
    waveMemo: "記録上の傾向として、状態の波がある日を共有したいです。",
    lifestyleMemo: "散歩や光を浴びる行動は続けやすい可能性があります。",
    dontForgetMemo: "原因を断定せず、相談材料として見てもらいたいです。",
    includeInReport: true,
    createdAt: sampleIso(dates[Math.min(index * 6 + 1, dates.length - 1)], 12, 0),
    updatedAt: sampleIso(dates[Math.min(index * 6 + 2, dates.length - 1)], 12, 15),
  }));

  const habitSettings = withSample<HabitSettings>({
    enabled: true,
    reminderTimeType: "夜",
    customReminderTime: "20:00",
    reminderMessage: "今日の状態を少しだけ記録してみませんか？",
    weeklyGoalType: "週に3回",
    customWeeklyGoal: 3,
    updatedAt: createdAt,
  });

  return { dailyRecords, suddenLogs, thoughtNotes, selfCarePlans, selfCareLogs, ifThenPlans, ifThenLogs, consultationNotes, habitSettings };
}

const draftDefinitions = [
  { key: dailyDraftKey, label: "今日の記録" },
  { key: suddenDraftKey, label: "突発ログ" },
  { key: consultationDraftKey, label: "相談ノート" },
  { key: selfCareDraftKey, label: "カスタムセルフケア" },
  { key: thoughtDraftKey, label: "思考メモ" },
  { key: ifThenDraftKey, label: "If-Thenプラン" },
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

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJsonArray<T>(key: string): T[] {
  const parsed = safeParseJson<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? parsed as T[] : [];
}

function loadJsonObject<T extends object>(key: string, fallback: T): Partial<T> {
  const parsed = safeParseJson<unknown>(localStorage.getItem(key), fallback);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Partial<T> : fallback;
}

function readStorage<T>(key: string): T[] {
  return loadJsonArray<T>(key);
}

function readDraft<T>(key: string): DraftEnvelope<T> | null {
  const parsed = safeParseJson<DraftEnvelope<T> | null>(localStorage.getItem(key), null);
  return parsed?.data ? parsed : null;
}

function writeDraft<T>(key: string, formType: string, data: T) {
  const draft: DraftEnvelope<T> = { formType, data, updatedAt: nowIso() };
  saveJson(key, draft);
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
  saveJson(dailyStorageKey, records);
  return records;
}

function loadSuddenLogs() {
  const logs = readStorage<Partial<SuddenLog>>(suddenStorageKey).map(normalizeSuddenLog);
  saveJson(suddenStorageKey, logs);
  return logs;
}

function loadSelfCarePlans() {
  const plans = readStorage<Partial<SelfCarePlan>>(selfCarePlansStorageKey).map(normalizeSelfCarePlan);
  saveJson(selfCarePlansStorageKey, plans);
  return plans;
}

function loadSelfCareLogs() {
  const logs = readStorage<Partial<SelfCareLog>>(selfCareLogsStorageKey).map(normalizeSelfCareLog);
  saveJson(selfCareLogsStorageKey, logs);
  return logs;
}

function loadIfThenPlans() {
  const plans = readStorage<Partial<IfThenPlan>>(ifThenPlansStorageKey).map(normalizeIfThenPlan);
  saveJson(ifThenPlansStorageKey, plans);
  return plans;
}

function loadIfThenLogs() {
  const logs = readStorage<Partial<IfThenLog> & { result?: SelfCareResult }>(ifThenLogsStorageKey).map(normalizeIfThenLog);
  saveJson(ifThenLogsStorageKey, logs);
  return logs;
}

function loadConsultationNotes() {
  const notes = readStorage<Partial<ConsultationNote>>(consultationNotesStorageKey).map(normalizeConsultationNote);
  saveJson(consultationNotesStorageKey, notes);
  return notes;
}

function loadThoughtNotes() {
  const notes = readStorage<Partial<ThoughtNote>>(thoughtNotesStorageKey).map(normalizeThoughtNote);
  saveJson(thoughtNotesStorageKey, notes);
  return notes;
}

function loadPrivacySettings() {
  const settings = normalizePrivacySettings(loadJsonObject(privacySettingsStorageKey, defaultPrivacySettings()));
  saveJson(privacySettingsStorageKey, settings);
  return settings;
}

function loadHabitSettings() {
  const settings = normalizeHabitSettings(loadJsonObject(habitSettingsStorageKey, defaultHabitSettings()));
  saveJson(habitSettingsStorageKey, settings);
  return settings;
}

function loadReminderDismissals() {
  const dismissals = readStorage<Partial<ReminderDismissal>>(reminderDismissalsStorageKey).map(normalizeReminderDismissal).filter(Boolean) as ReminderDismissal[];
  saveJson(reminderDismissalsStorageKey, dismissals);
  return dismissals;
}

function loadDisplaySettings() {
  const settings = normalizeDisplaySettings(loadJsonObject(displaySettingsStorageKey, defaultDisplaySettings()));
  saveJson(displaySettingsStorageKey, settings);
  return settings;
}

function defaultDemoDisplaySettings(): DemoDisplaySettings {
  return { mode: "all", isDemoModeEnabled: false, updatedAt: nowIso() };
}

function normalizeDemoDisplaySettings(settings?: Partial<DemoDisplaySettings>): DemoDisplaySettings {
  const mode = settings?.mode === "realOnly" || settings?.mode === "sampleOnly" || settings?.mode === "all" ? settings.mode : "all";
  return {
    mode,
    isDemoModeEnabled: Boolean(settings?.isDemoModeEnabled),
    updatedAt: settings?.updatedAt || nowIso(),
  };
}

function loadDemoDisplaySettings() {
  const settings = normalizeDemoDisplaySettings(loadJsonObject(demoDisplaySettingsStorageKey, defaultDemoDisplaySettings()));
  saveJson(demoDisplaySettingsStorageKey, settings);
  return settings;
}

function applyDemoDisplayMode<T>(items: T[], settings: DemoDisplaySettings) {
  if (settings.mode === "realOnly") return items.filter((item) => !isSampleItem(item));
  if (settings.mode === "sampleOnly") return items.filter(isSampleItem);
  return items;
}

function demoDisplayLabel(settings: DemoDisplaySettings) {
  if (settings.mode === "sampleOnly") return "サンプルのみ表示";
  if (settings.mode === "realOnly") return "実データのみ表示";
  return settings.isDemoModeEnabled ? "デモ表示中" : "";
}

function demoModeLabel(mode: DemoDisplayMode) {
  if (mode === "realOnly") return "実データのみ";
  if (mode === "sampleOnly") return "サンプルのみ";
  return "すべて表示";
}

function demoModeFromLabel(label: string): DemoDisplayMode {
  if (label === "実データのみ") return "realOnly";
  if (label === "サンプルのみ") return "sampleOnly";
  return "all";
}

function countSampleItems(groups: unknown[][]) {
  return groups.reduce((sum, group) => sum + group.filter(isSampleItem).length, 0);
}

function hasUrlParam(name: string, value = "1") {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) === value;
}

function shouldShowIntroOnLoad() {
  return hasUrlParam("intro") || localStorage.getItem(introCompletedStorageKey) !== "true";
}

function shouldOpenSafeModeOnLoad() {
  return hasUrlParam("safe");
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>(loadDailyRecords);
  const [suddenLogs, setSuddenLogs] = useState<SuddenLog[]>(loadSuddenLogs);
  const [selfCarePlans, setSelfCarePlans] = useState<SelfCarePlan[]>(loadSelfCarePlans);
  const [selfCareLogs, setSelfCareLogs] = useState<SelfCareLog[]>(loadSelfCareLogs);
  const [ifThenPlans, setIfThenPlans] = useState<IfThenPlan[]>(loadIfThenPlans);
  const [ifThenLogs, setIfThenLogs] = useState<IfThenLog[]>(loadIfThenLogs);
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>(loadConsultationNotes);
  const [thoughtNotes, setThoughtNotes] = useState<ThoughtNote[]>(loadThoughtNotes);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(loadPrivacySettings);
  const [habitSettings, setHabitSettings] = useState<HabitSettings>(loadHabitSettings);
  const [reminderDismissals, setReminderDismissals] = useState<ReminderDismissal[]>(loadReminderDismissals);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(loadDisplaySettings);
  const [demoDisplaySettings, setDemoDisplaySettings] = useState<DemoDisplaySettings>(loadDemoDisplaySettings);
  const [isLocked, setIsLocked] = useState(() => loadPrivacySettings().isLockEnabled);
  const [editingDaily, setEditingDaily] = useState<DailyRecord | null>(null);
  const [editingSudden, setEditingSudden] = useState<SuddenLog | null>(null);
  const [editingThought, setEditingThought] = useState<ThoughtNote | null>(null);
  const [prefillThought, setPrefillThought] = useState<Partial<ThoughtNote> | null>(null);
  const [prefillIfThen, setPrefillIfThen] = useState<IfThenPrefill | null>(null);
  const [ifThenReturnTarget, setIfThenReturnTarget] = useState<Screen>("menu");
  const [newDailyDate, setNewDailyDate] = useState<string | null>(null);
  const [newSuddenDate, setNewSuddenDate] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("sleep");
  const [loggingPlan, setLoggingPlan] = useState<SelfCarePlan | null>(null);
  const [loggingIfThen, setLoggingIfThen] = useState<IfThenPlan | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(onboardingCompletedStorageKey) !== "true");
  const [onboardingMode, setOnboardingMode] = useState<"initial" | "guide">("initial");
  const [showIntro, setShowIntro] = useState(shouldShowIntroOnLoad);
  const [isSafeMode, setIsSafeMode] = useState(shouldOpenSafeModeOnLoad);
  const [activeFormDirty, setActiveFormDirty] = useState(false);
  const [flash, setFlash] = useState("");
  const hasSampleData = [
    ...dailyRecords,
    ...suddenLogs,
    ...selfCarePlans,
    ...selfCareLogs,
    ...ifThenPlans,
    ...ifThenLogs,
    ...consultationNotes,
    ...thoughtNotes,
  ].some(isSampleItem) || isSampleItem(habitSettings);
  const visibleDailyRecords = useMemo(() => applyDemoDisplayMode(dailyRecords, demoDisplaySettings), [dailyRecords, demoDisplaySettings]);
  const visibleSuddenLogs = useMemo(() => applyDemoDisplayMode(suddenLogs, demoDisplaySettings), [suddenLogs, demoDisplaySettings]);
  const visibleSelfCarePlans = useMemo(() => applyDemoDisplayMode(selfCarePlans, demoDisplaySettings), [selfCarePlans, demoDisplaySettings]);
  const visibleSelfCareLogs = useMemo(() => applyDemoDisplayMode(selfCareLogs, demoDisplaySettings), [selfCareLogs, demoDisplaySettings]);
  const visibleIfThenPlans = useMemo(() => applyDemoDisplayMode(ifThenPlans, demoDisplaySettings), [ifThenPlans, demoDisplaySettings]);
  const visibleIfThenLogs = useMemo(() => applyDemoDisplayMode(ifThenLogs, demoDisplaySettings), [ifThenLogs, demoDisplaySettings]);
  const visibleConsultationNotes = useMemo(() => applyDemoDisplayMode(consultationNotes, demoDisplaySettings), [consultationNotes, demoDisplaySettings]);
  const visibleThoughtNotes = useMemo(() => applyDemoDisplayMode(thoughtNotes, demoDisplaySettings), [thoughtNotes, demoDisplaySettings]);
  const demoLabel = demoDisplayLabel(demoDisplaySettings);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") return;
    const next = normalizeDemoDisplaySettings({ mode: hasSampleData ? "sampleOnly" : "all", isDemoModeEnabled: true, updatedAt: nowIso() });
    setDemoDisplaySettings(next);
    localStorage.setItem(demoDisplaySettingsStorageKey, JSON.stringify(next));
    setFlash(hasSampleData ? "デモ表示に切り替えました" : "デモモードをONにしました。サンプルデータを追加すると見え方を確認できます。");
  }, [hasSampleData]);

  const savePrivacySettings = (settings: PrivacySettings) => {
    setPrivacySettings(settings);
    localStorage.setItem(privacySettingsStorageKey, JSON.stringify(settings));
  };

  const updatePrivacySettings = (settings: PrivacySettings) => {
    savePrivacySettings(settings);
    setFlash("プライバシー設定を更新しました");
  };

  const updateHabitSettings = (settings: HabitSettings) => {
    setHabitSettings(settings);
    localStorage.setItem(habitSettingsStorageKey, JSON.stringify(settings));
    setFlash("習慣サポートを更新しました");
  };

  const updateDisplaySettings = (settings: DisplaySettings) => {
    const next = normalizeDisplaySettings({ ...settings, updatedAt: nowIso() });
    setDisplaySettings(next);
    localStorage.setItem(displaySettingsStorageKey, JSON.stringify(next));
    setFlash("表示設定を更新しました");
  };

  const updateDemoDisplaySettings = (settings: DemoDisplaySettings) => {
    const next = normalizeDemoDisplaySettings({ ...settings, updatedAt: nowIso() });
    setDemoDisplaySettings(next);
    localStorage.setItem(demoDisplaySettingsStorageKey, JSON.stringify(next));
    setFlash("デモ表示設定を更新しました");
  };

  const dismissReminderToday = () => {
    const next = [
      { date: today(), dismissedAt: nowIso() },
      ...reminderDismissals.filter((item) => item.date !== today()),
    ].slice(0, 60);
    setReminderDismissals(next);
    localStorage.setItem(reminderDismissalsStorageKey, JSON.stringify(next));
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
    const related = findIfThenByStateTags(ifThenPlans, log.stateTags);
    setFlash(isEditing ? "突発ログを更新しました" : related.length ? "突発ログを保存しました。似た状態のときに使えそうな小さな行動があります。" : "突発ログを保存しました。If-Thenプランで小さな行動を作ることもできます。");
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

  const saveIfThenPlan = (plan: IfThenPlan) => {
    const isEditing = ifThenPlans.some((item) => item.id === plan.id);
    const next = isEditing ? ifThenPlans.map((item) => (item.id === plan.id ? plan : item)) : [plan, ...ifThenPlans];
    setIfThenPlans(next);
    localStorage.setItem(ifThenPlansStorageKey, JSON.stringify(next));
    localStorage.removeItem(ifThenDraftKey);
    setActiveFormDirty(false);
    setPrefillIfThen(null);
    setFlash(isEditing ? "If-Thenプランを更新しました" : "If-Thenプランを追加しました");
  };

  const deleteIfThenPlan = (id: string) => {
    const next = ifThenPlans.filter((plan) => plan.id !== id);
    setIfThenPlans(next);
    localStorage.setItem(ifThenPlansStorageKey, JSON.stringify(next));
    setPendingDelete(null);
    setFlash("If-Thenプランを削除しました");
  };

  const toggleIfThenPlan = (id: string) => {
    const next = ifThenPlans.map((plan) => plan.id === id ? { ...plan, isActive: !plan.isActive, updatedAt: nowIso() } : plan);
    setIfThenPlans(next);
    localStorage.setItem(ifThenPlansStorageKey, JSON.stringify(next));
    setFlash("If-Thenプランを更新しました");
  };

  const saveIfThenLog = (log: IfThenLog) => {
    const next = [log, ...ifThenLogs];
    setIfThenLogs(next);
    localStorage.setItem(ifThenLogsStorageKey, JSON.stringify(next));
    setLoggingIfThen(null);
    setFlash("If-Thenプランの実行を記録しました");
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

  const saveThoughtNote = (note: ThoughtNote) => {
    const isEditing = thoughtNotes.some((item) => item.id === note.id);
    const next = isEditing ? thoughtNotes.map((item) => (item.id === note.id ? note : item)) : [note, ...thoughtNotes];
    setThoughtNotes(next);
    localStorage.setItem(thoughtNotesStorageKey, JSON.stringify(next));
    localStorage.removeItem(thoughtDraftKey);
    setActiveFormDirty(false);
    setEditingThought(null);
    setPrefillThought(null);
    const related = findIfThenByThoughtTags(ifThenPlans, note.thoughtTags);
    setFlash(isEditing ? "思考メモを更新しました" : related.length ? "思考メモを保存しました。この考え方が出たとき用の小さな行動があります。" : "思考メモを保存しました。If-Thenプランで小さな行動を作ることもできます。");
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

  const deleteThoughtNote = (id: string) => {
    const next = thoughtNotes.filter((note) => note.id !== id);
    setThoughtNotes(next);
    localStorage.setItem(thoughtNotesStorageKey, JSON.stringify(next));
    setPendingDelete(null);
    setFlash("思考メモを削除しました");
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
    setIfThenPlans(backup.ifThenPlans);
    setIfThenLogs(backup.ifThenLogs);
    setConsultationNotes(backup.consultationNotes);
    setThoughtNotes(backup.thoughtNotes);
    setHabitSettings(normalizeHabitSettings(backup.habitSettings));
    setReminderDismissals(backup.reminderDismissals.map(normalizeReminderDismissal).filter(Boolean) as ReminderDismissal[]);
    setDisplaySettings(normalizeDisplaySettings(backup.displaySettings));
    setDemoDisplaySettings(normalizeDemoDisplaySettings(backup.demoDisplaySettings));
    const nextPrivacy = normalizeImportedPrivacySettings(backup.privacySettings, privacySettings);
    setPrivacySettings(nextPrivacy);
    localStorage.setItem(dailyStorageKey, JSON.stringify(backup.dailyRecords));
    localStorage.setItem(suddenStorageKey, JSON.stringify(backup.suddenLogs));
    localStorage.setItem(selfCarePlansStorageKey, JSON.stringify(backup.selfCarePlans));
    localStorage.setItem(selfCareLogsStorageKey, JSON.stringify(backup.selfCareLogs));
    localStorage.setItem(ifThenPlansStorageKey, JSON.stringify(backup.ifThenPlans));
    localStorage.setItem(ifThenLogsStorageKey, JSON.stringify(backup.ifThenLogs));
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify(backup.consultationNotes));
    localStorage.setItem(thoughtNotesStorageKey, JSON.stringify(backup.thoughtNotes));
    localStorage.setItem(privacySettingsStorageKey, JSON.stringify(nextPrivacy));
    localStorage.setItem(habitSettingsStorageKey, JSON.stringify(normalizeHabitSettings(backup.habitSettings)));
    localStorage.setItem(reminderDismissalsStorageKey, JSON.stringify(backup.reminderDismissals.map(normalizeReminderDismissal).filter(Boolean)));
    localStorage.setItem(displaySettingsStorageKey, JSON.stringify(normalizeDisplaySettings(backup.displaySettings)));
    localStorage.setItem(demoDisplaySettingsStorageKey, JSON.stringify(normalizeDemoDisplaySettings(backup.demoDisplaySettings)));
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
    setIfThenPlans([]);
    setIfThenLogs([]);
    setConsultationNotes([]);
    setThoughtNotes([]);
    setDemoDisplaySettings(defaultDemoDisplaySettings());
    const nextPrivacy = { ...privacySettings, privateDisplayMode: false, updatedAt: nowIso() };
    setPrivacySettings(nextPrivacy);
    localStorage.setItem(dailyStorageKey, JSON.stringify([]));
    localStorage.setItem(suddenStorageKey, JSON.stringify([]));
    localStorage.setItem(selfCarePlansStorageKey, JSON.stringify([]));
    localStorage.setItem(selfCareLogsStorageKey, JSON.stringify([]));
    localStorage.setItem(ifThenPlansStorageKey, JSON.stringify([]));
    localStorage.setItem(ifThenLogsStorageKey, JSON.stringify([]));
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify([]));
    localStorage.setItem(thoughtNotesStorageKey, JSON.stringify([]));
    localStorage.setItem(demoDisplaySettingsStorageKey, JSON.stringify(defaultDemoDisplaySettings()));
    localStorage.setItem(privacySettingsStorageKey, JSON.stringify(nextPrivacy));
    setPendingDelete(null);
    setDetailItem(null);
    setFlash("保存されている記録を削除しました");
    setScreen("data");
  };

  const addSampleData = (options?: { skipConfirm?: boolean; nextScreen?: Screen; message?: string }) => {
    if (!options?.skipConfirm) {
      const confirmed = window.confirm(hasSampleData
        ? "すでにサンプルデータがあります。既存のサンプルだけを入れ替えますか？手入力した記録は削除されません。"
        : "1ヶ月分の架空サンプルデータを追加します。現在の記録は削除されませんが、データが増えます。続行しますか？");
      if (!confirmed) return;
    }

    const sample = generateMonthlySampleData();
    const nextDaily = [...removeSampleItems(dailyRecords), ...sample.dailyRecords].sort((a, b) => b.date.localeCompare(a.date));
    const nextSudden = [...removeSampleItems(suddenLogs), ...sample.suddenLogs].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const nextThought = [...removeSampleItems(thoughtNotes), ...sample.thoughtNotes].sort((a, b) => b.date.localeCompare(a.date));
    const nextSelfCarePlans = [...removeSampleItems(selfCarePlans), ...sample.selfCarePlans].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const nextSelfCareLogs = [...removeSampleItems(selfCareLogs), ...sample.selfCareLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const nextIfThenPlans = [...removeSampleItems(ifThenPlans), ...sample.ifThenPlans].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const nextIfThenLogs = [...removeSampleItems(ifThenLogs), ...sample.ifThenLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const nextConsultation = [...removeSampleItems(consultationNotes), ...sample.consultationNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const nextHabit = isSampleItem(habitSettings) || isDefaultHabitSettings(habitSettings) ? sample.habitSettings : habitSettings;

    setDailyRecords(nextDaily);
    setSuddenLogs(nextSudden);
    setThoughtNotes(nextThought);
    setSelfCarePlans(nextSelfCarePlans);
    setSelfCareLogs(nextSelfCareLogs);
    setIfThenPlans(nextIfThenPlans);
    setIfThenLogs(nextIfThenLogs);
    setConsultationNotes(nextConsultation);
    setHabitSettings(nextHabit);
    localStorage.setItem(dailyStorageKey, JSON.stringify(nextDaily));
    localStorage.setItem(suddenStorageKey, JSON.stringify(nextSudden));
    localStorage.setItem(thoughtNotesStorageKey, JSON.stringify(nextThought));
    localStorage.setItem(selfCarePlansStorageKey, JSON.stringify(nextSelfCarePlans));
    localStorage.setItem(selfCareLogsStorageKey, JSON.stringify(nextSelfCareLogs));
    localStorage.setItem(ifThenPlansStorageKey, JSON.stringify(nextIfThenPlans));
    localStorage.setItem(ifThenLogsStorageKey, JSON.stringify(nextIfThenLogs));
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify(nextConsultation));
    localStorage.setItem(habitSettingsStorageKey, JSON.stringify(nextHabit));
    setFlash(options?.message || "1ヶ月分のサンプルデータを追加しました");
    const nextDemo = normalizeDemoDisplaySettings({ mode: "sampleOnly", isDemoModeEnabled: true, updatedAt: nowIso() });
    setDemoDisplaySettings(nextDemo);
    localStorage.setItem(demoDisplaySettingsStorageKey, JSON.stringify(nextDemo));
    setScreen(options?.nextScreen || "data");
  };

  const deleteSampleData = () => {
    if (!window.confirm("追加したサンプルデータだけを削除します。手入力した記録は削除されません。続行しますか？")) return;
    const nextDaily = removeSampleItems(dailyRecords);
    const nextSudden = removeSampleItems(suddenLogs);
    const nextThought = removeSampleItems(thoughtNotes);
    const nextSelfCarePlans = removeSampleItems(selfCarePlans);
    const nextSelfCareLogs = removeSampleItems(selfCareLogs);
    const nextIfThenPlans = removeSampleItems(ifThenPlans);
    const nextIfThenLogs = removeSampleItems(ifThenLogs);
    const nextConsultation = removeSampleItems(consultationNotes);
    const nextHabit = isSampleItem(habitSettings) ? defaultHabitSettings() : habitSettings;

    setDailyRecords(nextDaily);
    setSuddenLogs(nextSudden);
    setThoughtNotes(nextThought);
    setSelfCarePlans(nextSelfCarePlans);
    setSelfCareLogs(nextSelfCareLogs);
    setIfThenPlans(nextIfThenPlans);
    setIfThenLogs(nextIfThenLogs);
    setConsultationNotes(nextConsultation);
    setHabitSettings(nextHabit);
    localStorage.setItem(dailyStorageKey, JSON.stringify(nextDaily));
    localStorage.setItem(suddenStorageKey, JSON.stringify(nextSudden));
    localStorage.setItem(thoughtNotesStorageKey, JSON.stringify(nextThought));
    localStorage.setItem(selfCarePlansStorageKey, JSON.stringify(nextSelfCarePlans));
    localStorage.setItem(selfCareLogsStorageKey, JSON.stringify(nextSelfCareLogs));
    localStorage.setItem(ifThenPlansStorageKey, JSON.stringify(nextIfThenPlans));
    localStorage.setItem(ifThenLogsStorageKey, JSON.stringify(nextIfThenLogs));
    localStorage.setItem(consultationNotesStorageKey, JSON.stringify(nextConsultation));
    localStorage.setItem(habitSettingsStorageKey, JSON.stringify(nextHabit));
    setDetailItem(null);
    setFlash("サンプルデータを削除しました");
    const nextDemo = normalizeDemoDisplaySettings({ mode: "realOnly", isDemoModeEnabled: false, updatedAt: nowIso() });
    setDemoDisplaySettings(nextDemo);
    localStorage.setItem(demoDisplaySettingsStorageKey, JSON.stringify(nextDemo));
    setScreen("data");
  };

  const openDaily = () => {
    setFlash("");
    setEditingDaily(dailyRecords.find((record) => record.date === today()) || null);
    setNewDailyDate(null);
    setScreen("daily");
  };

  const openDailyForDate = (date: string) => {
    setFlash("");
    setEditingDaily(dailyRecords.find((record) => record.date === date) || null);
    setNewDailyDate(date);
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
    setNewSuddenDate(null);
    setScreen("sudden");
  };

  const openSuddenForDate = (date: string) => {
    setFlash("");
    setEditingSudden(null);
    setNewSuddenDate(date);
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

  const openCalendar = () => {
    setFlash("");
    setScreen("calendar");
  };

  const openConsultation = () => {
    setFlash("");
    setScreen("consultation");
  };

  const openThought = () => {
    setFlash("");
    setEditingThought(null);
    setPrefillThought(null);
    setScreen("thought");
  };

  const getIfThenReturnTarget = (target?: Screen): Screen => {
    if (target && target !== "ifthen") return target;
    if (["home", "selfcare", "menu", "review", "analysis", "calendar", "report", "thought", "records", "habit"].includes(screen)) return screen;
    return "menu";
  };

  const openIfThen = (prefill?: IfThenPrefill, returnTarget?: Screen) => {
    setFlash("");
    setPrefillIfThen(prefill || null);
    setIfThenReturnTarget(getIfThenReturnTarget(returnTarget));
    setScreen("ifthen");
  };

  const openIfThenFromSudden = (log: SuddenLog) => {
    const triggerText = [...log.triggers, ...log.stateTags].filter(Boolean).join("・");
    setDetailItem(null);
    openIfThen({
      title: log.stateTags[0] ? `${log.stateTags[0]}のときの小さな行動` : "状態の波に合わせるプラン",
      ifText: triggerText ? `${triggerText}のあとに状態の波が出たら` : "状態の波が出たら",
      category: "記録する",
      relatedStateTags: log.stateTags,
      memo: log.thoughts ? `突発ログから: ${log.thoughts}` : "",
    }, "records");
  };

  const openIfThenFromThought = (note: ThoughtNote) => {
    openIfThen({
      title: note.thoughtTags[0] ? `${note.thoughtTags[0]}が出たときの小さな行動` : "考えを整理するプラン",
      ifText: note.situation || note.thought || "この考え方が出たら",
      category: "思考を整理する",
      relatedThoughtTags: note.thoughtTags,
      memo: note.thought ? `思考メモから: ${note.thought}` : "",
    }, "thought");
  };

  const openThoughtFromSudden = (log: SuddenLog) => {
    setFlash("");
    setEditingThought(null);
    setPrefillThought({
      date: log.occurredAt.slice(0, 10),
      situation: [...log.triggers, log.place].filter(Boolean).join(" / "),
      thought: log.thoughts,
      thoughtTags: log.stateTags.includes("考えすぎ") ? ["先のことを考えすぎる"] : [],
      relatedAction: log.actions.join("、"),
      sourceLogId: log.id,
    });
    setScreen("thought");
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

  const completeIntro = () => {
    localStorage.setItem(introCompletedStorageKey, "true");
    localStorage.setItem(introCompletedAtStorageKey, nowIso());
    setShowIntro(false);
  };

  const startDemoFromIntro = () => {
    const confirmed = window.confirm("架空のサンプルデータを使って、アプリの見え方を試します。現在の記録は削除されません。続行しますか？");
    if (!confirmed) return;
    completeIntro();
    addSampleData({ skipConfirm: true, nextScreen: "home", message: "デモ表示に切り替えました" });
  };

  const startOwnRecordsFromIntro = () => {
    completeIntro();
    setFlash("");
    setScreen("home");
  };

  const openGuideFromIntro = () => {
    completeIntro();
    setFlash("");
    setOnboardingMode("guide");
    setShowOnboarding(true);
  };

  const openIntro = () => {
    setFlash("");
    setShowIntro(true);
  };

  const openHabit = () => {
    setFlash("");
    setScreen("habit");
  };

  const openDisplay = () => {
    setFlash("");
    setScreen("display");
  };

  const openMetricDetail = (metric: MetricType) => {
    setFlash("");
    setSelectedMetric(metric);
    setScreen("metricDetail");
  };

  const exitSafeMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("safe");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setIsSafeMode(false);
    setScreen("data");
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

  if (isSafeMode) {
    return (
      <div className={`app-shell theme-${displaySettings.theme} font-${displaySettings.fontSize}`}>
        <main className="screen safe-mode-screen">
          <section className="section-block safe-mode-panel">
            <div>
              <p className="eyebrow">復旧用</p>
              <h1>セーフモード</h1>
            </div>
            <p className="soft-text">画面表示に不具合があるときでも、バックアップ・インポート・サンプルデータ整理などの復旧操作を行うための表示です。</p>
            <p className="soft-text">記録は削除されません。削除やインポートの操作は、確認画面で選んだ場合だけ実行されます。</p>
            <button className="secondary-btn no-margin safe-mode-exit" type="button" onClick={exitSafeMode}>通常のデータ管理へ戻る</button>
          </section>
          <DataManagement
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            selfCarePlans={selfCarePlans}
            selfCareLogs={selfCareLogs}
            ifThenPlans={ifThenPlans}
            ifThenLogs={ifThenLogs}
            consultationNotes={consultationNotes}
            thoughtNotes={thoughtNotes}
            visibleDailyRecords={visibleDailyRecords}
            visibleSuddenLogs={visibleSuddenLogs}
            visibleSelfCarePlans={visibleSelfCarePlans}
            visibleSelfCareLogs={visibleSelfCareLogs}
            visibleIfThenPlans={visibleIfThenPlans}
            visibleIfThenLogs={visibleIfThenLogs}
            visibleConsultationNotes={visibleConsultationNotes}
            visibleThoughtNotes={visibleThoughtNotes}
            privacySettings={privacySettings}
            habitSettings={habitSettings}
            reminderDismissals={reminderDismissals}
            displaySettings={displaySettings}
            demoDisplaySettings={demoDisplaySettings}
            flash={flash}
            onImportRequest={setPendingImport}
            onDeleteAllRequest={() => setPendingDelete({ kind: "all" })}
            onAddSampleData={addSampleData}
            onDeleteSampleData={deleteSampleData}
            onUpdateDemoDisplaySettings={updateDemoDisplaySettings}
            hasSampleData={hasSampleData}
          />
        </main>
        {pendingDelete && (
          <ConfirmDeleteModal
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => {
              if (pendingDelete.kind === "daily") deleteDaily(pendingDelete.id);
              if (pendingDelete.kind === "sudden") deleteSudden(pendingDelete.id);
              if (pendingDelete.kind === "selfcare") deleteSelfCarePlan(pendingDelete.id);
              if (pendingDelete.kind === "consultation") deleteConsultationNote(pendingDelete.id);
              if (pendingDelete.kind === "thought") deleteThoughtNote(pendingDelete.id);
              if (pendingDelete.kind === "ifthen") deleteIfThenPlan(pendingDelete.id);
              if (pendingDelete.kind === "all") deleteAllData();
            }}
            isAllData={pendingDelete.kind === "all"}
          />
        )}
        {pendingImport && (
          <ConfirmImportModal
            onCancel={() => setPendingImport(null)}
            onConfirm={() => importBackup(pendingImport)}
          />
        )}
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className={`app-shell theme-${displaySettings.theme} font-${displaySettings.fontSize}`}>
        <IntroScreen
          onDemo={startDemoFromIntro}
          onStart={startOwnRecordsFromIntro}
          onGuide={openGuideFromIntro}
          onClose={startOwnRecordsFromIntro}
        />
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingGuide mode={onboardingMode} onClose={() => closeOnboarding(onboardingMode === "initial")} />;
  }

  const backTarget = screen === "ifthen" ? ifThenReturnTarget : backTargetForScreen(screen);

  return (
    <div className={`app-shell theme-${displaySettings.theme} font-${displaySettings.fontSize}`}>
      <main className={screen === "home" ? "screen screen-home" : "screen"}>
        {demoLabel && <div className="demo-mode-chip">{demoLabel}</div>}
        {backTarget && (
          <button className="back-link" onClick={() => moveToScreen(backTarget)} type="button">
            ← 戻る
          </button>
        )}
        {screen === "home" && (
          <Home
            dailyRecords={visibleDailyRecords}
            suddenLogs={visibleSuddenLogs}
            selfCarePlans={visibleSelfCarePlans}
            selfCareLogs={visibleSelfCareLogs}
            ifThenPlans={visibleIfThenPlans}
            ifThenLogs={visibleIfThenLogs}
            consultationNotes={visibleConsultationNotes}
            thoughtNotes={visibleThoughtNotes}
            privateDisplayMode={privacySettings.privateDisplayMode}
            habitSettings={habitSettings}
            reminderDismissals={reminderDismissals}
            flash={flash}
            onCareDone={setLoggingPlan}
            onIfThenDone={setLoggingIfThen}
            onConsultation={openConsultation}
            onLock={lockApp}
            onDaily={openDaily}
            onSudden={openSudden}
            onCalendar={openCalendar}
            onThought={openThought}
            onIfThen={() => openIfThen(undefined, "home")}
            onSelfCare={() => moveToScreen("selfcare")}
            onHabit={openHabit}
            onMetricDetail={openMetricDetail}
            onDismissReminder={dismissReminderToday}
          />
        )}
        {screen === "metricDetail" && (
          <MetricDetailScreen
            metricType={selectedMetric}
            dailyRecords={visibleDailyRecords}
            suddenLogs={visibleSuddenLogs}
            selfCareLogs={visibleSelfCareLogs}
            ifThenPlans={visibleIfThenPlans}
            ifThenLogs={visibleIfThenLogs}
            thoughtNotes={visibleThoughtNotes}
            privateDisplayMode={privacySettings.privateDisplayMode}
            onDaily={openDaily}
            onRecords={openRecords}
          />
        )}
        {screen === "recordHub" && (
          <RecordHub
            dailyRecords={visibleDailyRecords}
            suddenLogs={visibleSuddenLogs}
            onDaily={openDaily}
            onSudden={openSudden}
            onRecords={openRecords}
            onCalendar={openCalendar}
            onThought={openThought}
          />
        )}
        {screen === "daily" && <DailyForm key={editingDaily?.id || newDailyDate || "new-daily"} initial={editingDaily} initialDate={newDailyDate} onSave={saveDaily} onCancel={() => moveToScreen("home")} onDirtyChange={setActiveFormDirty} />}
        {screen === "sudden" && <SuddenForm key={editingSudden?.id || newSuddenDate || "new-sudden"} initial={editingSudden} initialDate={newSuddenDate} onSave={saveSudden} onCancel={() => moveToScreen("home")} onDirtyChange={setActiveFormDirty} />}
        {screen === "records" && (
          <RecordsScreen
            dailyRecords={visibleDailyRecords}
            suddenLogs={visibleSuddenLogs}
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
            onCreateThoughtFromSudden={openThoughtFromSudden}
            onCreateIfThenFromSudden={openIfThenFromSudden}
            onDeleteDaily={(id) => setPendingDelete({ kind: "daily", id })}
            onDeleteSudden={(id) => setPendingDelete({ kind: "sudden", id })}
          />
        )}
        {screen === "review" && (
          <ReviewHub
            dailyRecords={visibleDailyRecords}
            suddenLogs={visibleSuddenLogs}
            selfCareLogs={visibleSelfCareLogs}
            thoughtNotes={visibleThoughtNotes}
            ifThenPlans={visibleIfThenPlans}
            ifThenLogs={visibleIfThenLogs}
            onAnalysis={openAnalysis}
            onReport={openReport}
            onConsultation={openConsultation}
            onCalendar={openCalendar}
            onThought={openThought}
            onIfThen={() => openIfThen(undefined, "review")}
          />
        )}
        {screen === "analysis" && <Analysis dailyRecords={visibleDailyRecords} suddenLogs={visibleSuddenLogs} selfCareLogs={visibleSelfCareLogs} thoughtNotes={visibleThoughtNotes} ifThenPlans={visibleIfThenPlans} ifThenLogs={visibleIfThenLogs} onIfThen={(prefill) => openIfThen(prefill, "analysis")} />}
        {screen === "report" && <Report dailyRecords={visibleDailyRecords} suddenLogs={visibleSuddenLogs} selfCareLogs={visibleSelfCareLogs} consultationNotes={visibleConsultationNotes} thoughtNotes={visibleThoughtNotes} ifThenPlans={visibleIfThenPlans} ifThenLogs={visibleIfThenLogs} onOpenConsultation={openConsultation} demoLabel={demoLabel} />}
        {screen === "calendar" && (
          <CalendarScreen
            dailyRecords={visibleDailyRecords}
            suddenLogs={visibleSuddenLogs}
            selfCareLogs={visibleSelfCareLogs}
            thoughtNotes={visibleThoughtNotes}
            ifThenPlans={visibleIfThenPlans}
            ifThenLogs={visibleIfThenLogs}
            consultationNotes={visibleConsultationNotes}
            privateDisplayMode={privacySettings.privateDisplayMode}
            onEditDaily={openDailyForDate}
            onAddDaily={openDailyForDate}
            onAddSudden={openSuddenForDate}
            onIfThen={(prefill) => openIfThen(prefill, "calendar")}
            onSelfCare={() => moveToScreen("selfcare")}
          />
        )}
        {screen === "selfcare" && (
          <SelfCareScreen
            plans={visibleSelfCarePlans}
            logs={visibleSelfCareLogs}
            flash={flash}
            onSavePlan={saveSelfCarePlan}
            onDeletePlan={(id) => setPendingDelete({ kind: "selfcare", id })}
            onCareDone={setLoggingPlan}
            onIfThen={() => openIfThen(undefined, "selfcare")}
            onCreateIfThen={(plan) => {
              saveIfThenPlan(createIfThenFromSelfCare(plan));
              setIfThenReturnTarget("selfcare");
              setScreen("ifthen");
            }}
            onDirtyChange={setActiveFormDirty}
          />
        )}
        {screen === "consultation" && (
          <ConsultationScreen
            dailyRecords={visibleDailyRecords}
            suddenLogs={visibleSuddenLogs}
            selfCareLogs={visibleSelfCareLogs}
            ifThenPlans={visibleIfThenPlans}
            ifThenLogs={visibleIfThenLogs}
            thoughtNotes={visibleThoughtNotes}
            notes={visibleConsultationNotes}
            flash={flash}
            onSave={saveConsultationNote}
            onDelete={(id) => setPendingDelete({ kind: "consultation", id })}
            onMarkDone={(id) => updateConsultationStatus(id, "done")}
            privateDisplayMode={privacySettings.privateDisplayMode}
            onDirtyChange={setActiveFormDirty}
          />
        )}
        {screen === "thought" && (
          <ThoughtNotesScreen
            key={editingThought?.id || prefillThought?.sourceLogId || "thought-new"}
            notes={visibleThoughtNotes}
            initial={editingThought}
            prefill={prefillThought}
            flash={flash}
            privateDisplayMode={privacySettings.privateDisplayMode}
            onSave={saveThoughtNote}
            onEdit={(note) => {
              setFlash("");
              setEditingThought(note);
              setPrefillThought(null);
            }}
            onDelete={(id) => setPendingDelete({ kind: "thought", id })}
            ifThenPlans={visibleIfThenPlans}
            onIfThenDone={setLoggingIfThen}
            onCreateIfThen={openIfThenFromThought}
            onDirtyChange={setActiveFormDirty}
          />
        )}
        {screen === "ifthen" && (
          <IfThenScreen
            plans={visibleIfThenPlans}
            logs={visibleIfThenLogs}
            prefill={prefillIfThen}
            flash={flash}
            privateDisplayMode={privacySettings.privateDisplayMode}
            onSavePlan={saveIfThenPlan}
            onDeletePlan={(id) => setPendingDelete({ kind: "ifthen", id })}
            onTogglePlan={toggleIfThenPlan}
            onRunPlan={setLoggingIfThen}
            onCreateSelfCare={(plan) => saveSelfCarePlan(createSelfCareFromIfThen(plan))}
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
            onIntro={openIntro}
            onHabit={openHabit}
            onDisplay={openDisplay}
            onIfThen={() => openIfThen(undefined, "menu")}
          />
        )}
        {screen === "about" && <AboutScreen />}
        {screen === "habit" && (
          <HabitSupportScreen
            settings={habitSettings}
            dailyRecords={visibleDailyRecords}
            privateDisplayMode={privacySettings.privateDisplayMode}
            flash={flash}
            onSave={updateHabitSettings}
            onDaily={openDaily}
            onIfThen={() => openIfThen(undefined, "habit")}
          />
        )}
        {screen === "display" && (
          <DisplaySettingsScreen
            settings={displaySettings}
            flash={flash}
            onSave={updateDisplaySettings}
          />
        )}
        {screen === "data" && (
          <DataManagement
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            selfCarePlans={selfCarePlans}
            selfCareLogs={selfCareLogs}
            ifThenPlans={ifThenPlans}
            ifThenLogs={ifThenLogs}
            consultationNotes={consultationNotes}
            thoughtNotes={thoughtNotes}
            visibleDailyRecords={visibleDailyRecords}
            visibleSuddenLogs={visibleSuddenLogs}
            visibleSelfCarePlans={visibleSelfCarePlans}
            visibleSelfCareLogs={visibleSelfCareLogs}
            visibleIfThenPlans={visibleIfThenPlans}
            visibleIfThenLogs={visibleIfThenLogs}
            visibleConsultationNotes={visibleConsultationNotes}
            visibleThoughtNotes={visibleThoughtNotes}
            privacySettings={privacySettings}
            habitSettings={habitSettings}
            reminderDismissals={reminderDismissals}
            displaySettings={displaySettings}
            demoDisplaySettings={demoDisplaySettings}
            flash={flash}
            onImportRequest={setPendingImport}
            onDeleteAllRequest={() => setPendingDelete({ kind: "all" })}
            onAddSampleData={addSampleData}
            onDeleteSampleData={deleteSampleData}
            onUpdateDemoDisplaySettings={updateDemoDisplaySettings}
            hasSampleData={hasSampleData}
          />
        )}
      </main>
      {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} onCreateIfThen={openIfThenFromSudden} />}
      {pendingDelete && (
        <ConfirmDeleteModal
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            if (pendingDelete.kind === "daily") deleteDaily(pendingDelete.id);
            if (pendingDelete.kind === "sudden") deleteSudden(pendingDelete.id);
            if (pendingDelete.kind === "selfcare") deleteSelfCarePlan(pendingDelete.id);
            if (pendingDelete.kind === "consultation") deleteConsultationNote(pendingDelete.id);
            if (pendingDelete.kind === "thought") deleteThoughtNote(pendingDelete.id);
            if (pendingDelete.kind === "ifthen") deleteIfThenPlan(pendingDelete.id);
            if (pendingDelete.kind === "all") deleteAllData();
          }}
          isAllData={pendingDelete.kind === "all"}
        />
      )}
      {loggingPlan && <SelfCareLogModal plan={loggingPlan} onCancel={() => setLoggingPlan(null)} onSave={saveSelfCareLog} />}
      {loggingIfThen && <IfThenLogModal plan={loggingIfThen} onCancel={() => setLoggingIfThen(null)} onSave={saveIfThenLog} />}
      {pendingImport && (
        <ConfirmImportModal
          onCancel={() => setPendingImport(null)}
          onConfirm={() => importBackup(pendingImport)}
        />
      )}
      <nav className="bottom-nav" aria-label="主要ナビゲーション">
        {[
          ["home", "ホーム", "⌂"],
          ["recordHub", "記録する", "♧"],
          ["review", "レポート", "◷"],
          ["menu", "マイページ", "♙"],
        ].map(([id, label, icon]) => (
          <button
            className={navGroup(screen) === id ? "active" : ""}
            key={id}
            aria-label={`${label}を開く`}
            aria-current={navGroup(screen) === id ? "page" : undefined}
            onClick={() => {
              moveToScreen(id as Screen);
            }}
          >
            <span className="nav-icon" aria-hidden="true">{icon}</span>
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

function IntroScreen({
  onDemo,
  onStart,
  onGuide,
  onClose,
}: {
  onDemo: () => void;
  onStart: () => void;
  onGuide: () => void;
  onClose: () => void;
}) {
  const featureCards = [
    ["日々の状態を記録する", "気分、睡眠、不安感、活動を短く残せます。"],
    ["状態の波をふり返る", "月間グラフやリングで、記録上の波を見られます。"],
    ["思考のくせに気づく", "頭に浮かんだ考えを、責めずに整理できます。"],
    ["If-Thenプランを作る", "きっかけに合わせた小さな行動を決めておけます。"],
    ["セルフケアを試す", "自分に合う整え方を、実行ログと一緒に残せます。"],
    ["相談前にまとめる", "話したいことを相談時の材料として整理できます。"],
  ];
  const steps = [
    "今日の状態を短く記録する",
    "きっかけや思考のくせに気づく",
    "If-Thenプランで小さな行動を決める",
    "実行して整いやすさを記録する",
    "月間ふり返りや相談前まとめに使う",
  ];

  return (
    <main className="intro-screen">
      <section className="intro-hero">
        <div className="intro-hero-icon" aria-hidden="true">☘</div>
        <p className="eyebrow">はじめに</p>
        <h1>Self Compass</h1>
        <p className="intro-lead">自分の状態を記録し、波や整いやすい行動をふり返るセルフケア記録アプリ</p>
        <p className="soft-text">日々の記録、状態の波、思考メモ、If-Thenプラン、セルフケア、相談前まとめをひとつに整理できます。</p>
        <div className="intro-actions">
          <button className="primary-btn" onClick={onDemo} type="button">デモで試す</button>
          <button className="secondary-btn no-margin" onClick={onStart} type="button">自分の記録を始める</button>
          <button className="ghost-btn" onClick={onClose} type="button">あとで見る</button>
        </div>
      </section>

      <section className="intro-section">
        <h2>できること</h2>
        <div className="intro-feature-grid">
          {featureCards.map(([title, body]) => (
            <article className="intro-feature-card" key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="intro-section">
        <h2>使い方の流れ</h2>
        <ol className="intro-step-list">
          {steps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="intro-section intro-note-card">
        <h2>データ保存について</h2>
        <p>記録はお使いのブラウザ内に保存されます。共有URLを開いた人同士で記録が共有されるわけではありません。</p>
        <p>端末変更やブラウザデータ削除に備えて、必要に応じてデータ管理からバックアップしてください。</p>
      </section>

      <section className="intro-section intro-note-card">
        <h2>注意事項</h2>
        <p>Self Compass は診断や治療を行うものではありません。記録は、自分の状態をふり返ったり、医師・カウンセラー・支援者に相談するときの参考情報として利用してください。</p>
      </section>

      <section className="intro-section intro-bottom-actions">
        <button className="primary-btn" onClick={onDemo} type="button">デモで試す</button>
        <button className="secondary-btn no-margin" onClick={onStart} type="button">自分の記録を始める</button>
        <button className="secondary-btn no-margin" onClick={onGuide} type="button">使い方ガイドを見る</button>
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
  ifThenPlans,
  ifThenLogs,
  consultationNotes,
  thoughtNotes,
  privateDisplayMode,
  habitSettings,
  reminderDismissals,
  flash,
  onDaily,
  onSudden,
  onConsultation,
  onLock,
  onCareDone,
  onIfThenDone,
  onCalendar,
  onThought,
  onIfThen,
  onSelfCare,
  onHabit,
  onMetricDetail,
  onDismissReminder,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCarePlans: SelfCarePlan[];
  selfCareLogs: SelfCareLog[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  consultationNotes: ConsultationNote[];
  thoughtNotes: ThoughtNote[];
  privateDisplayMode: boolean;
  habitSettings: HabitSettings;
  reminderDismissals: ReminderDismissal[];
  flash: string;
  onDaily: () => void;
  onSudden: () => void;
  onConsultation: () => void;
  onLock: () => void;
  onCareDone: (plan: SelfCarePlan) => void;
  onIfThenDone: (plan: IfThenPlan) => void;
  onCalendar: () => void;
  onThought: () => void;
  onIfThen: () => void;
  onSelfCare: () => void;
  onHabit: () => void;
  onMetricDetail: (metric: MetricType) => void;
  onDismissReminder: () => void;
}) {
  const [showStabilityDetails, setShowStabilityDetails] = useState(false);
  const todayRecord = dailyRecords.find((record) => record.date === today());
  const showFirstUseHint = dailyRecords.length === 0 && suddenLogs.length === 0;
  const showReminder = shouldShowHabitReminder(habitSettings, dailyRecords, reminderDismissals);
  const stability = calculateStabilityScore(today(), dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs);
  const score = stability.score;
  const anxietyValue = todayRecord?.anxiety ?? nullableAverage(dailyRecords.slice(-7).map((record) => record.anxiety));
  const todayCareCount = selfCareLogs.filter((log) => log.createdAt.slice(0, 10) === today()).length;
  const todayIfThenCount = ifThenLogs.filter((log) => log.createdAt.slice(0, 10) === today()).length;
  const trendPoints = buildMoodTrendPoints(dailyRecords, "week");
  const stabilityLabel = score === null ? "記録待ち" : score >= 80 ? "安定" : score >= 60 ? "やや安定" : score >= 40 ? "ゆらぎあり" : "ゆっくり整える";
  const stabilityNote = score === null
    ? "今日の記録を残すと、状態の目安を確認できます。"
    : score >= 60
      ? "ここ数日は安定しています。この調子でいきましょう。"
      : "今日はゆっくり、自分に合うペースで過ごしましょう。";
  const sleepStatus = !todayRecord || !isFiniteNumber(todayRecord.sleepHours)
    ? "記録なし"
    : todayRecord.sleepHours >= 7
      ? "よく眠れた"
      : todayRecord.sleepHours >= 6
        ? "やや不足"
        : "短め";
  const anxietyStatus = !isFiniteNumber(anxietyValue)
    ? "記録なし"
    : anxietyValue <= 3
      ? "落ち着いている"
      : anxietyValue <= 6
        ? "落ち着いている"
        : "少し高め";
  const activityCount = (todayRecord?.wentOut === "あり" ? 1 : 0)
    + (todayRecord?.exercise && todayRecord.exercise !== "なし" ? 1 : 0)
    + todayCareCount
    + todayIfThenCount;
  const careHint = privateDisplayMode
    ? "今日のセルフケアのヒントがあります。"
    : selfCarePlans[0]?.title || "深呼吸を3回して、今の気持ちにやさしく気づいてみましょう。";

  return (
    <section className="home-screen reference-home">
      <header className="home-topbar">
        <button className="round-icon-btn reference-leaf-button" onClick={onHabit} aria-label="習慣サポートを開く" type="button">♧</button>
        <div className="home-date" aria-label={`${today().slice(0, 4)}年 ${formatJapaneseDate(today())} ${weekdayLabel(today())}`}>
          <strong>{today().slice(0, 4)}年{formatJapaneseDate(today())} {weekdayShortLabel(today())}</strong>
        </div>
        <button className="round-icon-btn reference-bell-button" onClick={onLock} aria-label="ロックする" type="button">♧</button>
      </header>

      {flash && <div className="success-message">{flash}</div>}
      {showFirstUseHint && (
        <div className="notice compact-notice">
          まずは今日の記録から始められます。すべてを入力しなくても大丈夫です。
        </div>
      )}

      {showReminder && <button className="reference-reminder" onClick={onDaily} type="button">{habitSettings.reminderMessage || defaultReminderMessages[0]} <span>›</span></button>}

      <section className="mood-hero reference-score-card" aria-label="今日の状態スコア">
        <button
          className="mood-ring mood-ring-button"
          style={{ "--score": score ?? 0 } as React.CSSProperties}
          onClick={() => setShowStabilityDetails(true)}
          type="button"
          aria-label="安定度の内訳を見る"
        >
          <div className="mood-ring-inner">
            <strong className={privateDisplayMode ? "private-score-label" : ""}>{privateDisplayMode ? "記録あり" : score ?? "-"}</strong>
            <span>{privateDisplayMode ? "" : score === null ? "記録待ち" : "/100"}</span>
          </div>
        </button>
        <aside className="home-stability-insight" aria-label="今日の安定度について">
          <span>今日の安定スコア</span>
          <strong>{privateDisplayMode ? "記録あり" : stabilityLabel}</strong>
          <p>{privateDisplayMode ? "記録上の傾向があります。詳細は非表示です。" : stabilityNote}</p>
          <button onClick={() => setShowStabilityDetails(true)} type="button" aria-label="安定度の内訳を見る"><span aria-hidden="true">›</span></button>
        </aside>
      </section>

      <section className="home-summary-cards" aria-label="今日のサマリー">
        <button className="summary-tile metric-summary-sleep" onClick={() => onMetricDetail("sleep")} type="button" aria-label="睡眠詳細を見る">
          <span className="tile-icon">☾</span>
          <span>睡眠</span>
          <strong>{privateDisplayMode && todayRecord ? "記録あり" : todayRecord ? formatSleepHours(todayRecord.sleepHours) : "未入力"}</strong>
          <em>{sleepStatus}</em>
        </button>
        <button className="summary-tile metric-summary-anxiety" onClick={() => onMetricDetail("anxiety")} type="button" aria-label="不安感詳細を見る">
          <span className="tile-icon">♧</span>
          <span>不安感</span>
          <strong>{privateDisplayMode && todayRecord ? "記録あり" : isFiniteNumber(anxietyValue) ? `${Math.round(anxietyValue)}/10` : "未入力"}</strong>
          <em>{anxietyStatus}</em>
        </button>
        <button className="summary-tile metric-summary-activity" onClick={() => onMetricDetail("activity")} type="button" aria-label="活動詳細を見る">
          <span className="tile-icon">↟</span>
          <span>活動</span>
          <strong>{privateDisplayMode && activityCount > 0 ? "記録あり" : `${activityCount}回`}</strong>
          <em>{activityCount > 1 ? "活動あり" : activityCount === 1 ? "低め" : "記録なし"}</em>
        </button>
      </section>

      <section className="section-block home-chart-card reference-trend-card">
        <div className="mood-chart-head">
          <h2>気分の推移（過去7日間）</h2>
          <button className="reference-status-pill" onClick={onCalendar} type="button">{stabilityLabel} <span>›</span></button>
        </div>
        <HomeMoodLineChart points={trendPoints} privateDisplayMode={privateDisplayMode} />
      </section>

      <section className="reference-primary-actions" aria-label="今月とプランのショートカット">
        <button className="reference-primary-action monthly" onClick={onCalendar} type="button">
          <span className="reference-action-icon ring-calendar" aria-hidden="true">▦</span>
          <span><strong>今月のふりかえり</strong><small>{Number(today().slice(5, 7))}月のまとめを見る</small></span>
          <i aria-hidden="true">›</i>
        </button>
        <button className="reference-primary-action ifthen" onClick={onIfThen} type="button">
          <span className="reference-action-icon" aria-hidden="true">◎</span>
          <span><strong>If-Thenプラン</strong><small>{privateDisplayMode ? "プランあり" : `${ifThenPlans.filter((plan) => plan.isActive).length}件のプランあり`}</small></span>
          <i aria-hidden="true">›</i>
        </button>
      </section>

      <section className="section-block reference-care-card">
        <h2>今日のセルフケアのヒント</h2>
        <button className="reference-care-action" onClick={onSelfCare} type="button">
          <span className="reference-care-leaf" aria-hidden="true">♧</span>
          <strong>{careHint}</strong>
          <span aria-hidden="true">›</span>
        </button>
      </section>
      {showStabilityDetails && (
        <StabilityDetailModal
          date={today()}
          stability={stability}
          dailyRecord={todayRecord}
          suddenLogs={suddenLogs}
          thoughtNotes={thoughtNotes}
          selfCareLogs={selfCareLogs}
          ifThenLogs={ifThenLogs}
          privateDisplayMode={privateDisplayMode}
          onClose={() => setShowStabilityDetails(false)}
        />
      )}
    </section>
  );
}

function HomeMoodLineChart({ points, privateDisplayMode }: { points: TrendPoint[]; privateDisplayMode: boolean }) {
  const width = 300;
  const height = 104;
  const plotLeft = 30;
  const plotRight = 292;
  const plotTop = 10;
  const plotBottom = 76;
  const pointX = (index: number) => points.length <= 1 ? (plotLeft + plotRight) / 2 : plotLeft + (plotRight - plotLeft) * index / (points.length - 1);
  const pointY = (value: number) => plotBottom - Math.max(0, Math.min(10, value)) / 10 * (plotBottom - plotTop);
  const segments: string[][] = [];
  let current: string[] = [];
  points.forEach((point, index) => {
    if (!isFiniteNumber(point.value)) {
      if (current.length) segments.push(current);
      current = [];
      return;
    }
    current.push(`${pointX(index)},${pointY(point.value)}`);
  });
  if (current.length) segments.push(current);

  return (
    <div className="reference-line-chart" aria-label="過去7日間の気分の推移">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden={privateDisplayMode}>
        {[10, 5, 0].map((value) => {
          const y = pointY(value);
          return (
            <g key={value}>
              <line x1={plotLeft} x2={plotRight} y1={y} y2={y} className="reference-chart-grid" />
              <text x="2" y={y + 3} className="reference-chart-axis">{privateDisplayMode ? "" : value}</text>
            </g>
          );
        })}
        {segments.map((segment, index) => (
          <polyline key={index} points={segment.join(" ")} className="reference-chart-line" />
        ))}
        {points.map((point, index) => isFiniteNumber(point.value) ? (
          <circle key={point.date} cx={pointX(index)} cy={pointY(point.value)} r="2.8" className="reference-chart-dot" />
        ) : null)}
        {points.map((point, index) => (
          <text key={`${point.date}-label`} x={pointX(index)} y="98" textAnchor="middle" className="reference-chart-date">
            {privateDisplayMode ? "" : `${Number(point.date.slice(5, 7))}/${Number(point.date.slice(8, 10))}`}
          </text>
        ))}
      </svg>
    </div>
  );
}

function StabilityDetailModal({
  date,
  stability,
  dailyRecord,
  suddenLogs,
  thoughtNotes,
  selfCareLogs,
  ifThenLogs,
  privateDisplayMode,
  onClose,
}: {
  date: string;
  stability: StabilityScore;
  dailyRecord?: DailyRecord;
  suddenLogs: SuddenLog[];
  thoughtNotes: ThoughtNote[];
  selfCareLogs: SelfCareLog[];
  ifThenLogs: IfThenLog[];
  privateDisplayMode: boolean;
  onClose: () => void;
}) {
  const daySudden = suddenLogs.filter((log) => log.occurredAt.slice(0, 10) === date);
  const dayThoughts = thoughtNotes.filter((note) => note.date === date);
  const dayCare = selfCareLogs.filter((log) => log.createdAt.slice(0, 10) === date);
  const dayIfThen = ifThenLogs.filter((log) => log.createdAt.slice(0, 10) === date);
  const partScore = (key: StabilityPart["key"]) => stability.parts.find((part) => part.key === key)?.score ?? null;
  const privateValue = (hasRecord: boolean) => hasRecord ? "記録あり" : "未入力";
  const rows = [
    {
      key: "mood",
      label: "気分 / 安定度",
      value: dailyRecord ? `${formatScore(dailyRecord.mood)} / ${formatRingValue(stability.score, "%")}` : formatRingValue(stability.score, "%"),
      has: Boolean(dailyRecord || stability.score !== null),
      score: dailyRecord && isFiniteNumber(dailyRecord.mood) ? dailyRecord.mood * 10 : stability.score,
      comment: dailyRecord ? "今日の状態をまとめる中心の記録です。" : "今日の記録があると見えやすくなります。",
    },
    {
      key: "anxiety",
      label: "不安感",
      value: dailyRecord ? formatScore(dailyRecord.anxiety) : "未入力",
      has: Boolean(dailyRecord && isFiniteNumber(dailyRecord.anxiety)),
      score: dailyRecord ? scoreLowGood(dailyRecord.anxiety) : null,
      comment: dailyRecord && isFiniteNumber(dailyRecord.anxiety) ? "今日は記録上の不安感を参考にしています。" : "この項目は今回の計算には含めていません。",
    },
    {
      key: "sleep",
      label: "睡眠",
      value: dailyRecord ? `${formatSleepHours(dailyRecord.sleepHours)} / ${dailyRecord.sleepQuality}` : "未入力",
      has: Boolean(dailyRecord && (hasSleepHours(dailyRecord) || dailyRecord.sleepQuality)),
      score: partScore("sleep"),
      comment: partScore("sleep") !== null ? "睡眠の記録が安定度を支えている可能性があります。" : "睡眠の記録があると見えやすくなります。",
    },
    {
      key: "fatigue",
      label: "疲労度",
      value: dailyRecord ? formatScore(dailyRecord.fatigue) : "未入力",
      has: Boolean(dailyRecord && isFiniteNumber(dailyRecord.fatigue)),
      score: dailyRecord ? scoreLowGood(dailyRecord.fatigue) : null,
      comment: dailyRecord && isFiniteNumber(dailyRecord.fatigue) ? "疲れの強さを参考にしています。" : "この項目は今回の計算には含めていません。",
    },
    {
      key: "activity",
      label: "活動",
      value: activityScoreForDate(date, dailyRecord ? [dailyRecord] : [], dayCare, dayIfThen) === null ? "記録なし" : `${activityScoreForDate(date, dailyRecord ? [dailyRecord] : [], dayCare, dayIfThen)}回`,
      has: activityScoreForDate(date, dailyRecord ? [dailyRecord] : [], dayCare, dayIfThen) !== null,
      score: partScore("lifestyle"),
      comment: partScore("lifestyle") !== null ? "外出・運動・小さな行動を参考にしています。" : "活動の記録があると参考になります。",
    },
    {
      key: "sudden",
      label: "突発ログ",
      value: `${daySudden.length}件`,
      has: daySudden.length > 0,
      score: partScore("wave"),
      comment: daySudden.length > 0 ? "状態の波の記録を参考にしています。" : "状態の波の記録はありません。",
    },
    {
      key: "thought",
      label: "思考メモ",
      value: `${dayThoughts.length}件`,
      has: dayThoughts.length > 0,
      score: partScore("thought"),
      comment: dayThoughts.length > 0 ? "思考メモの件数や感情の強さを参考にしています。" : "思考メモは記録されていません。",
    },
    {
      key: "care",
      label: "セルフケア",
      value: `${dayCare.length}回`,
      has: dayCare.length > 0,
      score: partScore("selfcare"),
      comment: dayCare.length > 0 ? "小さなセルフケアが記録されています。" : "実行ログがあると整いやすさを見やすくなります。",
    },
    {
      key: "ifthen",
      label: "If-Thenプラン",
      value: `${dayIfThen.length}回`,
      has: dayIfThen.length > 0,
      score: partScore("ifthen"),
      comment: dayIfThen.length > 0 ? "実行しやすさや整いやすさの記録があります。" : "If-Then実行ログがあると反映されます。",
    },
  ];
  const visibleRows = rows.map((row) => ({
    ...row,
    value: privateDisplayMode ? privateValue(row.has) : row.value,
  }));
  const supportRows = rows.filter((row) => row.score !== null && row.score >= 68).map((row) => row.label);
  const todayComment = stability.score === null
    ? "今日はまだ記録が少なめです。記録が増えると、安定度の内訳が見えやすくなります。"
    : supportRows.length
      ? `今日は${supportRows.slice(0, 2).join("と")}が安定度を支えている可能性があります。`
      : "入力されている記録をもとにした参考表示です。状態の波があった日も、あとから整いやすい行動を見つける材料になります。";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="stability-detail-title">
      <section className="stability-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">参考スコア</p>
            <h2 id="stability-detail-title">安定度の内訳</h2>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="閉じる" type="button">×</button>
        </div>
        <p className="soft-text">安定度は、今日の記録から見える状態の波や整いやすさをまとめた参考スコアです。診断や治療判断ではありません。</p>
        <p className="tiny-note">未入力の項目は0として扱わず、入力されている記録をもとに計算しています。</p>
        <div className="stability-modal-score">
          <strong>{privateDisplayMode ? "非表示です" : stability.score === null ? "記録待ち" : `${stability.score}%`}</strong>
          <span>{stability.isReference ? "今日は参考値です" : "記録上の参考情報です"}</span>
        </div>
        <div className="stability-detail-list">
          {visibleRows.map((row) => (
            <article className={`stability-detail-item ${row.key}`} key={row.key}>
              <div>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
              <em>{impactLabel(row.score, row.has)}</em>
              <div className="mini-gauge" aria-label={`${row.label} ${row.score === null ? "記録なし" : `${Math.round(row.score)}%`}`}>
                <i style={{ width: `${row.score ?? 0}%` }} />
              </div>
              <p>{privateDisplayMode ? "詳細は非表示です。" : row.comment}</p>
            </article>
          ))}
        </div>
        <section className="stability-today-comment">
          <h3>今日のひとこと</h3>
          <p>{privateDisplayMode ? "記録上の傾向があります。詳細は非表示です。" : todayComment}</p>
        </section>
        <details className="stability-calculation-note">
          <summary>計算について</summary>
          <p>安定度は、気分、不安感、睡眠、活動、セルフケア、If-Thenプランなどの記録をもとにした参考スコアです。未入力の項目は0点として扱わず、入力された記録だけを参考にしています。</p>
          <p>このスコアは診断や治療判断ではなく、自分の状態をふり返るための目安です。</p>
        </details>
      </section>
    </div>
  );
}

function HomeTrendBars({
  points,
  range,
  monthView,
  ringDays,
  dailyRecords,
  suddenLogs,
  thoughtNotes,
  ifThenPlans,
  ifThenLogs,
  selfCareLogs,
  privateDisplayMode,
  onOpenRingDate,
  onDaily,
}: {
  points: TrendPoint[];
  range: TrendRange;
  monthView: MonthChartView;
  ringDays: DailyRingData[];
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  thoughtNotes: ThoughtNote[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  selfCareLogs: SelfCareLog[];
  privateDisplayMode: boolean;
  onOpenRingDate: () => void;
  onDaily: () => void;
}) {
  const defaultActiveDate = points.find((point) => point.isActive)?.date || points.find((point) => isFiniteNumber(point.value))?.date || points[0]?.date || "";
  const [selectedDate, setSelectedDate] = useState(defaultActiveDate);
  useEffect(() => {
    if (!points.length) return;
    if (points.some((point) => point.date === selectedDate)) return;
    setSelectedDate(defaultActiveDate);
  }, [defaultActiveDate, points, selectedDate]);
  const hasValue = points.some((point) => isFiniteNumber(point.value));
  if (range === "month" && monthView === "ring") {
    return (
      <>
        <MonthlyRingView days={ringDays} privateDisplayMode={privateDisplayMode} compact selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        {selectedDate && (
          <SelectedDaySummaryCard
            date={selectedDate}
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            thoughtNotes={thoughtNotes}
            ifThenPlans={ifThenPlans}
            ifThenLogs={ifThenLogs}
            selfCareLogs={selfCareLogs}
            privateDisplayMode={privateDisplayMode}
            focusMetric="mood"
            compact
            onOpenDailyRecord={onDaily}
            onAddRecord={onDaily}
          />
        )}
        <button className="secondary-btn no-margin" onClick={onOpenRingDate} type="button">カレンダーで詳しく見る</button>
        <p className="tiny-note">未入力の日は0として扱わず、薄いリングで表示しています。参考表示です。</p>
      </>
    );
  }
  return (
    <>
      {!hasValue && (
        <p className="empty-box">{range === "day" ? "今日はまだ記録がありません。" : "この期間の気分記録はまだありません。記録が増えると見えやすくなります。"}</p>
      )}
      <div className={`home-bars range-${range}`} aria-label="気分の推移">
        <ChartZoneLabels />
        {points.map((point, index) => {
          const isSelected = point.date === selectedDate;
          const shouldShowLabel = privateDisplayMode ? false : shouldShowTrendPointLabel(point, points, range, selectedDate);
          return (
          <button
            className={[point.value === null ? "home-bar-wrap empty" : "home-bar-wrap", isSelected ? "selected" : ""].filter(Boolean).join(" ")}
            key={`${point.label}-${index}`}
            onClick={() => setSelectedDate(point.date)}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${point.label} ${point.value === null ? "記録なし" : `気分 ${point.value}`}`}
          >
            <div
              className={isSelected ? "home-bar active" : "home-bar"}
              style={getMetricBarStyle("mood", point.value, 10, isSelected)}
            />
            <small className={isSelected ? "selected-label" : ""}>{shouldShowLabel ? trendPointDisplayLabel(point, range) : ""}</small>
          </button>
          );
        })}
      </div>
      <TrendLegend metricType="mood" />
      {selectedDate && (
        <SelectedDaySummaryCard
          date={selectedDate}
          dailyRecords={dailyRecords}
          suddenLogs={suddenLogs}
          thoughtNotes={thoughtNotes}
          ifThenPlans={ifThenPlans}
          ifThenLogs={ifThenLogs}
          selfCareLogs={selfCareLogs}
          privateDisplayMode={privateDisplayMode}
          focusMetric="mood"
          compact
          onOpenDailyRecord={onDaily}
          onAddRecord={onDaily}
        />
      )}
      <p className="tiny-note">{range === "day" ? "今日の気分スコアを表示しています。" : "未入力の日は0として扱わず、薄い表示にしています。参考表示です。"}</p>
    </>
  );
}

function SegmentControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={`segmented-mini ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          className={value === option.value ? "active" : ""}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ViewSegment<T extends MonthChartView | CalendarView>({ value, onChange, labels }: { value: T; onChange: (value: T) => void; labels: Record<T, string> }) {
  return (
    <SegmentControl
      value={value}
      onChange={onChange}
      options={Object.entries(labels).map(([key, label]) => ({ value: key as T, label: label as string }))}
      ariaLabel="表示形式"
      className="view-segment"
    />
  );
}

function MetricDetailScreen({
  metricType,
  dailyRecords,
  suddenLogs,
  selfCareLogs,
  ifThenPlans,
  ifThenLogs,
  thoughtNotes,
  privateDisplayMode,
  onDaily,
  onRecords,
}: {
  metricType: MetricType;
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCareLogs: SelfCareLog[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  thoughtNotes: ThoughtNote[];
  privateDisplayMode: boolean;
  onDaily: () => void;
  onRecords: () => void;
}) {
  const [range, setRange] = useState<TrendRange>("week");
  const title = metricType === "sleep" ? "睡眠詳細" : metricType === "anxiety" ? "不安感詳細" : "活動詳細";
  const todayRecord = dailyRecords.find((record) => record.date === today());
  const weekRecords = dailyRecords.filter((record) => daysAgo(record.date) >= 0 && daysAgo(record.date) < 7);
  const monthRecords = dailyRecords.filter((record) => record.date.startsWith(today().slice(0, 7)));
  const points = buildMetricTrendPoints(metricType, range, dailyRecords, selfCareLogs, ifThenLogs);
  const metricDefaultDate = getInitialSelectedDateFromPoints(points);
  const [selectedMetricDate, setSelectedMetricDate] = useState(metricDefaultDate);
  useEffect(() => {
    if (!points.length) return;
    if (points.some((point) => point.date === selectedMetricDate)) return;
    setSelectedMetricDate(metricDefaultDate);
  }, [metricDefaultDate, points, selectedMetricDate]);
  const max = metricType === "activity" ? Math.max(4, ...points.map((point) => point.value || 0)) : 10;
  const todayValue = formatMetricToday(metricType, todayRecord, selfCareLogs, ifThenLogs, privateDisplayMode);
  const weekAverage = formatMetricAverage(metricType, weekRecords, selfCareLogs, ifThenLogs, 7, privateDisplayMode);
  const monthAverage = formatMetricAverage(metricType, monthRecords, selfCareLogs, ifThenLogs, 31, privateDisplayMode);
  const recordDays = new Set(monthRecords.map((record) => record.date)).size;
  const content = getMetricDetailContent(metricType, dailyRecords, suddenLogs, selfCareLogs, ifThenPlans, ifThenLogs, thoughtNotes);

  return (
    <section className={`metric-detail metric-${metricType}`}>
      <header className="page-head">
        <div>
          <p className="eyebrow">指標のふり返り</p>
          <h1>{title}</h1>
        </div>
      </header>
      <p className="soft-text">{content.lead}</p>

      <section className="section-block metric-detail-hero">
        <div className="summary-list">
          <Metric label="今日" value={todayValue} />
          <Metric label="直近7日平均" value={weekAverage} />
          <Metric label="今月平均" value={monthAverage} />
          <Metric label="記録日数" value={privateDisplayMode ? "記録状況あり" : `${recordDays}日`} />
        </div>
        <p className="tiny-note">未入力の日は平均に含めていません。記録上の参考情報です。</p>
      </section>

      <section className="section-block home-chart-card">
        <div className="section-title-row">
          <h2>{content.trendTitle}</h2>
          <RangeSegment value={range} onChange={setRange} />
        </div>
        <MetricTrendBars
          points={points}
          max={max}
          range={range}
          metricType={metricType}
          privateDisplayMode={privateDisplayMode}
          selectedDate={selectedMetricDate}
          onSelectDate={setSelectedMetricDate}
        />
        {selectedMetricDate && (
          <SelectedDaySummaryCard
            date={selectedMetricDate}
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            thoughtNotes={thoughtNotes}
            ifThenPlans={ifThenPlans}
            ifThenLogs={ifThenLogs}
            selfCareLogs={selfCareLogs}
            privateDisplayMode={privateDisplayMode}
            focusMetric={metricType}
            onOpenDailyRecord={onDaily}
            onAddRecord={onDaily}
          />
        )}
      </section>

      <section className="section-block data-card">
        <h2>短いふり返り</h2>
        <p className="soft-text">{content.comment}</p>
        <div className="summary-list">
          {content.metrics.map(([label, value]) => (
            <Metric key={label} label={label} value={privateDisplayMode ? "記録あり" : value} />
          ))}
        </div>
      </section>

      <section className="section-block data-card">
        <h2>関連する記録</h2>
        <p className="soft-text">{content.relatedText}</p>
        <div className="data-actions">
          <button className="secondary-btn no-margin" onClick={onRecords} type="button">記録一覧を見る</button>
          <button className="secondary-btn no-margin" onClick={onDaily} type="button">今日の記録を確認・編集</button>
        </div>
      </section>
    </section>
  );
}

function RangeSegment({ value, onChange }: { value: TrendRange; onChange: (value: TrendRange) => void }) {
  return (
    <SegmentControl
      value={value}
      onChange={onChange}
      options={[
        { value: "month", label: "月" },
        { value: "week", label: "週" },
        { value: "day", label: "日" },
      ]}
      ariaLabel="表示期間"
    />
  );
}

function MetricTrendBars({
  points,
  max,
  range,
  metricType,
  privateDisplayMode,
  selectedDate,
  onSelectDate,
}: {
  points: TrendPoint[];
  max: number;
  range: TrendRange;
  metricType: MetricType | "mood";
  privateDisplayMode: boolean;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}) {
  const hasValue = points.some((point) => isFiniteNumber(point.value));
  return (
    <>
      {!hasValue && <p className="empty-box">この期間の記録はまだありません。記録が増えると見えやすくなります。</p>}
      <div className={`home-bars metric-bars range-${range} metric-bars-${metricType}`} aria-label="指標の推移">
        {metricType === "mood" && <ChartZoneLabels />}
        {points.map((point, index) => {
          const isSelected = selectedDate ? point.date === selectedDate : Boolean(point.isActive);
          const shouldShowLabel = privateDisplayMode ? false : shouldShowTrendPointLabel(point, points, range, selectedDate);
          return (
            <button
              className={[point.value === null ? "home-bar-wrap empty" : "home-bar-wrap", isSelected ? "selected" : ""].filter(Boolean).join(" ")}
              key={`${point.date}-${index}`}
              onClick={() => onSelectDate?.(point.date)}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${point.label} ${point.value === null ? "記録なし" : `${point.value}`}`}
            >
              <div className={isSelected ? "home-bar active" : "home-bar"} style={getMetricBarStyle(metricType, point.value, max, isSelected)} />
              <small className={isSelected ? "selected-label" : ""}>{shouldShowLabel ? trendPointDisplayLabel(point, range) : ""}</small>
            </button>
          );
        })}
      </div>
      <TrendLegend metricType={metricType} />
    </>
  );
}

function ChartZoneLabels() {
  return (
    <div className="chart-zone-labels" aria-hidden="true">
      <span>高め<small>8-10</small></span>
      <span>中間<small>4-7</small></span>
      <span>低め<small>0-3</small></span>
    </div>
  );
}

function SelectedDaySummaryCard({
  date,
  dailyRecords,
  suddenLogs,
  thoughtNotes,
  ifThenPlans,
  ifThenLogs,
  selfCareLogs,
  privateDisplayMode,
  focusMetric,
  compact = false,
  onOpenDailyRecord,
  onAddRecord,
}: {
  date: string;
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  thoughtNotes: ThoughtNote[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  selfCareLogs: SelfCareLog[];
  privateDisplayMode: boolean;
  focusMetric?: MetricType | "mood";
  compact?: boolean;
  onOpenDailyRecord?: () => void;
  onAddRecord?: () => void;
}) {
  const daily = dailyRecords.find((record) => record.date === date);
  const suddenCount = suddenLogs.filter((log) => log.occurredAt.slice(0, 10) === date).length;
  const thoughtCount = thoughtNotes.filter((note) => note.date === date).length;
  const ifThenCount = ifThenLogs.filter((log) => log.createdAt.slice(0, 10) === date).length;
  const selfCareCount = selfCareLogs.filter((log) => log.createdAt.slice(0, 10) === date).length;
  const activity = activityScoreForDate(date, dailyRecords, selfCareLogs, ifThenLogs);
  const hasAny = Boolean(daily) || suddenCount > 0 || thoughtCount > 0 || ifThenCount > 0 || selfCareCount > 0;
  const stability = hasAny ? calculateStabilityScore(date, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs).score : null;
  const privateValue = (hasRecord: boolean) => hasRecord ? "記録あり" : "記録なし";
  const rows = [
    { key: "mood", label: "気分 / 安定度", value: daily ? `${formatScore(daily.mood)} / ${formatRingValue(stability, "%")}` : formatRingValue(stability, "%"), has: Boolean(daily || stability !== null) },
    { key: "sleep", label: "睡眠", value: daily ? `${formatSleepHours(daily.sleepHours)} / ${daily.sleepQuality}` : "記録なし", has: Boolean(daily && (hasSleepHours(daily) || daily.sleepQuality)) },
    { key: "anxiety", label: "不安感", value: daily ? formatScore(daily.anxiety) : "未入力", has: Boolean(daily && isFiniteNumber(daily.anxiety)) },
    { key: "activity", label: "活動", value: isFiniteNumber(activity) ? `${activity}回` : "記録なし", has: isFiniteNumber(activity) },
    { key: "sudden", label: "突発ログ", value: `${suddenCount}件`, has: suddenCount > 0 },
    { key: "thought", label: "思考メモ", value: `${thoughtCount}件`, has: thoughtCount > 0 },
    { key: "ifthen", label: "If-Then", value: `${ifThenCount}回`, has: ifThenCount > 0 },
    { key: "care", label: "セルフケア", value: `${selfCareCount}回`, has: selfCareCount > 0 },
  ];
  const orderedRows = focusMetric === "sleep"
    ? [rows[1], rows[0], rows[2], rows[4], rows[5], rows[6], rows[7]]
    : focusMetric === "anxiety"
      ? [rows[2], rows[4], rows[5], rows[0], rows[1], rows[6], rows[7]]
      : focusMetric === "activity"
        ? [rows[3], rows[6], rows[7], rows[0], rows[1], rows[2], rows[4], rows[5]]
        : rows;
  return (
    <div className={compact ? "selected-day-card compact" : "selected-day-card"}>
      <div className="selected-day-head">
        <div>
          <span className="label">この日の記録</span>
          <strong>{formatJapaneseDate(date)}</strong>
        </div>
        <span className={hasAny ? "soft-pill" : "soft-pill muted"}>{hasAny ? "記録あり" : "記録なし"}</span>
      </div>
      {!hasAny && <p className="empty-box">この日はまだ記録がありません。</p>}
      <div className="selected-day-grid">
        {orderedRows.map((row) => (
          <div className={`selected-day-item ${row.key}`} key={row.key}>
            <span>{row.label}</span>
            <strong>{privateDisplayMode ? privateValue(row.has) : row.value}</strong>
          </div>
        ))}
      </div>
      <div className="data-actions">
        <button className="secondary-btn no-margin" onClick={daily ? onOpenDailyRecord : onAddRecord} type="button">
          {daily ? "この日の記録を見る" : "この日の記録を追加する"}
        </button>
      </div>
    </div>
  );
}

function CalendarMonthBarView({ currentMonth, dailyRecords, privateDisplayMode, selectedDate, onSelectDate }: { currentMonth: string; dailyRecords: DailyRecord[]; privateDisplayMode: boolean; selectedDate?: string; onSelectDate?: (date: string) => void }) {
  const points = buildMoodTrendPointsForMonth(currentMonth, dailyRecords);
  return (
    <div className="calendar-bar-view">
      <MetricTrendBars points={points} max={10} range="month" metricType="mood" privateDisplayMode={privateDisplayMode} selectedDate={selectedDate} onSelectDate={onSelectDate} />
      <p className="tiny-note">月内の日別の気分を表示しています。未入力の日は0として扱わず、薄い表示にしています。</p>
    </div>
  );
}

function MonthlyRingView({
  days,
  privateDisplayMode,
  compact = false,
  onOpenDate,
  onEditDate,
  selectedDate: controlledSelectedDate,
  onSelectDate,
  actionLabel,
  editLabel = "この日の記録を編集・追加",
  summary,
}: {
  days: DailyRingData[];
  privateDisplayMode: boolean;
  compact?: boolean;
  onOpenDate?: (date: string) => void;
  onEditDate?: (date: string) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  actionLabel?: string;
  editLabel?: string;
  summary?: RingMonthlySummary;
}) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(today());
  const selectedDate = controlledSelectedDate ?? internalSelectedDate;
  const updateSelectedDate = (date: string) => {
    onSelectDate?.(date);
    if (!controlledSelectedDate) setInternalSelectedDate(date);
  };
  useEffect(() => {
    if (!days.length) return;
    if (days.some((day) => day.date === selectedDate)) return;
    updateSelectedDate(days.find((day) => day.isToday)?.date || days.find(hasAnyRingData)?.date || days[0].date);
  }, [days, selectedDate]);
  const selected = days.find((day) => day.date === selectedDate) || days.find((day) => day.hasDailyRecord) || days[0];
  return (
    <div className={compact ? "monthly-ring-view compact" : "monthly-ring-view"}>
      {summary && !compact && (
        <div className="ring-month-summary" aria-label="リング月間サマリー">
          <Metric label="記録日数" value={privateDisplayMode ? "記録あり" : `${summary.recordDays}日`} />
          <Metric label="平均安定度" value={privateDisplayMode ? "非表示です" : formatRingValue(summary.averageStability, "%")} />
          <Metric label="平均睡眠" value={privateDisplayMode ? "非表示です" : summary.averageSleep === null ? "記録なし" : `${summary.averageSleep.toFixed(1)}h`} />
          <Metric label="活動があった日" value={privateDisplayMode ? "記録あり" : `${summary.activityDays}日`} />
          <Metric label="突発ログ" value={privateDisplayMode ? "記録あり" : `${summary.suddenCount}件`} />
          <Metric label="思考メモ" value={privateDisplayMode ? "記録あり" : `${summary.thoughtCount}件`} />
          <Metric label="If-Then" value={privateDisplayMode ? "記録あり" : `${summary.ifThenCount}回`} />
          <Metric label="セルフケア" value={privateDisplayMode ? "記録あり" : `${summary.selfCareCount}回`} />
        </div>
      )}
      <div className="ring-month-grid" aria-label="月間リングビュー">
        {days.map((day) => {
          const isToday = day.isToday;
          const isSelected = day.date === selected?.date;
          const hasAny = hasAnyRingData(day);
          return (
            <button
              className={["ring-day-cell", isToday ? "today" : "", isSelected ? "selected" : "", hasAny ? "has-data" : "empty"].filter(Boolean).join(" ")}
              key={day.date}
              onClick={() => updateSelectedDate(day.date)}
              type="button"
              aria-label={`${formatJapaneseDate(day.date)} のリング`}
            >
              <span className="ring-date">{day.day}</span>
              <MultiMetricRing day={day} size={compact ? 40 : 48} privateDisplayMode={privateDisplayMode} />
              <RingBadges day={day} />
            </button>
          );
        })}
      </div>
      <RingLegend compact={compact} />
      {compact && (
        <p className="tiny-note">外側は安定度/気分、中央は活動、内側は睡眠です。詳しく見ると日別の内容を確認できます。</p>
      )}
      {selected && !compact && (
        <div className="ring-day-detail">
          <strong>{formatJapaneseDate(selected.date)} の記録</strong>
          <p className="tiny-note">記録上の参考情報です。未入力の項目は0として扱っていません。</p>
          {privateDisplayMode ? (
            <p>詳細は非表示です。記録の有無だけ表示しています。</p>
          ) : (
            <div className="ring-detail-list">
              <RingDetailRow label="安定度 / 気分" value={formatRingValue(selected.stabilityScore ?? selected.moodScore, "%")} colorClass="mood" />
              <RingDetailRow label="気分" value={selected.moodScore === null ? "記録なし" : `${Math.round(selected.moodScore / 10)}/10`} colorClass="mood" />
              <RingDetailRow label="睡眠" value={selected.sleepHours === null ? "記録なし" : `${selected.sleepHours}h`} colorClass="sleep" />
              <RingDetailRow label="活動" value={selected.activityScore === null ? "記録なし" : `${selected.activityScore}%`} colorClass="activity" />
              <RingDetailRow label="不安感" value={formatScore(selected.anxietyScore)} colorClass="thought" />
              <RingDetailRow label="突発ログ" value={`${selected.suddenLogCount}件`} colorClass="wave" />
              <RingDetailRow label="思考メモ" value={`${selected.thoughtNoteCount}件`} colorClass="thought" />
              <RingDetailRow label="If-Then" value={`${selected.ifThenLogCount}回`} colorClass="ifthen" />
              <RingDetailRow label="セルフケア" value={`${selected.selfCareLogCount}回`} colorClass="care" />
            </div>
          )}
          <div className="data-actions">
            {onOpenDate && actionLabel && (
              <button className="secondary-btn no-margin" onClick={() => onOpenDate(selected.date)} type="button">{actionLabel}</button>
            )}
            {onEditDate && (
              <button className="secondary-btn no-margin" onClick={() => onEditDate(selected.date)} type="button">{editLabel}</button>
            )}
          </div>
        </div>
      )}
      {selected && compact && onOpenDate && actionLabel && (
        <button className="secondary-btn no-margin" onClick={() => onOpenDate(selected.date)} type="button">{actionLabel}</button>
      )}
    </div>
  );
}

function RingDetailRow({ label, value, colorClass }: { label: string; value: string; colorClass: "mood" | "activity" | "sleep" | "wave" | "thought" | "ifthen" | "care" }) {
  return (
    <div className="ring-detail-row">
      <span><i className={`ring-detail-dot ${colorClass}`} />{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MultiMetricRing({ day, size, privateDisplayMode }: { day: DailyRingData; size: number; privateDisplayMode: boolean }) {
  const center = size / 2;
  const rings = [
    { key: "mood", value: day.stabilityScore ?? day.moodScore, radius: center - 4, color: "#159f8d" },
    { key: "activity", value: day.activityScore, radius: center - 10, color: "#329c7b" },
    { key: "sleep", value: day.sleepScore, radius: center - 16, color: "#447fbf" },
  ];
  return (
    <svg className="multi-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {rings.map((ring) => {
        const circumference = 2 * Math.PI * ring.radius;
        const value = privateDisplayMode && hasAnyRingData(day) ? 70 : ring.value;
        const normalized = isFiniteNumber(value) ? Math.max(0, Math.min(100, value)) : null;
        return (
          <g key={ring.key} transform={`rotate(-90 ${center} ${center})`}>
            <circle className="ring-track" cx={center} cy={center} r={ring.radius} />
            {normalized !== null && (
              <circle
                className="ring-value"
                cx={center}
                cy={center}
                r={ring.radius}
                stroke={ring.color}
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - normalized / 100)}`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function RingBadges({ day }: { day: DailyRingData }) {
  return (
    <span className="ring-badges" aria-hidden="true">
      {day.suddenLogCount > 0 && <i className="badge-wave" />}
      {day.thoughtNoteCount > 0 && <i className="badge-thought" />}
      {day.ifThenLogCount > 0 && <i className="badge-ifthen" />}
      {day.selfCareLogCount > 0 && <i className="badge-care" />}
    </span>
  );
}

function RingLegend({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "ring-legend compact" : "ring-legend"}>
      <span><i className="legend-mood" />外側: 安定度/気分</span>
      <span><i className="legend-activity" />中央: 活動</span>
      <span><i className="legend-sleep" />内側: 睡眠</span>
      {compact ? (
        <span><i className="legend-dot" />点: 記録あり</span>
      ) : (
        <>
          <span><i className="legend-wave" />紫: 突発ログ</span>
          <span><i className="legend-thought" />ラベンダー: 思考メモ</span>
          <span><i className="legend-ifthen" />ティール: If-Then</span>
          <span><i className="legend-care" />ミント: セルフケア</span>
        </>
      )}
    </div>
  );
}

function formatRingValue(value: number | null, suffix: string) {
  return isFiniteNumber(value) ? `${Math.round(value)}${suffix}` : "記録なし";
}

function hasAnyRingData(day: DailyRingData) {
  return day.hasDailyRecord || day.suddenLogCount > 0 || day.thoughtNoteCount > 0 || day.ifThenLogCount > 0 || day.selfCareLogCount > 0;
}

function getMetricBarStyle(metricType: ChartMetricType, value: number | null, max: number, isActive: boolean): React.CSSProperties {
  const color = getMetricBarColor(metricType, value);
  const height = isFiniteNumber(value) ? `${Math.max(metricType === "mood" ? 14 : 12, (value / max) * 100)}%` : "10%";
  return {
    height,
    background: color,
    boxShadow: isActive ? `0 0 0 2px rgba(255, 255, 255, 0.95), 0 0 0 4px ${getMetricShadowColor(metricType, value)}` : undefined,
    outline: isActive ? `1px solid ${color}` : undefined,
  };
}

function getMetricBarColor(metricType: ChartMetricType, value: number | null) {
  if (!isFiniteNumber(value)) return "#dce5e2";
  if (metricType === "sleep") {
    if (value >= 7) return "#447fbf";
    if (value >= 6) return "#78a9d8";
    if (value >= 5) return "#aed0ea";
    return "#d5e0ea";
  }
  if (metricType === "anxiety") {
    if (value >= 9) return "#7e67ac";
    if (value >= 7) return "#a18ccc";
    if (value >= 4) return "#c8bce1";
    return "#e8e1f4";
  }
  if (metricType === "activity") {
    if (value >= 4) return "#329c7b";
    if (value >= 2) return "#66c5a4";
    if (value >= 1) return "#a8decb";
    return "#dcf0e9";
  }
  const score = metricType === "mood" ? value * 10 : value;
  if (score >= 80) return "#159f8d";
  if (score >= 60) return "#57c6b6";
  if (score >= 40) return "#a4ded4";
  return "#d9f0ea";
}

function getMetricShadowColor(metricType: ChartMetricType, value: number | null) {
  const color = getMetricBarColor(metricType, value).replace("#", "");
  return `#${color}3d`;
}

function TrendLegend({ metricType }: { metricType: ChartMetricType }) {
  const items = getTrendLegendItems(metricType);
  return (
    <div className="trend-legend" aria-label="グラフの色の目安">
      {items.map((item) => (
        <span key={item.label}>
          <i style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function getTrendLegendItems(metricType: ChartMetricType) {
  if (metricType === "sleep") {
    return [
      { label: "長め", color: "#447fbf" },
      { label: "標準", color: "#78a9d8" },
      { label: "短め", color: "#aed0ea" },
      { label: "未入力", color: "#dce5e2" },
    ];
  }
  if (metricType === "anxiety") {
    return [
      { label: "低め", color: "#e8e1f4" },
      { label: "中間", color: "#c8bce1" },
      { label: "高め", color: "#7e67ac" },
      { label: "未入力", color: "#dce5e2" },
    ];
  }
  if (metricType === "activity") {
    return [
      { label: "多め", color: "#329c7b" },
      { label: "中間", color: "#66c5a4" },
      { label: "少なめ", color: "#a8decb" },
      { label: "未入力", color: "#dce5e2" },
    ];
  }
  return [
    { label: "高め", color: "#159f8d" },
    { label: "中間", color: "#57c6b6" },
    { label: "低め", color: "#a4ded4" },
    { label: "未入力", color: "#dce5e2" },
  ];
}

function impactLabel(score: number | null, hasRecord: boolean) {
  if (!hasRecord || score === null) return "記録なし";
  if (score >= 78) return "支えている";
  if (score >= 62) return "少し支えている";
  if (score >= 45) return "参考表示";
  return "影響は小さめ";
}

function RecordHub({ dailyRecords, suddenLogs, onDaily, onSudden, onRecords, onCalendar, onThought }: { dailyRecords: DailyRecord[]; suddenLogs: SuddenLog[]; onDaily: () => void; onSudden: () => void; onRecords: () => void; onCalendar: () => void; onThought: () => void }) {
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
          <button className="secondary-btn no-margin" onClick={onCalendar}>カレンダーを見る</button>
          <button className="secondary-btn no-margin" onClick={onThought}>思考メモを書く</button>
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
  thoughtNotes,
  ifThenPlans,
  ifThenLogs,
  onAnalysis,
  onReport,
  onConsultation,
  onCalendar,
  onThought,
  onIfThen,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCareLogs: SelfCareLog[];
  thoughtNotes: ThoughtNote[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  onAnalysis: () => void;
  onReport: () => void;
  onConsultation: () => void;
  onCalendar: () => void;
  onThought: () => void;
  onIfThen: () => void;
}) {
  const insight = calculateInsights(dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs)[0];

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
          <button className="secondary-btn no-margin" onClick={onCalendar}>カレンダーを見る</button>
          <button className="secondary-btn no-margin" onClick={onThought}>思考メモを見る</button>
          <button className="secondary-btn no-margin" onClick={onIfThen}>If-Thenプランを見る</button>
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
  onIntro,
  onHabit,
  onDisplay,
  onIfThen,
}: {
  onConsultation: () => void;
  onData: () => void;
  onPrivacy: () => void;
  onGuide: () => void;
  onAbout: () => void;
  onIntro: () => void;
  onHabit: () => void;
  onDisplay: () => void;
  onIfThen: () => void;
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
          <button className="secondary-btn no-margin" onClick={onHabit}>習慣サポート</button>
          <button className="secondary-btn no-margin" onClick={onIfThen}>If-Thenプラン</button>
          <button className="secondary-btn no-margin" onClick={onDisplay}>表示設定</button>
          <button className="secondary-btn no-margin" onClick={onData}>データ管理</button>
          <button className="secondary-btn no-margin" onClick={onPrivacy}>プライバシー設定</button>
          <button className="secondary-btn no-margin" onClick={onGuide}>使い方ガイド</button>
          <button className="secondary-btn no-margin" onClick={onIntro}>Self Compassについて</button>
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
          <li>状態の波やきっかけをふり返る</li>
          <li>思考メモで考え方のくせに気づく</li>
          <li>If-Thenプランで小さな行動を決める</li>
          <li>セルフケアを試し、実行ログを残す</li>
          <li>月間リングビューやふり返りコメントを見る</li>
          <li>相談前のメモやレポートを整理する</li>
          <li>JSONバックアップやCSV出力を使う</li>
        </ul>
      </section>

      <section className="section-block">
        <h2>このアプリでできないこと</h2>
        <ul className="soft-list">
          <li>診断すること</li>
          <li>治療方針を決めること</li>
          <li>薬やサプリの服用を指示すること</li>
          <li>医師や専門家の代わりになること</li>
          <li>緊急時の対応を代わりに行うこと</li>
        </ul>
      </section>

      <section className="section-block">
        <h2>データ保存について</h2>
        <p className="soft-text">記録は現在お使いのブラウザ内に保存されます。共有URLを開いた人同士で記録が共有されるわけではありません。</p>
        <p className="soft-text">端末を変更したり、ブラウザデータを削除した場合、記録が失われることがあります。大切な記録はJSONバックアップで保存してください。</p>
        <p className="soft-text">このアプリは外部サーバーへ記録を送信しない設計です。ただし、利用環境によってはブラウザや端末側の管理に依存します。</p>
      </section>

      <section className="section-block">
        <h2>デモモードについて</h2>
        <p className="soft-text">デモモードでは、架空の1ヶ月分サンプルデータを使って、グラフ・リングビュー・ふり返りコメントの見え方を確認できます。</p>
        <p className="soft-text">サンプルデータは手入力データと区別され、必要に応じてデータ管理画面からサンプルデータだけ削除できます。</p>
      </section>

      <section className="section-block">
        <h2>バックアップについて</h2>
        <p className="soft-text">JSONバックアップには、記録・表示設定・デモ設定などが含まれます。端末変更やブラウザデータ削除に備えたいときに利用してください。</p>
      </section>

      <section className="section-block">
        <h2>サポートが必要なとき</h2>
        <p className="soft-text">命に関わる可能性があると感じるときや、一人で抱えるのが難しいと感じるときは、すぐに119番、近くの救急外来、または信頼できる人に連絡してください。このアプリは医療機関や専門家の支援を代わりに行うものではありません。</p>
      </section>

      <section className="section-block">
        <h2>バージョン情報</h2>
        <div className="summary-list">
          <Metric label="バージョン" value={`Self Compass v${appVersion}`} />
          <Metric label="最終更新日" value={appUpdatedAt} />
        </div>
        <h3>簡易更新履歴</h3>
        <ul className="soft-list">
          <li>日々の記録</li>
          <li>突発ログ</li>
          <li>思考メモ</li>
          <li>If-Thenプラン</li>
          <li>セルフケア / マイプラン</li>
          <li>相談ノート</li>
          <li>安定度スコア</li>
          <li>安定度スコア内訳</li>
          <li>月間カレンダー</li>
          <li>月間リングビュー</li>
          <li>月間ふり返りコメント</li>
          <li>グラフの月 / 週 / 日切り替え</li>
          <li>グラフ選択日の詳細カード</li>
          <li>デモモード</li>
          <li>サンプルデータ</li>
          <li>JSONバックアップ / インポート</li>
          <li>CSV出力</li>
          <li>プライバシー設定</li>
          <li>簡易ロック</li>
          <li>セーフモード</li>
          <li>公開用トップ説明ページ</li>
          <li>PWA対応</li>
        </ul>
      </section>
    </section>
  );
}

function HabitSupportScreen({
  settings,
  dailyRecords,
  privateDisplayMode,
  flash,
  onSave,
  onDaily,
  onIfThen,
}: {
  settings: HabitSettings;
  dailyRecords: DailyRecord[];
  privateDisplayMode: boolean;
  flash: string;
  onSave: (settings: HabitSettings) => void;
  onDaily: () => void;
  onIfThen: () => void;
}) {
  const [form, setForm] = useState(settings);
  const [messageMode, setMessageMode] = useState(defaultReminderMessages.includes(settings.reminderMessage) ? "デフォルト文" : "カスタム文");
  const summary = getHabitSummary(dailyRecords);
  const weekGoal = weeklyGoalValue(form);
  const remaining = weekGoal ? Math.max(0, weekGoal - summary.weekCount) : 0;

  const update = (next: HabitSettings) => {
    setForm(next);
    onSave({ ...next, updatedAt: nowIso() });
  };

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">思い出す補助</p>
          <h1>習慣サポート</h1>
        </div>
      </header>
      <p className="soft-text">記録を続けるための小さな補助を設定できます。毎日できなくても大丈夫です。</p>
      {flash && <div className="success-message">{flash}</div>}

      <section className="section-block data-card">
        <h2>If-Thenプラン</h2>
        <p className="soft-text">習慣にしたいことは、「もし〜したら、〜する」の形にすると、始めるタイミングが分かりやすくなります。記録で合うかを見ながら、小さく続けやすい形にできます。</p>
        <button className="secondary-btn no-margin" onClick={onIfThen}>If-Thenプランを開く</button>
      </section>

      <section className="section-block data-card">
        <h2>リマインダー</h2>
        <p className="soft-text">通知ではなく、アプリを開いたときに表示するやさしい案内です。</p>
        <Choice label="リマインダー" options={["使う", "使わない"]} value={form.enabled ? "使う" : "使わない"} onChange={(value) => update({ ...form, enabled: value === "使う" })} />
        <Choice label="記録したい時間" options={reminderTimeTypes} value={form.reminderTimeType} onChange={(value) => update({ ...form, reminderTimeType: value as ReminderTimeType })} />
        {form.reminderTimeType === "自由入力" && (
          <label className="field">
            <span>時間 <small>任意</small></span>
            <input type="time" value={form.customReminderTime} onChange={(event) => update({ ...form, customReminderTime: event.target.value })} />
          </label>
        )}
        <Choice label="表示メッセージ" options={["デフォルト文", "カスタム文"]} value={messageMode} onChange={(value) => setMessageMode(value)} />
        {messageMode === "デフォルト文" ? (
          <Choice label="文面" options={defaultReminderMessages} value={defaultReminderMessages.includes(form.reminderMessage) ? form.reminderMessage : defaultReminderMessages[0]} onChange={(value) => update({ ...form, reminderMessage: value })} />
        ) : (
          <TextArea label="カスタム文" helper="短く、やさしい文にしておけます" value={form.reminderMessage} onChange={(value) => update({ ...form, reminderMessage: value })} />
        )}
      </section>

      <section className="section-block data-card">
        <h2>記録の目安</h2>
        <p className="soft-text">目標はいつでも変えられます。無理なく続けるための目安です。</p>
        <Choice label="週の目安" options={weeklyGoalTypes} value={form.weeklyGoalType} onChange={(value) => update({ ...form, weeklyGoalType: value as WeeklyGoalType })} />
        {form.weeklyGoalType === "カスタム" && (
          <label className="field">
            <span>週あたりの回数 <small>任意</small></span>
            <input
              type="number"
              min="1"
              max="7"
              inputMode="numeric"
              value={form.customWeeklyGoal}
              onChange={(event) => update({ ...form, customWeeklyGoal: clampWeeklyGoal(Number(event.target.value)) })}
            />
          </label>
        )}
        <div className="notice compact-notice">
          {weekGoal ? `今週は${summary.weekCount}回記録できています。${remaining > 0 ? `あと${remaining}回記録すると、今週の目安に近づきます。` : "今週の目安に近いペースです。"}` : "できる日に記録する、という形で使えます。"}
        </div>
      </section>

      <section className="section-block">
        <h2>継続状況</h2>
        <p className="soft-text">記録の間隔が空いても、また再開できます。</p>
        <div className="summary-list">
          <Metric label="今月" value={privateDisplayMode ? "記録状況あり" : `${summary.monthCount}日分`} />
          <Metric label="直近7日" value={privateDisplayMode ? "記録状況あり" : `${summary.recent7Count}日`} />
          <Metric label="最後の記録" value={privateDisplayMode ? "記録あり" : summary.lastDate || "なし"} />
          <Metric label="よく記録する時間" value={privateDisplayMode ? "記録状況あり" : summary.commonTime || "まだ少なめ"} />
        </div>
        <button className="secondary-btn" onClick={onDaily}>今日の記録へ</button>
      </section>
    </section>
  );
}

function DisplaySettingsScreen({ settings, flash, onSave }: { settings: DisplaySettings; flash: string; onSave: (settings: DisplaySettings) => void }) {
  const [form, setForm] = useState(settings);
  const update = (next: DisplaySettings) => {
    setForm(next);
    onSave(next);
  };

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">読みやすさ</p>
          <h1>表示設定</h1>
        </div>
      </header>
      <p className="soft-text">長く見ても疲れにくいように、配色と文字サイズを選べます。</p>
      {flash && <div className="success-message">{flash}</div>}

      <section className="section-block data-card">
        <h2>配色テーマ</h2>
        <p className="soft-text">標準は落ち着いた緑系、やわらかめは明るく穏やか、くっきりは文字と境界を見やすくします。</p>
        <Choice
          label="テーマ"
          options={displayThemes.map(displayThemeLabel)}
          value={displayThemeLabel(form.theme)}
          onChange={(value) => update({ ...form, theme: displayThemeFromLabel(value) })}
        />
      </section>

      <section className="section-block data-card">
        <h2>文字サイズ</h2>
        <p className="soft-text">ボタンやナビゲーションが崩れにくい範囲で、アプリ全体の文字を大きくできます。</p>
        <Choice
          label="文字サイズ"
          options={displayFontSizes.map(displayFontSizeLabel)}
          value={displayFontSizeLabel(form.fontSize)}
          onChange={(value) => update({ ...form, fontSize: displayFontSizeFromLabel(value) })}
        />
      </section>

      <section className="section-block">
        <h2>表示の確認</h2>
        <div className="summary-list">
          <Metric label="テーマ" value={displayThemeLabel(form.theme)} />
          <Metric label="文字" value={displayFontSizeLabel(form.fontSize)} />
        </div>
        <div className="notice compact-notice">設定はこの端末のブラウザに保存され、次回起動時も反映されます。</div>
      </section>
    </section>
  );
}

function CalendarScreen({
  dailyRecords,
  suddenLogs,
  selfCareLogs,
  thoughtNotes,
  ifThenPlans,
  ifThenLogs,
  consultationNotes,
  privateDisplayMode,
  onEditDaily,
  onAddDaily,
  onAddSudden,
  onIfThen,
  onSelfCare,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCareLogs: SelfCareLog[];
  thoughtNotes: ThoughtNote[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  consultationNotes: ConsultationNote[];
  privateDisplayMode: boolean;
  onEditDaily: (date: string) => void;
  onAddDaily: (date: string) => void;
  onAddSudden: (date: string) => void;
  onIfThen: (prefill?: IfThenPrefill) => void;
  onSelfCare: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(today().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today());
  const [calendarView, setCalendarView] = useState<CalendarView>("ring");
  const [showReflectionDetail, setShowReflectionDetail] = useState(false);
  const monthDays = buildCalendarDays(currentMonth);
  const summary = getMonthlySummary(currentMonth, dailyRecords, suddenLogs, selfCareLogs);
  const ringDays = useMemo(
    () => buildDailyRingData(currentMonth, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs),
    [currentMonth, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs],
  );
  const ringSummary = useMemo(() => getRingMonthlySummary(ringDays), [ringDays]);
  const monthlyReflection = useMemo(
    () => generateMonthlyReflection(currentMonth, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs, consultationNotes),
    [currentMonth, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs, consultationNotes],
  );
  const selectedDaily = dailyRecords.find((record) => record.date === selectedDate);
  const selectedSudden = suddenLogs.filter((log) => log.occurredAt.slice(0, 10) === selectedDate).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const selectedCare = selfCareLogs.filter((log) => log.createdAt.slice(0, 10) === selectedDate).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const selectedNotes = consultationNotes.filter((note) => note.updatedAt.slice(0, 10) === selectedDate);
  const [yearLabel, monthLabel] = currentMonth.split("-");
  const monthlyScore = summary.averageMood === "-" ? "記録なし" : `${Math.round(Number(summary.averageMood) * 10)}`;

  return (
    <section className="calendar-screen">
      <header className="calendar-hero-head">
        <div className="calendar-month-control">
          <button className="round-icon-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} aria-label="前月へ" type="button">‹</button>
          <div className="calendar-month-title">
            <strong>{Number(monthLabel)}月</strong>
            <span>{yearLabel}</span>
          </div>
          <button className="round-icon-btn next" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="翌月へ" type="button">›</button>
        </div>
        <div className="calendar-stat-grid" aria-label="月間サマリー">
          <Metric label="記録日数" value={privateDisplayMode ? "記録あり" : `${summary.dailyDays}日`} />
          <Metric label="平均スコア" value={privateDisplayMode ? "記録あり" : monthlyScore} />
          <Metric label="記録回数" value={privateDisplayMode ? "記録あり" : `${summary.suddenCount + summary.careCount}回`} />
          <Metric label="休息" value={privateDisplayMode ? "記録あり" : formatAverageWithSuffix(summary.averageSleep, "h")} />
        </div>
      </header>
      <p className="soft-text">この月の記録上の傾向です。参考情報として見てください。原因を断定するものではありません。</p>

      <section className="section-block calendar-panel">
        <div className="section-title-row calendar-view-row">
          <h2>月間表示</h2>
          <ViewSegment value={calendarView} onChange={setCalendarView} labels={{ calendar: "カレンダー", ring: "リング", bar: "バー" }} />
        </div>
        {calendarView === "calendar" ? (
          <>
            <div className="calendar-weekdays">
              {["日", "月", "火", "水", "木", "金", "土"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-grid">
              {monthDays.map((date) => {
                const dayData = getDayCalendarData(date, dailyRecords, suddenLogs, selfCareLogs);
                const dayScore = isFiniteNumber(dayData.daily?.mood) ? Math.round(dayData.daily.mood * 10) : null;
                const isCurrentMonth = date.startsWith(currentMonth);
                const isToday = date === today();
                const isSelected = date === selectedDate;
                const hasAny = Boolean(dayData.daily || dayData.suddenCount || dayData.careCount);
                return (
                  <button
                    className={[
                      "calendar-day",
                      isCurrentMonth ? "" : "muted",
                      isToday ? "today" : "",
                      isSelected ? "selected" : "",
                      hasAny ? "has-records" : "",
                    ].filter(Boolean).join(" ")}
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    type="button"
                  >
                    <span className="calendar-date-number">{Number(date.slice(8, 10))}</span>
                    {!privateDisplayMode && dayScore !== null && (
                      <span className={`calendar-score ${scoreBand(dayScore)}`}>
                        <span>{scoreFace(dayScore)}</span>
                        <strong>{dayScore}</strong>
                      </span>
                    )}
                    {privateDisplayMode && hasAny && (
                      <span className="calendar-score private">
                        <span>☘</span>
                        <strong>記録</strong>
                      </span>
                    )}
                    <span className="calendar-markers">
                      {dayData.daily && <i>記録</i>}
                      {dayData.suddenCount > 0 && <i>ログ</i>}
                      {dayData.careCount > 0 && <i>ケア</i>}
                    </span>
                    {!privateDisplayMode && dayData.daily && dayScore === null && (
                      <span className="calendar-small">
                        {hasSleepHours(dayData.daily) ? `睡眠 ${dayData.daily.sleepHours}h` : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : calendarView === "bar" ? (
          <CalendarMonthBarView currentMonth={currentMonth} dailyRecords={dailyRecords} privateDisplayMode={privateDisplayMode} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        ) : (
          <MonthlyRingView
            days={ringDays}
            privateDisplayMode={privateDisplayMode}
            summary={ringSummary}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenDate={(date) => {
              setSelectedDate(date);
              setCalendarView("calendar");
            }}
            onEditDate={(date) => {
              const daily = dailyRecords.find((record) => record.date === date);
              daily ? onEditDaily(date) : onAddDaily(date);
            }}
            actionLabel="この日の記録を見る"
            editLabel="この日の記録を編集・追加"
          />
        )}
      </section>

      <section className="monthly-reflection-card">
        <span className="monthly-icon">☘</span>
        <div>
          <h2>今月のふりかえり</h2>
          <p>{privateDisplayMode ? "記録上の傾向があります。詳細は非表示です。" : monthlyReflection.summary}</p>
          <div className="reflection-actions">
            <button className="text-link-button" type="button" onClick={() => setShowReflectionDetail((value) => !value)}>
              {showReflectionDetail ? "閉じる" : "詳しく見る"}
            </button>
            {monthlyReflection.topTrigger !== "記録なし" && (
              <button
                className="text-link-button"
                type="button"
                onClick={() => onIfThen({ title: `${monthlyReflection.topTrigger}に合わせる小さな行動`, ifText: `${monthlyReflection.topTrigger}がきっかけになりそうなとき`, category: "記録する", memo: "月間ふりかえりから作成" })}
              >
                If-Thenプランを作る
              </button>
            )}
            {(monthlyReflection.topSelfCare !== "記録なし" || monthlyReflection.topIfThen !== "記録なし") && (
              <button className="text-link-button" type="button" onClick={onSelfCare}>整いやすかった行動を見る</button>
            )}
          </div>
        </div>
      </section>
      {showReflectionDetail && !privateDisplayMode && (
        <section className="section-block reflection-detail-card">
          <h2>記録から見える今月の傾向</h2>
          <p className="tiny-note">記録上の傾向をもとにした参考コメントです。診断や治療判断ではありません。</p>
          <div className="reflection-section-list">
            {monthlyReflectionEntries(monthlyReflection).map(([label, text]) => (
              <article key={label} className="reflection-section-item">
                <h3>{label}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section-block calendar-summary-card">
        <h2>月間サマリー</h2>
        <div className="summary-list">
          <Metric label="記録日数" value={privateDisplayMode ? "記録状況あり" : `${summary.dailyDays}日`} />
          <Metric label="突発ログ" value={privateDisplayMode ? "記録状況あり" : `${summary.suddenCount}件`} />
          <Metric label="セルフケア" value={privateDisplayMode ? "記録状況あり" : `${summary.careCount}回`} />
          <Metric label="平均気分" value={privateDisplayMode ? "記録状況あり" : formatAverageWithSuffix(summary.averageMood, "/10")} />
          <Metric label="平均不安" value={privateDisplayMode ? "記録状況あり" : formatAverageWithSuffix(summary.averageAnxiety, "/10")} />
          <Metric label="平均睡眠" value={privateDisplayMode ? "記録状況あり" : formatAverageWithSuffix(summary.averageSleep, "h")} />
          <Metric label="波が大きい日" value={privateDisplayMode ? "記録状況あり" : `${summary.waveDays}日`} />
          <Metric label="状態タグ" value={privateDisplayMode ? "記録あり" : summary.topTag} />
          <Metric label="よく使ったケア" value={privateDisplayMode ? "記録あり" : summary.topCare} />
        </div>
      </section>

      <section className="score-guide-strip" aria-label="スコアの目安">
        <span>スコアの目安</span>
        <i className="score-high">☺ 80〜</i>
        <i className="score-mid">◡ 70〜79</i>
        <i className="score-low">◌ 60〜69</i>
        <i className="score-muted">○ 〜59</i>
      </section>

      <section className="section-block day-detail-card">
        <h2>{selectedDate} の記録</h2>
        {selectedDaily ? (
          <div className="detail-row">
            <span>日々の記録</span>
            <strong>{privateDisplayMode ? "詳細は非表示です" : `気分 ${formatScore(selectedDaily.mood)} / 不安 ${formatScore(selectedDaily.anxiety)} / 睡眠 ${formatSleepHours(selectedDaily.sleepHours)}`}</strong>
          </div>
        ) : (
          <p className="empty-box">日々の記録はまだありません。</p>
        )}

        <h3>突発ログ</h3>
        {selectedSudden.length === 0 ? <p className="empty-box">この日の突発ログはありません。</p> : (
          <div className="detail-list">
            {selectedSudden.map((log) => (
              <div className="detail-row" key={log.id}>
                <span>{formatDateTime(log.occurredAt)}</span>
                <strong>{privateDisplayMode ? "ログあり" : `${joinTags(log.stateTags)} / 強さ ${formatScore(log.intensity)}`}</strong>
              </div>
            ))}
          </div>
        )}

        <h3>セルフケア</h3>
        {selectedCare.length === 0 ? <p className="empty-box">この日のセルフケア記録はありません。</p> : (
          <div className="detail-list">
            {selectedCare.map((log) => (
              <div className="detail-row" key={log.id}>
                <span>{formatDateTime(log.createdAt)}</span>
                <strong>{privateDisplayMode ? "ケアあり" : `${log.title} / ${log.result}`}</strong>
              </div>
            ))}
          </div>
        )}

        {selectedNotes.length > 0 && (
          <>
            <h3>相談ノート更新</h3>
            <p className="soft-text">{privateDisplayMode ? "相談ノートの更新があります。" : `${selectedNotes.length}件の更新があります。`}</p>
          </>
        )}

        <div className="data-actions">
          <button className="secondary-btn no-margin" onClick={() => selectedDaily ? onEditDaily(selectedDate) : onAddDaily(selectedDate)}>
            {selectedDaily ? "この日の記録を編集" : "この日の記録を追加"}
          </button>
          <button className="secondary-btn no-margin" onClick={() => onAddSudden(selectedDate)}>この日に突発ログを追加</button>
        </div>
      </section>
    </section>
  );
}

function DataManagement({
  dailyRecords,
  suddenLogs,
  selfCarePlans,
  selfCareLogs,
  ifThenPlans,
  ifThenLogs,
  consultationNotes,
  thoughtNotes,
  visibleDailyRecords,
  visibleSuddenLogs,
  visibleSelfCarePlans,
  visibleSelfCareLogs,
  visibleIfThenPlans,
  visibleIfThenLogs,
  visibleConsultationNotes,
  visibleThoughtNotes,
  privacySettings,
  habitSettings,
  reminderDismissals,
  displaySettings,
  demoDisplaySettings,
  flash,
  onImportRequest,
  onDeleteAllRequest,
  onAddSampleData,
  onDeleteSampleData,
  onUpdateDemoDisplaySettings,
  hasSampleData,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCarePlans: SelfCarePlan[];
  selfCareLogs: SelfCareLog[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  consultationNotes: ConsultationNote[];
  thoughtNotes: ThoughtNote[];
  visibleDailyRecords: DailyRecord[];
  visibleSuddenLogs: SuddenLog[];
  visibleSelfCarePlans: SelfCarePlan[];
  visibleSelfCareLogs: SelfCareLog[];
  visibleIfThenPlans: IfThenPlan[];
  visibleIfThenLogs: IfThenLog[];
  visibleConsultationNotes: ConsultationNote[];
  visibleThoughtNotes: ThoughtNote[];
  privacySettings: PrivacySettings;
  habitSettings: HabitSettings;
  reminderDismissals: ReminderDismissal[];
  displaySettings: DisplaySettings;
  demoDisplaySettings: DemoDisplaySettings;
  flash: string;
  onImportRequest: (backup: BackupData) => void;
  onDeleteAllRequest: () => void;
  onAddSampleData: () => void;
  onDeleteSampleData: () => void;
  onUpdateDemoDisplaySettings: (settings: DemoDisplaySettings) => void;
  hasSampleData: boolean;
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
    ifThenPlans,
    ifThenLogs,
    consultationNotes,
    thoughtNotes,
    privacySettings: toBackupPrivacySettings(privacySettings),
    habitSettings,
    reminderDismissals,
    displaySettings,
    demoDisplaySettings,
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
    if (!visibleDailyRecords.length) {
      setError("出力できる日々の記録がありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`daily-records-${today()}.csv`, toDailyCsv(visibleDailyRecords), "text/csv;charset=utf-8");
    setError("");
    setMessage("日々の記録CSVを作成しました。");
  };

  const exportSuddenCsv = () => {
    if (!visibleSuddenLogs.length) {
      setError("出力できる突発ログがありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`sudden-logs-${today()}.csv`, toSuddenCsv(visibleSuddenLogs), "text/csv;charset=utf-8");
    setError("");
    setMessage("突発ログCSVを作成しました。");
  };

  const exportSelfCareCsv = () => {
    if (!visibleSelfCareLogs.length) {
      setError("出力できるセルフケア記録がありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`self-care-logs-${today()}.csv`, toSelfCareCsv(visibleSelfCareLogs), "text/csv;charset=utf-8");
    setError("");
    setMessage("セルフケア記録CSVを作成しました。");
  };

  const exportConsultationCsv = () => {
    if (!visibleConsultationNotes.length) {
      setError("出力できる相談メモがありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`consultation-notes-${today()}.csv`, toConsultationCsv(visibleConsultationNotes), "text/csv;charset=utf-8");
    setError("");
    setMessage("相談メモCSVを作成しました。");
  };

  const exportThoughtCsv = () => {
    if (!visibleThoughtNotes.length) {
      setError("出力できる思考メモがありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`thought-notes-${today()}.csv`, toThoughtCsv(visibleThoughtNotes), "text/csv;charset=utf-8");
    setError("");
    setMessage("思考メモCSVを作成しました。");
  };

  const exportIfThenPlansCsv = () => {
    if (!visibleIfThenPlans.length) {
      setError("出力できるIf-Thenプランがありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`if-then-plans-${today()}.csv`, toIfThenPlansCsv(visibleIfThenPlans), "text/csv;charset=utf-8");
    setError("");
    setMessage("If-ThenプランCSVを作成しました。");
  };

  const exportIfThenLogsCsv = () => {
    if (!visibleIfThenLogs.length) {
      setError("出力できるIf-Then実行ログがありません。");
      setMessage("");
      return;
    }
    downloadTextFile(`if-then-logs-${today()}.csv`, toIfThenLogsCsv(visibleIfThenLogs), "text/csv;charset=utf-8");
    setError("");
    setMessage("If-Then実行ログCSVを作成しました。");
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

      <section className="section-block data-card sample-data-card">
        <div>
          <p className="eyebrow">開発・確認用</p>
          <h2>サンプルデータ / デモモード</h2>
        </div>
        <p className="soft-text">サンプルデータを使って、カレンダー・グラフ・ふり返り機能の見え方を確認できます。実際の記録ではありません。</p>
        <div className="demo-settings-grid">
          <div className="demo-setting-row">
            <span>
              <strong>デモモード</strong>
              <small>サンプル表示の状態を分かりやすくします。</small>
            </span>
            <button
              className={`toggle-pill ${demoDisplaySettings.isDemoModeEnabled ? "on" : ""}`}
              type="button"
              onClick={() => onUpdateDemoDisplaySettings({ ...demoDisplaySettings, isDemoModeEnabled: !demoDisplaySettings.isDemoModeEnabled })}
            >
              {demoDisplaySettings.isDemoModeEnabled ? "ON" : "OFF"}
            </button>
          </div>
          <Choice
            label="表示モード"
            options={["すべて表示", "実データのみ", "サンプルのみ"]}
            value={demoModeLabel(demoDisplaySettings.mode)}
            onChange={(value) => onUpdateDemoDisplaySettings({ ...demoDisplaySettings, mode: demoModeFromLabel(value) })}
          />
          <div className="demo-counts" aria-label="表示中の件数">
            <Metric label="表示中の日々の記録" value={`${visibleDailyRecords.length}件`} />
            <Metric label="表示中の突発ログ" value={`${visibleSuddenLogs.length}件`} />
            <Metric label="サンプル件数" value={`${countSampleItems([dailyRecords, suddenLogs, selfCarePlans, selfCareLogs, ifThenPlans, ifThenLogs, consultationNotes, thoughtNotes])}件`} />
          </div>
        </div>
        <p className="soft-text">現在の記録に追加されます。必要な場合は先にバックアップしてください。JSONバックアップには表示モードに関係なく保存済みデータを含めます。</p>
        {hasSampleData && <p className="sample-note">サンプルデータがあります。追加し直す場合は、既存のサンプルだけ入れ替えます。</p>}
        <div className="data-actions">
          <button className="secondary-btn no-margin" onClick={onAddSampleData}>1ヶ月分のサンプルデータを追加</button>
          <button className="secondary-btn no-margin" onClick={onDeleteSampleData} disabled={!hasSampleData}>サンプルデータを削除</button>
        </div>
      </section>

      <section className="section-block data-card">
        <h2>JSONバックアップ</h2>
        <p className="soft-text">日々の記録、突発ログ、マイプラン、セルフケア記録、If-Thenプラン、相談メモ、思考メモ、プライバシー設定、習慣サポート設定、表示設定をまとめて、端末内でファイル化します。パスコードそのものは含めません。思考メモやIf-Thenプランには個人的な内容が含まれることがあります。</p>
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
          <button className="secondary-btn no-margin" onClick={exportThoughtCsv}>思考メモCSV</button>
          <button className="secondary-btn no-margin" onClick={exportIfThenPlansCsv}>If-ThenプランCSV</button>
          <button className="secondary-btn no-margin" onClick={exportIfThenLogsCsv}>If-Then実行ログCSV</button>
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

      <section className="section-block data-card">
        <h2>保存場所とバージョン</h2>
        <p className="soft-text">記録は現在お使いのブラウザ内に保存されます。共有URLを開いた人同士で記録が共有されるわけではありません。</p>
        <p className="soft-text">端末を変更したり、ブラウザデータを削除した場合、記録が失われることがあります。大切な記録はJSONバックアップで保存してください。</p>
        <div className="summary-list">
          <Metric label="バージョン" value={`v${appVersion}`} />
          <Metric label="最終更新日" value={appUpdatedAt} />
        </div>
      </section>

      <section className="section-block data-card danger-zone">
        <h2>全データ削除</h2>
        <p className="soft-text">保存されている記録、マイプラン、セルフケア記録、If-Thenプラン、相談メモ、思考メモをすべて削除します。先にバックアップを取ることをおすすめします。</p>
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
  onIfThen,
  onCreateIfThen,
  onDirtyChange,
}: {
  plans: SelfCarePlan[];
  logs: SelfCareLog[];
  flash: string;
  onSavePlan: (plan: SelfCarePlan) => void;
  onDeletePlan: (id: string) => void;
  onCareDone: (plan: SelfCarePlan) => void;
  onIfThen: () => void;
  onCreateIfThen: (plan: SelfCarePlan) => void;
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

      <section className="section-block data-card">
        <h2>If-Thenプラン</h2>
        <p className="soft-text">セルフケアを「もし〜が起きたら、〜する」の形にすると、きっかけと小さな行動を結びつけやすくなります。実行ログで合うかを見ながら調整できます。</p>
        <button className="secondary-btn no-margin" onClick={onIfThen}>If-Thenプランを見る</button>
      </section>

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
                <div className="badge-stack"><SampleBadge item={plan} /><span className="badge">マイプラン</span></div>
              </div>
              {plan.memo && <p className="record-snippet">{plan.memo}</p>}
              <div className="card-actions">
                <button className="secondary-action" onClick={() => onCareDone(plan)}>できた</button>
                <button className="secondary-action" onClick={() => onCreateIfThen(plan)}>If-Thenにする</button>
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

function IfThenScreen({
  plans,
  logs,
  prefill,
  flash,
  privateDisplayMode,
  onSavePlan,
  onDeletePlan,
  onTogglePlan,
  onRunPlan,
  onCreateSelfCare,
  onDirtyChange,
}: {
  plans: IfThenPlan[];
  logs: IfThenLog[];
  prefill: IfThenPrefill | null;
  flash: string;
  privateDisplayMode: boolean;
  onSavePlan: (plan: IfThenPlan) => void;
  onDeletePlan: (id: string) => void;
  onTogglePlan: (id: string) => void;
  onRunPlan: (plan: IfThenPlan) => void;
  onCreateSelfCare: (plan: IfThenPlan) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<IfThenPlan>(() => createIfThenDraft(prefill || undefined));
  const [editing, setEditing] = useState<IfThenPlan | null>(null);
  const [detail, setDetail] = useState<IfThenPlan | null>(null);
  const [message, setMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [showRestore, setShowRestore] = useState(() => Boolean(readDraft<IfThenPlan>(ifThenDraftKey)));
  const [isSaving, setIsSaving] = useState(false);
  const sortedPlans = [...plans].sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.updatedAt.localeCompare(a.updatedAt));

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!prefill || editing || isDirty) return;
    setForm(createIfThenDraft(prefill));
  }, [prefill, editing, isDirty]);

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
    if (!hasIfThenDraftContent(form)) {
      removeDraft(ifThenDraftKey);
      setDraftStatus("");
      return;
    }
    setDraftStatus("下書きを保存中です");
    const timer = window.setTimeout(() => {
      writeDraft(ifThenDraftKey, "ifthen", form);
      setDraftStatus("下書きを保存しました");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, editing, showRestore, isDirty]);

  const updateForm = (next: IfThenPlan) => {
    setForm(next);
    setIsDirty(true);
    setMessage("");
  };

  const startEdit = (plan: IfThenPlan) => {
    setEditing(plan);
    setForm(plan);
    setShowRestore(false);
    setIsDirty(false);
    setMessage("");
    setDraftStatus("");
  };

  const resetForm = () => {
    setForm(createIfThenDraft());
    setEditing(null);
    setIsDirty(false);
    setIsSaving(false);
    setDraftStatus("");
  };

  const save = () => {
    if (isSaving) return;
    if (!form.title.trim() || !form.ifText.trim() || !form.thenText.trim()) {
      setMessage("保存するには、タイトル・もし・そのときだけ見直してください。短い文で大丈夫です。");
      return;
    }
    setIsSaving(true);
    setIsDirty(false);
    removeDraft(ifThenDraftKey);
    onSavePlan({ ...form, title: form.title.trim(), ifText: form.ifText.trim(), thenText: form.thenText.trim(), updatedAt: nowIso(), createdAt: form.createdAt || nowIso() });
    resetForm();
  };

  const restoreDraft = () => {
    const draft = readDraft<IfThenPlan>(ifThenDraftKey);
    if (draft) {
      setForm(normalizeIfThenPlan(draft.data));
      setIsDirty(true);
      setDraftStatus("下書きを再開しました");
    }
    setShowRestore(false);
  };

  const discardDraft = () => {
    removeDraft(ifThenDraftKey);
    setShowRestore(false);
    setDraftStatus("");
  };

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">もし〜が起きたら、〜する</p>
          <h1>If-Thenプラン</h1>
        </div>
      </header>
      <p className="soft-text">状態の波やきっかけに合わせて、先に小さな行動を決めておけます。</p>
      {flash && <div className="success-message">{flash}</div>}
      {message && <div className="error-message">{message}</div>}

      <section className="section-block data-card">
        <h2>If-Thenプランとは</h2>
        <p className="soft-text">If-Thenプランは、「もし〇〇が起きたら、△△する」という形で、きっかけと小さな行動を先に決めておく習慣化の方法です。</p>
        <p className="soft-text">記録からきっかけを見つける → 小さな行動を決める → 実行して記録する → 合いそうなら続ける、という流れで使えます。</p>
        <p className="soft-text">合わないプランは、無理に続けなくて大丈夫です。小さくしたり、別の行動に変えたりできます。</p>
        <button className="secondary-btn" onClick={() => document.getElementById("ifthen-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}>新しく作る</button>
      </section>

      <section className="section-block data-card">
        <h2>使い方ステップ</h2>
        <div className="step-list">
          <div><strong>1. きっかけを見つける</strong><span>記録やふり返りから、状態の波が出やすい場面を見つけます。例：曇りの日に不安感が高い / LINEの後に考えすぎる / 寝る前に頭の中が忙しくなる</span></div>
          <div><strong>2. 小さな行動を決める</strong><span>そのきっかけが起きたときにできそうな行動を、先に決めておきます。例：もしLINEの後に考えすぎたら、事実と想像を1つずつ分けて書く</span></div>
          <div><strong>3. 実行して記録する</strong><span>実行できたら、整いやすさと実行しやすさを10段階で残します。例：整いやすさ 7/10、実行しやすさ 8/10</span></div>
          <div><strong>4. 合うかふり返る</strong><span>何度か試して、整いやすさと実行しやすさの両方が高ければ、続ける候補にできます。</span></div>
          <div><strong>5. 習慣として残す</strong><span>合いそうなものは、今日の小さな一手やマイプランとして続けられます。</span></div>
        </div>
        <div className="notice compact-notice">この機能は診断や治療ではなく、自分に合う整え方を見つけるためのセルフケア補助です。</div>
      </section>

      <section className="section-block data-card example-card">
        <h2>作り方の例</h2>
        <div className="ifthen-example-list">
          {ifThenExamples.map((example) => (
            <div className="ifthen-flow" key={example.ifText}>
              <p><span>もし</span>{example.ifText}</p>
              <p><span>そのとき</span>{example.thenText}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block data-card" id="ifthen-form">
        <h2>{editing ? "If-Thenプランを編集" : "新しいIf-Thenプランを作る"}</h2>
        {!editing && showRestore && <DraftRestoreNotice onRestore={restoreDraft} onDiscard={discardDraft} />}
        {draftStatus && <p className="draft-status">{draftStatus}</p>}
        <TextArea label="もし" helper="きっかけ・場面・状態を書きます" value={form.ifText} onChange={(ifText) => updateForm({ ...form, ifText })} placeholder="例：寝る前に考えが止まらなくなったら" />
        <TextArea label="そのとき" helper="その場でできる小さな行動を書きます" value={form.thenText} onChange={(thenText) => updateForm({ ...form, thenText })} placeholder="例：考えていることを3つだけメモして、今日は結論を出さない" />
        <label className="field">
          <span>タイトル <small>必要</small></span>
          <small>あとから見返しやすい名前をつけます</small>
          <input value={form.title} onChange={(event) => updateForm({ ...form, title: event.target.value })} placeholder="例：寝る前の考えすぎ対策" />
        </label>
        <Choice label="カテゴリ" options={ifThenCategories} value={form.category} onChange={(category) => updateForm({ ...form, category: category as IfThenCategory })} />
        <p className="soft-text">カテゴリは、あとから探しやすくするための目印です。</p>
        <MultiChoice label="関連する状態タグ" options={stateTagOptions} values={form.relatedStateTags} onChange={(relatedStateTags) => updateForm({ ...form, relatedStateTags })} />
        <p className="soft-text">どんな状態のときに使うかを選べます。</p>
        <MultiChoice label="関連する思考タグ" options={thoughtTagOptions} values={form.relatedThoughtTags} onChange={(relatedThoughtTags) => updateForm({ ...form, relatedThoughtTags })} />
        <p className="soft-text">どんな考え方のくせが出たときに使うかを選べます。</p>
        <Choice label="実行しやすさの見込み" options={ifThenEaseOptions} value={form.ease} onChange={(ease) => updateForm({ ...form, ease: ease as IfThenEase })} />
        <Choice label="状態" options={["有効", "一時停止"]} value={form.isActive ? "有効" : "一時停止"} onChange={(value) => updateForm({ ...form, isActive: value === "有効" })} />
        <TextArea label="メモ" helper="任意。自分向けの補足を書けます" value={form.memo} onChange={(memo) => updateForm({ ...form, memo })} placeholder="例：まずは1分でできる形にする" />
        <div className="data-actions">
          <button className="primary-btn" disabled={isSaving} onClick={save}>{isSaving ? "保存しています" : editing ? "更新する" : "追加する"}</button>
          {editing && <button className="secondary-btn no-margin" onClick={resetForm}>編集をやめる</button>}
        </div>
      </section>

      <section className="section-block">
        <h2>作成済みプラン一覧</h2>
        {sortedPlans.length === 0 ? (
          <div className="empty-box">
            <strong>まだIf-Thenプランはありません。</strong>
            <p>まずは、最近の記録から1つだけ「きっかけ」を選んでみましょう。</p>
            <p>例：もし寝る前に考えが止まらなかったら、今日は結論を出さないとメモする。</p>
            <button className="secondary-btn no-margin" onClick={() => document.getElementById("ifthen-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}>If-Thenプランを作る</button>
          </div>
        ) : (
          <div className="record-list">
            {sortedPlans.map((plan) => {
              const planLogs = logs.filter((log) => log.planId === plan.id);
              const lastLog = planLogs[0];
              const habitCandidate = isIfThenHabitCandidate(planLogs);
              return (
                <article className="record-card ifthen-card" key={plan.id}>
                  <div className="record-card-head">
                    <div>
                      <p className="label">{plan.category} ・ {plan.ease}</p>
                      <h2>{privateDisplayMode ? "プランあり" : plan.title}</h2>
                    </div>
                    <div className="badge-stack"><SampleBadge item={plan} /><span className="badge">{plan.isActive ? "有効" : "一時停止"}</span></div>
                  </div>
                  <div className="ifthen-flow">
                    <p><span>もし</span>{privateDisplayMode ? "内容は非表示です" : plan.ifText}</p>
                    <p><span>そのとき</span>{privateDisplayMode ? "内容は非表示です" : plan.thenText}</p>
                  </div>
                  <TagList tags={[...plan.relatedStateTags, ...plan.relatedThoughtTags]} empty="関連タグなし" />
                  <div className="compact-metrics">
                    <Metric label="実行回数" value={`${planLogs.length}回`} />
                    <Metric label="最終実行" value={lastLog ? formatDateTime(lastLog.createdAt) : "なし"} />
                    <Metric label="平均整いやすさ" value={formatAverageWithSuffix(formatAverage(planLogs.map((log) => log.fitScore)), "/10")} />
                    <Metric label="平均実行しやすさ" value={formatAverageWithSuffix(formatAverage(planLogs.map((log) => log.easeScore)), "/10")} />
                  </div>
                  {plan.memo && <p className="record-snippet">{privateDisplayMode ? "メモは非表示です" : plan.memo}</p>}
                  {habitCandidate && (
                    <div className="notice compact-notice">
                      このプランは記録上、使いやすい可能性があります。マイプランとして続ける候補にできます。
                    </div>
                  )}
                  <div className="card-actions">
                    <button className="secondary-action" onClick={() => setDetail(plan)}>詳細</button>
                    <button className="secondary-action" onClick={() => startEdit(plan)}>編集</button>
                    <button className="secondary-action" onClick={() => onRunPlan(plan)} disabled={!plan.isActive}>実行した</button>
                    {habitCandidate && <button className="secondary-action" onClick={() => onCreateSelfCare(plan)}>習慣化候補にする</button>}
                    <button className="secondary-action" onClick={() => onTogglePlan(plan.id)}>{plan.isActive ? "一時停止" : "再開"}</button>
                    <button className="delete-action" onClick={() => onDeletePlan(plan.id)}>削除</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="section-block">
        <h2>実行記録・習慣化候補</h2>
        <p className="soft-text">整いやすさと実行しやすさを見ながら、続けやすい形を探せます。記録上の参考情報です。</p>
        {logs.length === 0 ? (
          <p className="soft-text">まだ実行ログはありません。</p>
        ) : (
          <div className="detail-list">
            {logs.slice(0, 6).map((log) => (
              <div className="detail-row" key={log.id}>
                <span>{formatDateTime(log.createdAt)}</span>
                <strong>{privateDisplayMode ? "実行ログあり" : `${log.planTitle} / ${formatIfThenLogScores(log)}`}</strong>
                {!privateDisplayMode && log.legacyResult && <p className="record-snippet">以前の記録: {log.legacyResult}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {detail && <IfThenDetailModal plan={detail} logs={logs.filter((log) => log.planId === detail.id)} privateDisplayMode={privateDisplayMode} onClose={() => setDetail(null)} />}
    </section>
  );
}

function IfThenDetailModal({ plan, logs, privateDisplayMode, onClose }: { plan: IfThenPlan; logs: IfThenLog[]; privateDisplayMode: boolean; onClose: () => void }) {
  const hidden = privateDisplayMode ? "内容は非表示です" : "";
  const latestLog = logs[0];
  const rows = [
    ["タイトル", hidden || plan.title],
    ["もし", hidden || plan.ifText],
    ["そのとき", hidden || plan.thenText],
    ["カテゴリ", plan.category],
    ["関連状態タグ", joinTags(plan.relatedStateTags)],
    ["関連思考タグ", joinTags(plan.relatedThoughtTags)],
    ["実行しやすさ", plan.ease],
    ["状態", plan.isActive ? "有効" : "一時停止"],
    ["実行回数", `${logs.length}回`],
    ["平均整いやすさ", formatAverageWithSuffix(formatAverage(logs.map((log) => log.fitScore)), "/10")],
    ["平均実行しやすさ", formatAverageWithSuffix(formatAverage(logs.map((log) => log.easeScore)), "/10")],
    ["最終実行", latestLog ? formatDateTime(latestLog.createdAt) : "なし"],
    ["最近の記録", latestLog ? formatIfThenLogScores(latestLog) : "記録なし"],
    ["以前の記録", latestLog?.legacyResult || "記録なし"],
    ["メモ", hidden || plan.memo || "未入力"],
  ];
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="detail-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">If-Thenプラン</p>
            <h2>詳細</h2>
          </div>
          <button className="ghost-btn" onClick={onClose}>← 戻る</button>
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

function IfThenLogModal({ plan, onCancel, onSave }: { plan: IfThenPlan; onCancel: () => void; onSave: (log: IfThenLog) => void }) {
  const [fitScore, setFitScore] = useState<number | null>(null);
  const [easeScore, setEaseScore] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <h2>実行した記録</h2>
        <p>{plan.ifText} → {plan.thenText}</p>
        <ScoreField label="整いやすさ" value={fitScore} onChange={setFitScore} />
        <p className="score-guide">1: 今は合いにくかった / 5: 変化は少なめ / 10: かなり整った</p>
        <ScoreField label="実行しやすさ" value={easeScore} onChange={setEaseScore} />
        <p className="score-guide">1: かなり難しかった / 5: 少し準備が必要 / 10: すぐできた</p>
        <TextArea label="メモ" helper="短く残せます" value={memo} onChange={setMemo} />
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel}>キャンセル</button>
          <button
            className="primary-btn"
            onClick={() =>
              onSave({
                id: newId(),
                planId: plan.id,
                planTitle: plan.title,
                ifText: plan.ifText,
                thenText: plan.thenText,
                fitScore,
                easeScore,
                legacyResult: undefined,
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
  ifThenPlans,
  ifThenLogs,
  thoughtNotes,
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
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  thoughtNotes: ThoughtNote[];
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
  const prepSummary = buildConsultationSummary(period, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs, notes);
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
                  <div className="badge-stack"><SampleBadge item={note} /><span className="badge">{formatDateTime(note.updatedAt)}</span></div>
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
          <button className="ghost-btn" onClick={onClose}>← 戻る</button>
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

function ThoughtNotesScreen({
  notes,
  initial,
  prefill,
  flash,
  privateDisplayMode,
  onSave,
  onEdit,
  onDelete,
  ifThenPlans,
  onIfThenDone,
  onCreateIfThen,
  onDirtyChange,
}: {
  notes: ThoughtNote[];
  initial: ThoughtNote | null;
  prefill: Partial<ThoughtNote> | null;
  flash: string;
  privateDisplayMode: boolean;
  onSave: (note: ThoughtNote) => void;
  onEdit: (note: ThoughtNote) => void;
  onDelete: (id: string) => void;
  ifThenPlans: IfThenPlan[];
  onIfThenDone: (plan: IfThenPlan) => void;
  onCreateIfThen: (note: ThoughtNote) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const createBlank = (): ThoughtNote => {
    const timestamp = nowIso();
    return normalizeThoughtNote({
      id: newId(),
      date: today(),
      thoughtTags: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      ...prefill,
    });
  };
  const [form, setForm] = useState<ThoughtNote>(initial || createBlank());
  const [detail, setDetail] = useState<ThoughtNote | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [showRestore, setShowRestore] = useState(() => !initial && !prefill && Boolean(readDraft<ThoughtNote>(thoughtDraftKey)));
  const [isSaving, setIsSaving] = useState(false);
  const sortedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  const relatedIfThen = findIfThenByThoughtTags(ifThenPlans, form.thoughtTags).slice(0, 3);

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
    if (initial || prefill || showRestore || !isDirty) return;
    if (!hasThoughtDraftContent(form)) {
      removeDraft(thoughtDraftKey);
      setDraftStatus("");
      return;
    }
    setDraftStatus("下書きを保存中です");
    const timer = window.setTimeout(() => {
      writeDraft(thoughtDraftKey, "thought", form);
      setDraftStatus("下書きを保存しました");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, initial, prefill, showRestore, isDirty]);

  const updateForm = (next: ThoughtNote) => {
    setForm(next);
    setIsDirty(true);
  };

  const restoreDraft = () => {
    const draft = readDraft<ThoughtNote>(thoughtDraftKey);
    if (draft) {
      setForm(normalizeThoughtNote(draft.data));
      setIsDirty(true);
      setDraftStatus("下書きを再開しました");
    }
    setShowRestore(false);
  };

  const discardDraft = () => {
    removeDraft(thoughtDraftKey);
    setShowRestore(false);
    setDraftStatus("");
  };

  const resetForm = () => {
    setForm(createBlank());
    setIsDirty(false);
    setIsSaving(false);
    setDraftStatus("");
  };

  const save = () => {
    if (isSaving) return;
    setIsSaving(true);
    setIsDirty(false);
    setDraftStatus("");
    removeDraft(thoughtDraftKey);
    onSave({ ...form, updatedAt: nowIso(), createdAt: form.createdAt || nowIso() });
    resetForm();
  };

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">考えを置いておく</p>
          <h1>思考メモ</h1>
        </div>
      </header>
      <p className="soft-text">頭に浮かんだ考えや、入りやすい考え方のパターンをやさしく整理できます。</p>
      <div className="notice compact-notice">思考タグは責めるためではなく、気づくための参考情報です。無理に前向きに変える必要はありません。</div>
      {flash && <div className="success-message">{flash}</div>}

      <section className="section-block data-card">
        <h2>{initial ? "思考メモを編集" : "思考メモを書く"}</h2>
        {!initial && showRestore && <DraftRestoreNotice onRestore={restoreDraft} onDiscard={discardDraft} />}
        {draftStatus && <p className="draft-status">{draftStatus}</p>}
        <label className="field">
          <span>発生日 <small>任意</small></span>
          <input type="date" value={form.date} onChange={(event) => updateForm({ ...form, date: event.target.value })} />
        </label>
        <TextArea label="場面" helper="どんな場面だったか、短く残せます" value={form.situation} onChange={(situation) => updateForm({ ...form, situation })} />
        <TextArea label="頭に浮かんだ考え" helper="任意。書ける範囲で大丈夫です" value={form.thought} onChange={(thought) => updateForm({ ...form, thought })} />
        <label className="field">
          <span>そのときの感情 <small>任意</small></span>
          <input value={form.emotion} onChange={(event) => updateForm({ ...form, emotion: event.target.value })} placeholder="例：不安、焦り、疲れ" />
        </label>
        <ScoreField label="感情の強さ" value={form.intensity} onChange={(intensity) => updateForm({ ...form, intensity })} />
        <MultiChoice label="思考タグ" options={thoughtTagOptions} values={form.thoughtTags} onChange={(thoughtTags) => updateForm({ ...form, thoughtTags })} />
        <TextArea label="別の見方メモ" helper="少し落ち着いたあとで、別の見方ができそうなら書いておけます" value={form.alternativeView} onChange={(alternativeView) => updateForm({ ...form, alternativeView })} placeholder="今日は疲れている影響もありそう" />
        <TextArea label="自分にかけたい言葉" helper="友人に声をかけるように、短い言葉を残せます" value={form.selfCompassion} onChange={(selfCompassion) => updateForm({ ...form, selfCompassion })} placeholder="今は休んでも大丈夫" />
        <TextArea label="関連する行動" helper="そのあとに取った行動や、試したことを残せます" value={form.relatedAction} onChange={(relatedAction) => updateForm({ ...form, relatedAction })} />
        <TextArea label="メモ" helper="任意。あとから編集できます" value={form.memo} onChange={(memo) => updateForm({ ...form, memo })} />
        <div className="data-actions">
          <button className="primary-btn" disabled={isSaving} onClick={save}>{isSaving ? "保存しています" : initial ? "更新する" : "保存する"}</button>
          {initial && <button className="secondary-btn no-margin" onClick={resetForm}>編集をやめる</button>}
        </div>
      </section>

      <section className="section-block data-card">
        <h2>If-Thenプラン</h2>
        <p className="soft-text">この考え方が出たとき用の小さな行動を決めておけます。</p>
        {relatedIfThen.length > 0 ? (
          <div className="mini-plan-list">
            {relatedIfThen.map((plan) => (
              <article className="mini-plan ifthen-mini" key={plan.id}>
                <div>
                  <strong>{privateDisplayMode ? "プランあり" : `${plan.ifText} → ${plan.thenText}`}</strong>
                  <span>{plan.category}</span>
                </div>
                <button className="secondary-action" onClick={() => onIfThenDone(plan)}>実行した</button>
              </article>
            ))}
          </div>
        ) : (
          <p className="soft-text">一致するプランがない場合は、思考タグをヒントに新しく作れます。</p>
        )}
        <button className="secondary-btn" onClick={() => onCreateIfThen(form)}>この考え方が出たとき用のIf-Thenプランを作る</button>
      </section>

      <section className="section-block">
        <h2>思考メモ一覧</h2>
        {sortedNotes.length === 0 ? (
          <p className="soft-text">まだ思考メモはありません。考えが頭の中で回るときに、短く置いておけます。</p>
        ) : (
          <div className="record-list">
            {sortedNotes.map((note) => (
              <article className="record-card" key={note.id}>
                <div className="record-card-head">
                  <div>
                    <p className="label">{note.date}</p>
                    <h2>{privateDisplayMode ? "思考メモあり" : shortText(note.situation || note.thought || "思考メモ")}</h2>
                  </div>
                  <div className="badge-stack"><SampleBadge item={note} /><span className="badge">{formatScore(note.intensity)}</span></div>
                </div>
                <TagList tags={note.thoughtTags} empty="思考タグなし" />
                <div className="compact-metrics">
                  <Metric label="感情" value={privateDisplayMode ? "記録あり" : note.emotion || "未入力"} />
                  <Metric label="強さ" value={privateDisplayMode ? "記録あり" : formatScore(note.intensity)} />
                </div>
                <p className="record-snippet">{privateDisplayMode ? "思考本文は非表示です" : shortText(note.memo || note.alternativeView || note.thought)}</p>
                <div className="card-actions">
                  <button className="secondary-action" onClick={() => setDetail(note)}>詳細</button>
                  <button className="secondary-action" onClick={() => onEdit(note)}>編集</button>
                  <button className="delete-action" onClick={() => onDelete(note.id)}>削除</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {detail && <ThoughtDetailModal note={detail} privateDisplayMode={privateDisplayMode} onClose={() => setDetail(null)} onCreateIfThen={onCreateIfThen} />}
    </section>
  );
}

function ThoughtDetailModal({ note, privateDisplayMode, onClose, onCreateIfThen }: { note: ThoughtNote; privateDisplayMode: boolean; onClose: () => void; onCreateIfThen: (note: ThoughtNote) => void }) {
  const hidden = privateDisplayMode ? "詳細は非表示です" : "";
  const rows = [
    ["発生日", note.date],
    ["場面", hidden || note.situation || "未入力"],
    ["頭に浮かんだ考え", hidden || note.thought || "未入力"],
    ["そのときの感情", note.emotion || "未入力"],
    ["感情の強さ", formatScore(note.intensity)],
    ["思考タグ", joinTags(note.thoughtTags)],
    ["別の見方メモ", hidden || note.alternativeView || "未入力"],
    ["自分にかけたい言葉", hidden || note.selfCompassion || "未入力"],
    ["関連する行動", hidden || note.relatedAction || "未入力"],
    ["メモ", hidden || note.memo || "未入力"],
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="detail-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">思考メモ</p>
            <h2>詳細</h2>
          </div>
          <button className="ghost-btn" onClick={onClose}>← 戻る</button>
        </div>
        <div className="detail-list">
          {rows.map(([label, value]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <button
          className="secondary-btn"
          onClick={() => {
            onClose();
            onCreateIfThen(note);
          }}
        >
          この考え方が出たとき用のIf-Thenプランを作る
        </button>
      </div>
    </div>
  );
}

function hasThoughtDraftContent(note: ThoughtNote) {
  return Boolean(
    note.situation.trim() ||
      note.thought.trim() ||
      note.emotion.trim() ||
      note.intensity != null ||
      note.thoughtTags.length ||
      note.alternativeView.trim() ||
      note.selfCompassion.trim() ||
      note.relatedAction.trim() ||
      note.memo.trim(),
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
  onCreateThoughtFromSudden,
  onCreateIfThenFromSudden,
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
  onCreateThoughtFromSudden: (log: SuddenLog) => void;
  onCreateIfThenFromSudden: (log: SuddenLog) => void;
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
                <div className="badge-stack"><SampleBadge item={record} /><span className="badge">{record.weather}</span></div>
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
                <div className="badge-stack"><SampleBadge item={log} /><span className="badge">突発ログ</span></div>
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
                <button className="secondary-action" onClick={() => onCreateThoughtFromSudden(log)}>このときの考えをメモする</button>
                <button className="secondary-action" onClick={() => onCreateIfThenFromSudden(log)}>この状態の波に合わせたIf-Thenプランを作る</button>
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
  initialDate,
  onSave,
  onCancel,
  onDirtyChange,
}: {
  initial: DailyRecord | null;
  initialDate: string | null;
  onSave: (record: DailyRecord) => void;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<DailyRecord>(
    initial || {
      id: newId(),
      date: initialDate || today(),
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
      thoughtTags: [],
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
          <MultiChoice label="その日によく出た考え方" options={thoughtTagOptions} values={form.thoughtTags || []} onChange={(thoughtTags) => updateForm({ ...form, thoughtTags })} />
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
  initialDate,
  onSave,
  onCancel,
  onDirtyChange,
}: {
  initial: SuddenLog | null;
  initialDate: string | null;
  onSave: (log: SuddenLog) => void;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<SuddenLog>(
    initial || {
      id: newId(),
      occurredAt: initialDate ? dateWithCurrentTimeIso(initialDate) : nowIso(),
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

function Analysis({ dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs, onIfThen }: { dailyRecords: DailyRecord[]; suddenLogs: SuddenLog[]; selfCareLogs: SelfCareLog[]; thoughtNotes: ThoughtNote[]; ifThenPlans: IfThenPlan[]; ifThenLogs: IfThenLog[]; onIfThen: (prefill?: IfThenPrefill) => void }) {
  const sortedDaily = [...dailyRecords].sort((a, b) => a.date.localeCompare(b.date));
  const highDaily = sortedDaily.slice(-14);
  const insights = calculateInsights(dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs);
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
  const ifThenCounts = countBy(ifThenLogs, (log) => log.planTitle);
  const ifThenScoreSummaries = summarizeIfThenScores(ifThenPlans, ifThenLogs);
  const highFitIfThen = ifThenScoreItems(ifThenScoreSummaries, "averageFit");
  const highEaseIfThen = ifThenScoreItems(ifThenScoreSummaries, "averageEase");
  const lowFitIfThen = ifThenScoreSummaries
    .filter((summary) => summary.averageFit !== null && summary.averageFit <= 3)
    .sort((a, b) => a.averageFit! - b.averageFit!)
    .slice(0, 3)
    .map((summary) => [summary.title, summary.averageFit!.toFixed(1)] as [string, string]);
  const habitIfThen = ifThenHabitItems(ifThenScoreSummaries);
  const ifThenStateTagCounts = countFlat(ifThenPlans.flatMap((plan) => plan.relatedStateTags));
  const ifThenThoughtTagCounts = countFlat(ifThenPlans.flatMap((plan) => plan.relatedThoughtTags));
  const thoughtTagCounts = countFlat([
    ...thoughtNotes.flatMap((note) => note.thoughtTags),
    ...dailyRecords.flatMap((record) => record.thoughtTags || []),
  ]);
  const thoughtSituationCounts = countBy(thoughtNotes.filter((note) => note.situation.trim()), (note) => note.situation.trim());
  const alternativeCount = thoughtNotes.filter((note) => note.alternativeView.trim()).length;
  const selfCompassionCount = thoughtNotes.filter((note) => note.selfCompassion.trim()).length;
  const todayStability = calculateStabilityScore(today(), dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs);
  const recentStability = summarizeStabilityPeriod(7, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs);
  const topTrigger = triggerCounts[0]?.[0];
  const topStateTag = suddenByTag[0]?.[0];
  const topThoughtTag = thoughtTagCounts[0]?.[0];
  const ifThenPrefillFromInsights: IfThenPrefill = {
    title: topTrigger ? `${topTrigger}に合わせる小さな行動` : topThoughtTag ? `${topThoughtTag}が出たときの小さな行動` : "記録から作るIf-Thenプラン",
    ifText: topTrigger ? `${topTrigger}のあとに状態の波が出たら` : topThoughtTag ? `${topThoughtTag}が出たら` : "記録で見つけたきっかけが出たら",
    category: topThoughtTag ? "思考を整理する" : "記録する",
    relatedStateTags: topStateTag ? [topStateTag] : [],
    relatedThoughtTags: topThoughtTag ? [topThoughtTag] : [],
  };

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">記録上の傾向です</p>
        <h1>分析</h1>
      </header>
      <p className="soft-text">記録上の傾向です。関連している可能性があります。参考情報として見てください。医師や専門家に相談する材料として使えます。</p>

      <section className="section-block stability-card">
        <h2>安定度スコア</h2>
        <p className="soft-text">状態の波の小ささや整いやすさを、入力済みの記録だけから見た参考情報です。</p>
        <div className="summary-list">
          <Metric label="今日の安定度" value={todayStability.score === null ? "記録待ち" : `${todayStability.score}%`} />
          <Metric label="7日平均" value={recentStability.average === null ? "記録なし" : `${recentStability.average}%`} />
          <Metric label="支えていた要素" value={recentStability.supportText} />
          <Metric label="見返しポイント" value={recentStability.waveText} />
        </div>
        <p className="tiny-note">このスコアは診断や治療判断ではなく、記録上の参考情報です。</p>
      </section>

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
        <button className="secondary-btn" onClick={() => onIfThen(ifThenPrefillFromInsights)}>このきっかけに合わせたIf-Thenプランを作る</button>
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
        <h2>思考メモ</h2>
        {thoughtNotes.length === 0 && thoughtTagCounts.length === 0 ? (
          <EmptyState text="まだ思考メモはありません。考え方のパターンは、記録が増えると見えやすくなります。" />
        ) : (
          <>
            <p className="soft-text">記録上、出やすい思考タグです。責めるためではなく、気づくための参考情報です。</p>
            <div className="summary-list">
              <Metric label="思考メモ" value={`${thoughtNotes.length}件`} />
              <Metric label="平均の強さ" value={formatAverage(thoughtNotes.map((note) => note.intensity))} />
              <Metric label="別の見方メモ" value={`${alternativeCount}件`} />
              <Metric label="自分への言葉" value={`${selfCompassionCount}件`} />
            </div>
            <KeyValueList title="よく出る思考タグ" items={thoughtTagCounts} suffix="件" />
            <KeyValueList title="よく出る場面" items={thoughtSituationCounts} suffix="件" />
          </>
        )}
      </section>

      <section className="section-block">
        <h2>If-Thenプラン</h2>
        {ifThenPlans.length === 0 && ifThenLogs.length === 0 ? (
          <EmptyState text="まだIf-Thenプランはありません。小さな行動を先に決めておくと、始めるタイミングが見えやすくなります。" />
        ) : (
          <>
            <p className="soft-text">記録上、使いやすい可能性があります。参考情報として見てください。</p>
            <div className="summary-list">
              <Metric label="プラン数" value={`${ifThenPlans.length}件`} />
              <Metric label="有効なプラン" value={`${ifThenPlans.filter((plan) => plan.isActive).length}件`} />
              <Metric label="実行回数" value={`${ifThenLogs.length}回`} />
              <Metric label="平均整いやすさ" value={formatAverageWithSuffix(formatAverage(ifThenLogs.map((log) => log.fitScore)), "/10")} />
              <Metric label="平均実行しやすさ" value={formatAverageWithSuffix(formatAverage(ifThenLogs.map((log) => log.easeScore)), "/10")} />
              <Metric label="最近の実行" value={ifThenLogs[0] ? formatDateTime(ifThenLogs[0].createdAt) : "なし"} />
            </div>
            <KeyValueList title="よく実行したプラン" items={ifThenCounts} suffix="回" />
            <KeyValueList title="整いやすさが高いプラン" items={highFitIfThen} suffix="/10" />
            <KeyValueList title="実行しやすさが高いプラン" items={highEaseIfThen} suffix="/10" />
            <KeyValueList title="習慣化候補のプラン" items={habitIfThen} suffix="" />
            <KeyValueList title="今は合いにくかったプラン" items={lowFitIfThen} suffix="/10" />
            <KeyValueList title="関連状態タグ別の傾向" items={ifThenStateTagCounts} suffix="件" />
            <KeyValueList title="関連思考タグ別の傾向" items={ifThenThoughtTagCounts} suffix="件" />
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
  thoughtNotes,
  ifThenPlans,
  ifThenLogs,
  onOpenConsultation,
  demoLabel,
}: {
  dailyRecords: DailyRecord[];
  suddenLogs: SuddenLog[];
  selfCareLogs: SelfCareLog[];
  consultationNotes: ConsultationNote[];
  thoughtNotes: ThoughtNote[];
  ifThenPlans: IfThenPlan[];
  ifThenLogs: IfThenLog[];
  onOpenConsultation: () => void;
  demoLabel?: string;
}) {
  const [period, setPeriod] = useState(7);
  const [doctorMemo, setDoctorMemo] = useState("");
  const daily = dailyRecords.filter((record) => daysAgo(record.date) < period);
  const sudden = suddenLogs.filter((log) => daysAgo(log.occurredAt.slice(0, 10)) < period);
  const careInPeriod = selfCareLogs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < period);
  const thoughtInPeriod = thoughtNotes.filter((note) => daysAgo(note.date) < period);
  const ifThenLogsInPeriod = ifThenLogs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < period);
  const hasFewRecords = daily.length < 3 && sudden.length < 2 && careInPeriod.length < 3 && thoughtInPeriod.length < 3 && ifThenLogsInPeriod.length < 3;
  const reportInsights = calculateInsights(daily, sudden, careInPeriod, thoughtInPeriod, ifThenPlans, ifThenLogsInPeriod);
  const todayStability = calculateStabilityScore(today(), dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs);
  const stabilitySummary = summarizeStabilityPeriod(period, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs);
  const monthlySummaryText = buildMonthlySummaryText(today().slice(0, 7), dailyRecords, suddenLogs, selfCareLogs);
  const monthlyReflection = generateMonthlyReflection(today().slice(0, 7), dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs, consultationNotes);
  const monthlyReflectionText = monthlyReflectionToText(today().slice(0, 7), monthlyReflection);
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
  const topThoughtTags = countFlat([
    ...thoughtInPeriod.flatMap((note) => note.thoughtTags),
    ...daily.flatMap((record) => record.thoughtTags || []),
  ]).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topThoughtSituations = countBy(thoughtInPeriod.filter((note) => note.situation.trim()), (note) => note.situation.trim()).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const thoughtIntensity = formatAverageWithSuffix(formatAverage(thoughtInPeriod.map((note) => note.intensity)), "/10");
  const selfCompassionWords = thoughtInPeriod.filter((note) => note.selfCompassion.trim()).slice(0, 3).map((note) => `- ${note.selfCompassion}`).join("\n") || "記録なし";
  const activeIfThen = ifThenPlans.filter((plan) => plan.isActive).slice(0, 5).map((plan) => `- ${plan.title}: もし ${plan.ifText} / そのとき ${plan.thenText}`).join("\n") || "記録なし";
  const topIfThen = countBy(ifThenLogsInPeriod, (log) => log.planTitle).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const ifThenSummaries = summarizeIfThenScores(ifThenPlans, ifThenLogsInPeriod);
  const highFitIfThen = joinIfThenScoreTitles(ifThenScoreItems(ifThenSummaries, "averageFit"));
  const highEaseIfThen = joinIfThenScoreTitles(ifThenScoreItems(ifThenSummaries, "averageEase"));
  const habitIfThen = ifThenHabitItems(ifThenSummaries).map(([title, count]) => `${title}（${count}）`).join("、") || "記録なし";
  const notFitIfThen = joinIfThenScoreTitles(
    ifThenSummaries
      .filter((summary) => summary.averageFit !== null && summary.averageFit <= 3)
      .sort((a, b) => a.averageFit! - b.averageFit!)
      .slice(0, 3)
      .map((summary) => [summary.title, summary.averageFit!.toFixed(1)] as [string, string]),
  );
  const pendingNotes = consultationNotes.filter((note) => note.status !== "done");
  const doneNotes = consultationNotes.filter((note) => note.status === "done");
  const includedNotes = consultationNotes.filter((note) => note.includeInReport || note.status !== "done").slice(0, 5);
  const consultationSummary = includedNotes.length
    ? includedNotes.map((note) => `- ${note.title}（${targetLabel(note.target)} / ${statusLabel(note.status)}）: ${note.mainTopic || note.dontForgetMemo || "内容未記入"}`).join("\n")
    : "相談メモはまだありません。";

  const fewRecordsNote = hasFewRecords ? "記録が少ないため参考程度です。\n" : "";
  const summary = `過去${period}日間のセルフ記録です。このアプリは診断・治療・服薬指示を行うものではありません。
${fewRecordsNote}

気分平均: ${formatAverageWithSuffix(formatAverage(daily.map((record) => record.mood)), "/10")}
不安平均: ${formatAverageWithSuffix(formatAverage(daily.map((record) => record.anxiety)), "/10")}
睡眠平均: ${formatAverageWithSuffix(formatAverage(validSleepHours(daily)), "時間")}
今日の安定度: ${todayStability.score === null ? "記録待ち" : `${todayStability.score}%`}
期間平均の安定度: ${stabilitySummary.average === null ? "記録なし" : `${stabilitySummary.average}%`}
安定度を支えていた要素: ${stabilitySummary.supportText}
状態の波を見返す材料: ${stabilitySummary.waveText}
状態の波が大きかった日: ${waveDays}
期間内の突発ログ回数: ${sudden.length}件
多かった状態タグ: ${topTags}
多かったきっかけ: ${topTriggers}
多かった身体のサイン: ${topSymptoms}
効果がありそうだった対処: ${topActions}
よく使ったセルフケア: ${topCare}
実行後に整ったと感じた行動: ${settledCare}
今は合わなかった行動: ${notFitCare}
よく出た思考タグ: ${topThoughtTags}
よく出た場面: ${topThoughtSituations}
感情の強さの傾向: ${thoughtIntensity}
自分にかけたい言葉:
${selfCompassionWords}
作成しているIf-Thenプラン:
${activeIfThen}
よく実行したIf-Thenプラン: ${topIfThen}
平均整いやすさが高いIf-Thenプラン: ${highFitIfThen}
平均実行しやすさが高いIf-Thenプラン: ${highEaseIfThen}
習慣化候補のIf-Thenプラン: ${habitIfThen}
今は合いにくかったIf-Thenプラン: ${notFitIfThen}
未相談のメモ: ${pendingNotes.length}件
相談済みのメモ: ${doneNotes.length}件

相談ノート:
${consultationSummary}

記録上見えている傾向:
${insightSummary}

${monthlySummaryText}

${monthlyReflectionText}

相談時に伝えたいこと: ${doctorMemo || "未記入"}`;

  const prompt = `以下はメンタルヘルスのセルフ記録です。診断や治療判断、服薬指示はしないでください。
記録上の傾向として整理してください。
医師や専門家に相談すべき点を分けてください。
生活面で見直せそうな候補は、断定せず「可能性」「参考情報」として提示してください。
思考の傾向として整理し、本人を責める表現は避けてください。
If-Thenプランはセルフケア補助として扱い、本人を責める表現は避けてください。
睡眠、天気、外出、突発ログ、セルフケアの要約も含めてください。

${summary}`;

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">共有用</p>
        <h1>レポート</h1>
      </header>
      {demoLabel && <div className="demo-mode-chip inline">{demoLabel}</div>}
      {hasFewRecords && <div className="notice">記録が少ないため参考程度です。無理に分析せず、共有用の整理メモとして使えます。</div>}
      <Choice label="期間" options={["7日間", "14日間", "30日間"]} value={`${period}日間`} onChange={(value) => setPeriod(Number(value.replace("日間", "")))} />
      <TextArea label="相談時に伝えたいことメモ" value={doctorMemo} onChange={setDoctorMemo} />
      <section className="section-block stability-card">
        <h2>安定度の参考情報</h2>
        <div className="summary-list">
          <Metric label="今日" value={todayStability.score === null ? "記録待ち" : `${todayStability.score}%`} />
          <Metric label={`${period}日平均`} value={stabilitySummary.average === null ? "記録なし" : `${stabilitySummary.average}%`} />
          <Metric label="支えていた要素" value={stabilitySummary.supportText} />
          <Metric label="見返しポイント" value={stabilitySummary.waveText} />
        </div>
        <p className="tiny-note">診断や治療判断ではなく、記録上の参考情報です。</p>
      </section>
      <section className="section-block data-card">
        <h2>相談ノート</h2>
        <p className="soft-text">未相談のメモ {pendingNotes.length}件 / 相談済みのメモ {doneNotes.length}件。診察前まとめは相談ノート画面で作れます。</p>
        <button className="secondary-btn no-margin" onClick={onOpenConsultation}>診察前まとめを開く</button>
      </section>
      <section className="section-block reflection-detail-card">
        <h2>月間ふりかえりコメント</h2>
        <p className="soft-text">{monthlyReflection.summary}</p>
        <p className="tiny-note">記録上の傾向をもとにした参考コメントです。診断や治療判断ではありません。</p>
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

function DetailModal({ item, onClose, onCreateIfThen }: { item: DetailItem; onClose: () => void; onCreateIfThen: (log: SuddenLog) => void }) {
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
          ["思考タグ", joinTags(item.record.thoughtTags || [])],
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
          <button className="ghost-btn" onClick={onClose}>← 戻る</button>
        </div>
        <div className="detail-list">
          {rows.map(([label, value]) => (
            <div className="detail-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        {item.kind === "sudden" && (
          <button
            className="secondary-btn"
            onClick={() => {
              onClose();
              onCreateIfThen(item.record);
            }}
          >
            この状態の波に合わせたIf-Thenプランを作る
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClassName = "primary-btn",
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel}>キャンセル</button>
          <button className={confirmClassName} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ onCancel, onConfirm, isAllData = false }: { onCancel: () => void; onConfirm: () => void; isAllData?: boolean }) {
  return (
    <ConfirmDialog
      title={isAllData ? "すべて削除しますか？" : "削除しますか？"}
      message={isAllData ? "保存されている記録をすべて削除します。この操作は元に戻せません。先にバックアップを取ることをおすすめします。" : "この記録を削除しますか？この操作は元に戻せません。"}
      confirmLabel={isAllData ? "すべて削除" : "削除する"}
      confirmClassName="delete-action"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function ConfirmImportModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      title="読み込みますか？"
      message="現在の記録にバックアップデータを読み込みます。既存の記録は上書きされる可能性があります。続行しますか？"
      confirmLabel="読み込む"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
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
      <button className="ghost-btn" onClick={onCancel}>← 戻る</button>
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

function SampleBadge({ item }: { item: unknown }) {
  return isSampleItem(item) ? <span className="sample-badge">サンプル</span> : null;
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
    <fieldset className="field choice-field">
      <legend>{label}</legend>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            aria-pressed={value === option}
            className={value === option ? "chip selected" : "chip"}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function MultiChoice({ label, options, values, onChange }: { label: string; options: string[]; values: string[]; onChange: (values: string[]) => void }) {
  return (
    <fieldset className="field choice-field">
      <legend>{label}</legend>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            aria-pressed={values.includes(option)}
            className={values.includes(option) ? "chip selected" : "chip"}
            key={option}
            onClick={() => onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option])}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function TextArea({ label, helper, value, onChange, placeholder }: { label: string; helper?: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {helper && <small className="helper-text">{helper}</small>}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} />
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
        <span>{insight.group === "daily" ? "日々の記録" : insight.group === "sudden" ? "突発ログ" : insight.group === "selfcare" ? "セルフケア" : insight.group === "ifthen" ? "If-Then" : "思考メモ"}</span>
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

function formatAverageWithSuffix(value: string, suffix: string) {
  return value === "-" ? "記録なし" : `${value}${suffix}`;
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

function formatJapaneseDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return `${parsed.getMonth() + 1}月${parsed.getDate()}日`;
}

function weekdayLabel(date: string) {
  const labels = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  return labels[new Date(`${date}T00:00:00`).getDay()];
}

function weekdayShortLabel(date: string) {
  const labels = ["日", "月", "火", "水", "木", "金", "土"];
  return labels[new Date(`${date}T00:00:00`).getDay()];
}

function calculateStabilityScore(date: string, dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[], thoughtNotes: ThoughtNote[], ifThenPlans: IfThenPlan[], ifThenLogs: IfThenLog[]): StabilityScore {
  const daily = dailyRecords.find((record) => record.date === date);
  const recentDates = new Set(dailyRecords.filter((record) => daysAgo(record.date) >= 0 && daysAgo(record.date) < 7).map((record) => record.date));
  const sudden = suddenLogs.filter((log) => log.occurredAt.slice(0, 10) === date);
  const thoughts = thoughtNotes.filter((note) => note.date === date);
  const care = selfCareLogs.filter((log) => log.createdAt.slice(0, 10) === date);
  const ifThen = ifThenLogs.filter((log) => log.createdAt.slice(0, 10) === date);
  const habitPlanIds = new Set(ifThenHabitItems(summarizeIfThenScores(ifThenPlans, ifThenLogs)).map(([planId]) => planId));

  const basicValues = daily ? [
    scoreHighGood(daily.mood),
    scoreLowGood(daily.anxiety),
    scoreLowGood(daily.irritability),
    scoreLowGood(daily.fatigue),
  ] : [];
  const sleepValues = daily ? [
    scoreSleepHours(daily.sleepHours),
    scoreSleepQuality(daily.sleepQuality),
  ] : [];
  const lifestyleValues = daily ? [
    scoreMeal(daily.meal),
    scoreExercise(daily.exercise),
    daily.wentOut === "あり" ? 72 : daily.wentOut === "なし" ? 58 : null,
  ] : [];
  const suddenIntensity = nullableAverage(sudden.map((log) => log.intensity));
  const waveValues = sudden.length ? [
    clampScore(88 - Math.min(sudden.length, 5) * 9),
    suddenIntensity === null ? null : clampScore(92 - suddenIntensity * 5),
    clampScore(90 - Math.min(countFlat(sudden.flatMap((log) => log.stateTags)).length, 10) * 3),
    clampScore(90 - Math.min(countFlat(sudden.flatMap((log) => log.symptoms)).length, 10) * 3),
  ] : daily ? [78] : [];
  const thoughtIntensity = nullableAverage(thoughts.map((note) => note.intensity));
  const thoughtValues = thoughts.length ? [
    clampScore(90 - Math.min(thoughts.length, 5) * 5),
    thoughtIntensity === null ? null : clampScore(92 - thoughtIntensity * 5),
    clampScore(88 - Math.min(countFlat(thoughts.flatMap((note) => note.thoughtTags)).length, 10) * 3),
  ] : daily ? [74] : [];
  const careValues = care.length ? [
    clampScore(68 + Math.min(care.length, 3) * 7),
    ...care.map((log) => scoreSelfCareResult(log.result)),
  ] : [];
  const ifThenValues = ifThen.length ? [
    clampScore(68 + Math.min(ifThen.length, 3) * 6),
    nullableAverage(ifThen.map((log) => log.fitScore)) === null ? null : nullableAverage(ifThen.map((log) => log.fitScore))! * 10,
    nullableAverage(ifThen.map((log) => log.easeScore)) === null ? null : nullableAverage(ifThen.map((log) => log.easeScore))! * 10,
    ifThen.some((log) => habitPlanIds.has(log.planId)) ? 84 : null,
  ] : [];
  const recordingValues = [
    daily ? 76 : null,
    recentDates.size ? clampScore(54 + Math.min(recentDates.size, 7) * 5) : null,
  ];

  const parts: StabilityPart[] = [
    createStabilityPart("basic", "気分・不安感", basicValues, daily ? "気分、不安感、いらだち、疲労度から見ています。" : "今日の記録があると見えやすくなります。"),
    createStabilityPart("sleep", "睡眠", sleepValues, daily ? "睡眠時間と睡眠の質から見ています。" : "睡眠の記録が増えると見えやすくなります。"),
    createStabilityPart("lifestyle", "生活行動", lifestyleValues, daily ? "食事、外出、運動の記録を参考にしています。" : "生活行動の記録があると参考になります。"),
    createStabilityPart("wave", "状態の波", waveValues, sudden.length ? "突発ログの回数、強さ、タグ、身体のサインから見ています。" : "今日の突発ログは多くありません。"),
    createStabilityPart("thought", "思考メモ", thoughtValues, thoughts.length ? "思考メモの件数、感情の強さ、タグから見ています。" : "思考メモがあると考え方の傾向も見えます。"),
    createStabilityPart("selfcare", "セルフケア", careValues, care.length ? "セルフケア実行と実行後の感じ方を反映しています。" : "実行ログがあると整いやすさを見やすくなります。"),
    createStabilityPart("ifthen", "If-Then", ifThenValues, ifThen.length ? "整いやすさ、実行しやすさ、習慣化候補を反映しています。" : "If-Then実行ログがあると反映されます。"),
    createStabilityPart("recording", "記録状況", recordingValues, "今日と直近7日間の記録状況を少しだけ参考にしています。"),
  ];
  const validParts = parts.filter((part) => part.score !== null);
  const score = validParts.length ? Math.round(validParts.reduce((sum, part) => sum + part.score!, 0) / validParts.length) : null;
  const supportText = validParts.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.label || "記録";
  const waveText = validParts.sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0]?.label || "記録";
  const isReference = validParts.length < 4 || !daily;
  const note = score === null
    ? "記録が増えると、安定度の参考スコアが見えやすくなります。"
    : isReference
      ? "今日は記録が少ないため参考値です。入力済みの項目だけで見ています。"
      : `${supportText}の記録が安定度を支えている可能性があります。`;

  return { score, parts, isReference, note, supportText, waveText };
}

function summarizeStabilityPeriod(period: number, dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[], thoughtNotes: ThoughtNote[], ifThenPlans: IfThenPlan[], ifThenLogs: IfThenLog[]) {
  const dates = new Set<string>();
  dailyRecords.filter((record) => daysAgo(record.date) < period).forEach((record) => dates.add(record.date));
  suddenLogs.filter((log) => daysAgo(log.occurredAt.slice(0, 10)) < period).forEach((log) => dates.add(log.occurredAt.slice(0, 10)));
  selfCareLogs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < period).forEach((log) => dates.add(log.createdAt.slice(0, 10)));
  thoughtNotes.filter((note) => daysAgo(note.date) < period).forEach((note) => dates.add(note.date));
  ifThenLogs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < period).forEach((log) => dates.add(log.createdAt.slice(0, 10)));
  const scores = [...dates].map((date) => calculateStabilityScore(date, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs));
  const averageScore = nullableAverage(scores.map((item) => item.score));
  const partScores = groupItems(scores.flatMap((item) => item.parts.filter((part) => part.score !== null)), (part) => part.label);
  const partAverages = Array.from(partScores.entries()).map(([label, parts]) => ({
    label,
    average: nullableAverage(parts.map((part) => part.score)),
  })).filter((item): item is { label: string; average: number } => item.average !== null);
  const supportText = partAverages.length
    ? [...partAverages].sort((a, b) => b.average - a.average)[0].label
    : "記録";
  const waveText = partAverages.length
    ? [...partAverages].sort((a, b) => a.average - b.average)[0].label
    : "記録";
  return {
    average: averageScore === null ? null : Math.round(averageScore),
    supportText: partAverages.length ? `${supportText}が支えになっている可能性があります` : "記録が増えると見えやすくなります",
    waveText: partAverages.length ? `${waveText}を見返す材料にできます` : "記録が増えると見えやすくなります",
  };
}

function createStabilityPart(key: StabilityPart["key"], label: string, values: Array<number | null | undefined>, note: string): StabilityPart {
  const score = nullableAverage(values.map((value) => isFiniteNumber(value) ? clampScore(value) : null));
  return { key, label, score: score === null ? null : Math.round(score), note };
}

function scoreHighGood(value: number | null | undefined) {
  return isFiniteNumber(value) ? value * 10 : null;
}

function scoreLowGood(value: number | null | undefined) {
  return isFiniteNumber(value) ? (11 - value) * 10 : null;
}

function scoreSleepHours(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return null;
  if (value >= 6 && value <= 8.5) return 86;
  if (value >= 5 && value < 6) return 68;
  if (value > 8.5 && value <= 10) return 72;
  return 54;
}

function scoreSleepQuality(value: SleepQuality) {
  if (value === "良い") return 88;
  if (value === "普通") return 70;
  return 54;
}

function scoreMeal(value: DailyRecord["meal"]) {
  if (value === "しっかり食べた") return 82;
  if (value === "普通") return 72;
  if (value === "少ない") return 58;
  return 46;
}

function scoreExercise(value: DailyRecord["exercise"]) {
  if (value === "散歩" || value === "軽い運動") return 82;
  if (value === "筋トレ" || value === "その他") return 74;
  return 58;
}

function scoreSelfCareResult(value: SelfCareResult) {
  if (value === "少し整った") return 84;
  if (value === "変化は少なめ") return 64;
  if (value === "今は合わなかった") return 48;
  return 58;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function scoreBand(score: number) {
  if (score >= 80) return "score-high";
  if (score >= 70) return "score-mid";
  if (score >= 60) return "score-low";
  return "score-muted";
}

function scoreFace(score: number) {
  if (score >= 80) return "☺";
  if (score >= 70) return "◡";
  if (score >= 60) return "◌";
  return "○";
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

function offsetDateString(baseDate: string, offset: number) {
  const date = new Date(`${baseDate}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return localDateString(date);
}

function recentDateList(days: number) {
  return Array.from({ length: days }, (_, index) => offsetDateString(today(), index - days + 1));
}

function currentMonthDateList() {
  return monthDateList(today().slice(0, 7));
}

function monthDateList(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  return Array.from({ length: days }, (_, index) => localDateString(new Date(year, monthNumber - 1, index + 1)));
}

function buildDailyRingData(
  month: string,
  dailyRecords: DailyRecord[],
  suddenLogs: SuddenLog[],
  selfCareLogs: SelfCareLog[],
  thoughtNotes: ThoughtNote[],
  ifThenPlans: IfThenPlan[],
  ifThenLogs: IfThenLog[],
): DailyRingData[] {
  const byDate = new Map(dailyRecords.map((record) => [record.date, record]));
  return monthDateList(month).map((date) => {
    const daily = byDate.get(date);
    const suddenLogCount = suddenLogs.filter((log) => log.occurredAt.slice(0, 10) === date).length;
    const thoughtNoteCount = thoughtNotes.filter((note) => note.date === date).length;
    const selfCareLogCount = selfCareLogs.filter((log) => log.createdAt.slice(0, 10) === date).length;
    const ifThenLogCount = ifThenLogs.filter((log) => log.createdAt.slice(0, 10) === date).length;
    const activityScore = scoreActivityRing(date, dailyRecords, selfCareLogs, ifThenLogs);
    const hasAny = Boolean(daily) || suddenLogCount > 0 || thoughtNoteCount > 0 || selfCareLogCount > 0 || ifThenLogCount > 0;
    const stability = hasAny ? calculateStabilityScore(date, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs).score : null;
    return {
      date,
      day: Number(date.slice(8, 10)),
      moodScore: isFiniteNumber(daily?.mood) ? daily.mood * 10 : null,
      anxietyScore: daily?.anxiety ?? null,
      stabilityScore: stability,
      sleepScore: scoreSleepRing(daily?.sleepHours),
      sleepHours: daily?.sleepHours ?? null,
      activityScore,
      hasDailyRecord: Boolean(daily),
      isToday: date === today(),
      isMissing: !hasAny,
      suddenLogCount,
      thoughtNoteCount,
      ifThenLogCount,
      selfCareLogCount,
    };
  });
}

function scoreSleepRing(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return null;
  if (value >= 7) return 100;
  if (value >= 6) return 85;
  if (value >= 5) return 65;
  if (value >= 4) return 45;
  return 30;
}

function scoreActivityRing(date: string, dailyRecords: DailyRecord[], selfCareLogs: SelfCareLog[], ifThenLogs: IfThenLog[]) {
  const record = dailyRecords.find((item) => item.date === date);
  const hasExercise = Boolean(record?.exercise && record.exercise !== "なし");
  const hasOuting = record?.wentOut === "あり";
  const hasCare = selfCareLogs.some((log) => log.createdAt.slice(0, 10) === date);
  const hasIfThen = ifThenLogs.some((log) => log.createdAt.slice(0, 10) === date);
  const count = [hasOuting, hasExercise, hasCare, hasIfThen].filter(Boolean).length;
  if (count >= 4) return 100;
  if (count === 3) return 80;
  if (count === 2) return 60;
  if (count === 1) return 40;
  return null;
}

function getRingMonthlySummary(days: DailyRingData[]): RingMonthlySummary {
  return {
    recordDays: days.filter((day) => day.hasDailyRecord).length,
    averageStability: nullableAverage(days.map((day) => day.stabilityScore ?? day.moodScore)),
    averageSleep: nullableAverage(days.map((day) => day.sleepHours)),
    activityDays: days.filter((day) => isFiniteNumber(day.activityScore)).length,
    suddenCount: days.reduce((sum, day) => sum + day.suddenLogCount, 0),
    thoughtCount: days.reduce((sum, day) => sum + day.thoughtNoteCount, 0),
    ifThenCount: days.reduce((sum, day) => sum + day.ifThenLogCount, 0),
    selfCareCount: days.reduce((sum, day) => sum + day.selfCareLogCount, 0),
  };
}

function buildMoodTrendPoints(records: DailyRecord[], range: TrendRange): TrendPoint[] {
  const byDate = new Map(records.map((record) => [record.date, record]));
  const dates = range === "day" ? [today()] : range === "week" ? recentDateList(7) : currentMonthDateList();
  const points = dates.map((date) => {
    const day = Number(date.slice(8, 10));
    const value = byDate.get(date)?.mood ?? null;
    return {
      date,
      label: range === "day" ? "今日" : range === "month" ? String(day) : date.slice(5).replace("-", "/"),
      value,
      isActive: false,
      showLabel: range !== "month" || shouldShowMonthlyDayLabel(day, dates.length, date),
    };
  });
  return markActiveTrendPoint(points, range);
}

function buildMoodTrendPointsForMonth(month: string, records: DailyRecord[]): TrendPoint[] {
  const byDate = new Map(records.map((record) => [record.date, record]));
  const dates = monthDateList(month);
  const points = dates.map((date) => {
    const day = Number(date.slice(8, 10));
    return {
      date,
      label: String(day),
      value: byDate.get(date)?.mood ?? null,
      isActive: false,
      showLabel: shouldShowMonthlyDayLabel(day, dates.length, date),
    };
  });
  return markActiveTrendPoint(points, "month");
}

function buildMetricTrendPoints(metric: MetricType, range: TrendRange, dailyRecords: DailyRecord[], selfCareLogs: SelfCareLog[], ifThenLogs: IfThenLog[]): TrendPoint[] {
  const byDate = new Map(dailyRecords.map((record) => [record.date, record]));
  const dates = range === "day" ? [today()] : range === "week" ? recentDateList(7) : currentMonthDateList();
  const points = dates.map((date) => {
    const record = byDate.get(date);
    const value = metric === "sleep"
      ? record?.sleepHours ?? null
      : metric === "anxiety"
        ? record?.anxiety ?? null
        : activityScoreForDate(date, dailyRecords, selfCareLogs, ifThenLogs);
    const day = Number(date.slice(8, 10));
    return {
      date,
      label: range === "day" ? "今日" : range === "month" ? String(day) : date.slice(5).replace("-", "/"),
      value,
      isActive: false,
      showLabel: range !== "month" || shouldShowMonthlyDayLabel(day, dates.length, date),
    };
  });
  return markActiveTrendPoint(points, range);
}

function shouldShowMonthlyDayLabel(day: number, daysInMonth: number, date: string) {
  return day === 1 || day === 5 || day === 10 || day === 15 || day === 20 || day === 25 || day === daysInMonth || date === today();
}

function shouldShowTrendPointLabel(point: TrendPoint, points: TrendPoint[], range: TrendRange, selectedDate?: string) {
  if (range !== "month") return true;
  const selectedDay = selectedDate ? Number(selectedDate.slice(8, 10)) : null;
  const pointDay = Number(point.date.slice(8, 10));
  const isSelected = Boolean(selectedDate && point.date === selectedDate);
  if (isSelected) return true;
  if (selectedDay && Math.abs(pointDay - selectedDay) <= 2) return false;
  const monthEnd = points.length;
  return shouldShowMonthlyDayLabel(pointDay, monthEnd, point.date);
}

function trendPointDisplayLabel(point: TrendPoint, range: TrendRange) {
  if (range === "week") return String(Number(point.date.slice(8, 10)));
  return point.label;
}

function markActiveTrendPoint(points: TrendPoint[], range: TrendRange) {
  const todayPoint = points.find((point) => point.date === today() && isFiniteNumber(point.value));
  const latestValuePoint = [...points].reverse().find((point) => isFiniteNumber(point.value));
  const activeDate = todayPoint?.date || latestValuePoint?.date || today();
  return points.map((point) => ({
    ...point,
    isActive: point.date === activeDate,
    showLabel: point.showLabel || (range === "month" && point.date === activeDate),
  }));
}

function getInitialSelectedDateFromPoints(points: TrendPoint[]) {
  return points.find((point) => point.date === today() && isFiniteNumber(point.value))?.date
    || [...points].reverse().find((point) => isFiniteNumber(point.value))?.date
    || points.find((point) => point.date === today())?.date
    || points[0]?.date
    || "";
}

function activityScoreForDate(date: string, dailyRecords: DailyRecord[], selfCareLogs: SelfCareLog[], ifThenLogs: IfThenLog[]) {
  const record = dailyRecords.find((item) => item.date === date);
  const careCount = selfCareLogs.filter((log) => log.createdAt.slice(0, 10) === date).length;
  const ifThenCount = ifThenLogs.filter((log) => log.createdAt.slice(0, 10) === date).length;
  const dailyActivity = (record?.exercise && record.exercise !== "なし" ? 1 : 0) + (record?.wentOut === "あり" ? 1 : 0);
  const total = dailyActivity + careCount + ifThenCount;
  return total > 0 ? total : null;
}

function formatMetricToday(metric: MetricType, todayRecord: DailyRecord | undefined, selfCareLogs: SelfCareLog[], ifThenLogs: IfThenLog[], privateDisplayMode: boolean) {
  if (privateDisplayMode) return todayRecord ? "記録あり" : "記録なし";
  if (metric === "sleep") return todayRecord ? `${formatSleepHours(todayRecord.sleepHours)} / ${todayRecord.sleepQuality}` : "記録なし";
  if (metric === "anxiety") return todayRecord ? formatScore(todayRecord.anxiety) : "記録なし";
  const activity = activityScoreForDate(today(), todayRecord ? [todayRecord] : [], selfCareLogs, ifThenLogs);
  return isFiniteNumber(activity) ? `${activity}回` : "記録なし";
}

function formatMetricAverage(metric: MetricType, records: DailyRecord[], selfCareLogs: SelfCareLog[], ifThenLogs: IfThenLog[], days: number, privateDisplayMode: boolean) {
  if (privateDisplayMode) return records.length ? "記録状況あり" : "記録なし";
  if (metric === "sleep") return formatAverageWithSuffix(formatAverage(validSleepHours(records)), "h");
  if (metric === "anxiety") return formatAverageWithSuffix(formatAverage(records.map((record) => record.anxiety)), "/10");
  const dates = days === 7 ? recentDateList(7) : currentMonthDateList();
  const values = dates.map((date) => activityScoreForDate(date, records, selfCareLogs, ifThenLogs)).filter(isFiniteNumber);
  return values.length ? `${values.reduce((sum, value) => sum + value, 0)}回` : "記録なし";
}

function getMetricDetailContent(
  metric: MetricType,
  dailyRecords: DailyRecord[],
  suddenLogs: SuddenLog[],
  selfCareLogs: SelfCareLog[],
  ifThenPlans: IfThenPlan[],
  ifThenLogs: IfThenLog[],
  thoughtNotes: ThoughtNote[],
) {
  const monthRecords = dailyRecords.filter((record) => record.date.startsWith(today().slice(0, 7)));
  if (metric === "sleep") {
    const shortDays = monthRecords.filter((record) => isFiniteNumber(record.sleepHours) && record.sleepHours < 5).length;
    const longDays = monthRecords.filter((record) => isFiniteNumber(record.sleepHours) && record.sleepHours >= 7).length;
    const quality = countBy(monthRecords, (record) => record.sleepQuality).map(([key, count]) => `${key} ${count}日`).join(" / ") || "記録なし";
    const recentMemo = [...monthRecords].reverse().find((record) => record.memo.trim())?.memo || "最近の睡眠メモはまだありません。";
    return {
      lead: "記録上、睡眠時間の変化を確認できます。",
      trendTitle: "睡眠時間の推移",
      comment: "未入力の日は平均に含めていません。睡眠の質やメモも一緒に見ると、相談時の材料にできます。",
      relatedText: "睡眠メモや生活記録を見返せます。",
      metrics: [
        ["睡眠の質", quality],
        ["5時間未満", `${shortDays}日`],
        ["7時間以上", `${longDays}日`],
        ["最近のメモ", shortText(recentMemo, 34)],
      ] as [string, string][],
    };
  }

  if (metric === "anxiety") {
    const highDays = monthRecords.filter((record) => isFiniteNumber(record.anxiety) && record.anxiety >= 7).length;
    const topTags = countFlat(suddenLogs.filter((log) => log.occurredAt.startsWith(today().slice(0, 7))).flatMap((log) => log.stateTags)).slice(0, 3).map(([tag]) => tag).join(" / ") || "記録なし";
    const topTriggers = countFlat(suddenLogs.filter((log) => log.occurredAt.startsWith(today().slice(0, 7))).flatMap((log) => log.triggers)).slice(0, 3).map(([tag]) => tag).join(" / ") || "記録なし";
    const thoughtTags = countFlat(thoughtNotes.filter((note) => note.date.startsWith(today().slice(0, 7))).flatMap((note) => note.thoughtTags)).slice(0, 3).map(([tag]) => tag).join(" / ") || "記録なし";
    const ifThenSummary = summarizeIfThenScores(ifThenPlans, ifThenLogs).filter((summary) => summary.averageFit !== null).sort((a, b) => (b.averageFit || 0) - (a.averageFit || 0))[0];
    return {
      lead: "記録上、不安感の変化と関連しそうなきっかけを確認できます。",
      trendTitle: "不安感の推移",
      comment: "原因を断定するものではありません。状態タグや思考タグと合わせて、相談時の材料として使えます。",
      relatedText: "不安感が高めの日の記録、突発ログ、思考メモを見返せます。",
      metrics: [
        ["高めの日", `${highDays}日`],
        ["状態タグ", topTags],
        ["きっかけ", topTriggers],
        ["思考タグ", thoughtTags],
        ["If-Then", ifThenSummary ? `${ifThenSummary.title}（整いやすさ${ifThenSummary.averageFit?.toFixed(1)}/10）` : "記録なし"],
      ] as [string, string][],
    };
  }

  const monthDates = currentMonthDateList();
  const activeDays = monthDates.filter((date) => activityScoreForDate(date, dailyRecords, selfCareLogs, ifThenLogs)).length;
  const exerciseDays = monthRecords.filter((record) => record.exercise !== "なし").length;
  const walkDays = monthRecords.filter((record) => record.exercise === "散歩").length;
  const outsideDays = monthRecords.filter((record) => record.wentOut === "あり").length;
  const monthCare = selfCareLogs.filter((log) => log.createdAt.startsWith(today().slice(0, 7))).length;
  const monthIfThen = ifThenLogs.filter((log) => log.createdAt.startsWith(today().slice(0, 7))).length;
  const activeStability = nullableAverage(monthDates
    .filter((date) => activityScoreForDate(date, dailyRecords, selfCareLogs, ifThenLogs))
    .map((date) => calculateStabilityScore(date, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs).score));
  return {
    lead: "記録上、外出や軽い運動、小さな行動があった日を確認できます。",
    trendTitle: "活動の推移",
    comment: "無理に増やすための指標ではなく、ふり返り用の参考情報です。",
    relatedText: "運動・外出の記録や、セルフケア/If-Thenの実行ログを見返せます。",
    metrics: [
      ["活動があった日", `${activeDays}日`],
      ["運動あり", `${exerciseDays}日`],
      ["散歩", `${walkDays}日`],
      ["外出あり", `${outsideDays}日`],
      ["セルフケア", `${monthCare}回`],
      ["If-Then", `${monthIfThen}回`],
      ["活動日の安定度", activeStability === null ? "記録なし" : `${Math.round(activeStability)}%`],
    ] as [string, string][],
  };
}

function dateWithCurrentTimeIso(date: string) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return new Date(`${date}T${hours}:${minutes}:00`).toISOString();
}

function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}年${Number(monthNumber)}月`;
}

function buildCalendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return localDateString(date);
  });
}

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDayCalendarData(date: string, dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[]) {
  return {
    daily: dailyRecords.find((record) => record.date === date),
    suddenCount: suddenLogs.filter((log) => log.occurredAt.slice(0, 10) === date).length,
    careCount: selfCareLogs.filter((log) => log.createdAt.slice(0, 10) === date).length,
  };
}

function getMonthlySummary(month: string, dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[]) {
  const daily = dailyRecords.filter((record) => record.date.startsWith(month));
  const sudden = suddenLogs.filter((log) => log.occurredAt.slice(0, 7) === month);
  const care = selfCareLogs.filter((log) => log.createdAt.slice(0, 7) === month);
  return {
    dailyDays: new Set(daily.map((record) => record.date)).size,
    suddenCount: sudden.length,
    careCount: care.length,
    averageMood: formatAverage(daily.map((record) => record.mood)),
    averageAnxiety: formatAverage(daily.map((record) => record.anxiety)),
    averageSleep: formatAverage(validSleepHours(daily)),
    waveDays: daily.filter(hasLargeWaveScore).length,
    topTag: firstKey(countFlat(sudden.flatMap((log) => log.stateTags))),
    topCare: firstKey(countBy(care, (log) => log.title)),
  };
}

function buildMonthlySummaryText(month: string, dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[]) {
  const summary = getMonthlySummary(month, dailyRecords, suddenLogs, selfCareLogs);
  return `月間ふり返り（${formatMonthLabel(month)}）
月間記録日数: ${summary.dailyDays}日
月間の平均気分: ${formatAverageWithSuffix(summary.averageMood, "/10")}
月間の平均不安感: ${formatAverageWithSuffix(summary.averageAnxiety, "/10")}
月間の平均睡眠時間: ${formatAverageWithSuffix(summary.averageSleep, "時間")}
月間の突発ログ件数: ${summary.suddenCount}件
月間で多かった状態タグ: ${summary.topTag}
月間でよく使ったセルフケア: ${summary.topCare}
この内容は記録上の傾向です。原因を断定するものではありません。`;
}

function generateMonthlyReflection(
  month: string,
  dailyRecords: DailyRecord[],
  suddenLogs: SuddenLog[],
  selfCareLogs: SelfCareLog[],
  thoughtNotes: ThoughtNote[],
  ifThenPlans: IfThenPlan[],
  ifThenLogs: IfThenLog[],
  consultationNotes: ConsultationNote[],
): MonthlyReflection {
  const daily = dailyRecords.filter((record) => record.date.startsWith(month));
  const sudden = suddenLogs.filter((log) => log.occurredAt.slice(0, 7) === month);
  const care = selfCareLogs.filter((log) => log.createdAt.slice(0, 7) === month);
  const thoughts = thoughtNotes.filter((note) => note.date.startsWith(month));
  const ifThen = ifThenLogs.filter((log) => log.createdAt.slice(0, 7) === month);
  const notes = consultationNotes.filter((note) => note.createdAt.slice(0, 7) === month || note.updatedAt.slice(0, 7) === month);
  const dailyCount = new Set(daily.map((record) => record.date)).size;
  const enoughDaily = dailyCount >= 3;
  const enoughSudden = sudden.length >= 3;
  const enoughCare = care.length >= 3;
  const enoughIfThen = ifThen.length >= 3;
  const hasEnoughData = enoughDaily || enoughSudden || enoughCare || enoughIfThen || thoughts.length >= 3;
  const topTrigger = firstKey(countFlat(sudden.flatMap((log) => log.triggers)));
  const topStateTag = firstKey(countFlat(sudden.flatMap((log) => log.stateTags)));
  const topThoughtTag = firstKey(countFlat([...thoughts.flatMap((note) => note.thoughtTags), ...daily.flatMap((record) => record.thoughtTags || [])]));
  const topSelfCare = firstKey(countBy(care, (log) => log.title));
  const topIfThen = firstKey(countBy(ifThen, (log) => log.planTitle));
  const averageMood = nullableAverage(daily.map((record) => record.mood).filter(isFiniteNumber));
  const averageAnxiety = nullableAverage(daily.map((record) => record.anxiety).filter(isFiniteNumber));
  const averageFatigue = nullableAverage(daily.map((record) => record.fatigue).filter(isFiniteNumber));
  const averageSleep = nullableAverage(validSleepHours(daily));
  const stabilityScores = daily
    .map((record) => calculateStabilityScore(record.date, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs).score)
    .filter(isFiniteNumber);
  const averageStability = nullableAverage(stabilityScores);
  const shortSleepRecords = daily.filter((record) => hasSleepHours(record) && Number(record.sleepHours) < 6);
  const shortSleepAnxiety = nullableAverage(shortSleepRecords.map((record) => record.anxiety).filter(isFiniteNumber));
  const activeDays = daily.filter((record) => record.exercise !== "なし" || record.wentOut === "あり").length;
  const settledCare = firstKey(countBy(care.filter((log) => log.result === "少し整った"), (log) => log.title));
  const ifThenFit = nullableAverage(ifThen.map((log) => log.fitScore).filter(isFiniteNumber));
  const ifThenEase = nullableAverage(ifThen.map((log) => log.easeScore).filter(isFiniteNumber));
  const thoughtIntensity = nullableAverage(thoughts.map((note) => note.intensity).filter(isFiniteNumber));

  if (!hasEnoughData) {
    const gentle = "この月の記録はまだ少なめです。もう少し記録が増えると、状態の波や整いやすい行動が見えやすくなります。";
    return {
      summary: gentle,
      hasEnoughData,
      topTrigger,
      topStateTag,
      topThoughtTag,
      topSelfCare,
      topIfThen,
      sections: {
        overall: gentle,
        sleep: averageSleep === null ? "睡眠の記録が増えると、休息との関係を見返しやすくなります。" : `睡眠は記録がある日の平均で${averageSleep.toFixed(1)}時間です。参考情報として見てください。`,
        anxiety: averageAnxiety === null ? "不安感の記録はまだ少なめです。" : `不安感は記録がある日の平均で${averageAnxiety.toFixed(1)}/10です。原因を断定するものではありません。`,
        activity: care.length || ifThen.length ? "セルフケアやIf-Thenの記録が少しあります。続けやすさを見る材料にできます。" : "活動やセルフケアの記録が増えると、整いやすい行動が見えやすくなります。",
        suddenLogs: sudden.length ? `突発ログは${sudden.length}件あります。内容は相談時の材料として使えます。` : "突発ログはまだ少なめです。",
        thoughtNotes: thoughts.length ? `思考メモは${thoughts.length}件あります。考え方のくせに気づく参考になります。` : "思考メモはまだ少なめです。",
        selfCare: care.length ? `セルフケア実行ログは${care.length}件あります。合いやすい行動を見る材料になります。` : "セルフケア実行ログはまだ少なめです。",
        ifThen: ifThen.length ? `If-Then実行ログは${ifThen.length}件あります。整いやすさと実行しやすさを見返せます。` : "If-Then実行ログはまだ少なめです。",
        nextHint: "来月は、入力できる日だけ短く残す形でも十分です。",
      },
    };
  }

  const overall = averageStability !== null
    ? `今月は、記録がある日の安定度が平均${Math.round(averageStability)}%として残っています。記録上の参考情報です。`
    : averageMood !== null
      ? `今月は、気分スコアが平均${averageMood.toFixed(1)}/10として残っています。状態の波を見返す材料にできます。`
      : `今月は${dailyCount}日分の記録があります。状態の波を見返す材料として使えます。`;
  const waveText = averageAnxiety !== null || averageFatigue !== null
    ? `一部の日では、不安感${averageAnxiety !== null ? `平均${averageAnxiety.toFixed(1)}/10` : ""}${averageAnxiety !== null && averageFatigue !== null ? "、" : ""}${averageFatigue !== null ? `疲労度平均${averageFatigue.toFixed(1)}/10` : ""}が記録されています。日ごとの違いを見る材料になります。`
    : "状態の波は、記録が増えるともう少し見えやすくなります。";
  const sleep = averageSleep === null
    ? "睡眠時間は未入力の日が多いため、平均にはしていません。"
    : shortSleepRecords.length
      ? `睡眠時間は記録がある日の平均で${averageSleep.toFixed(1)}時間です。6時間未満の日が${shortSleepRecords.length}日あり、その日は不安感や疲労度が高めに残っている可能性があります${shortSleepAnxiety !== null ? `（不安感平均${shortSleepAnxiety.toFixed(1)}/10）` : ""}。`
      : `睡眠時間は記録がある日の平均で${averageSleep.toFixed(1)}時間です。睡眠が比較的安定している日は、状態を見返す材料になりそうです。`;
  const anxiety = topTrigger !== "記録なし" || topStateTag !== "記録なし"
    ? `状態の波が大きい日は、${topTrigger !== "記録なし" ? `きっかけとして「${topTrigger}」` : ""}${topTrigger !== "記録なし" && topStateTag !== "記録なし" ? "、" : ""}${topStateTag !== "記録なし" ? `状態タグとして「${topStateTag}」` : ""}が記録されています。原因を断定するものではありません。`
    : waveText;
  const activity = activeDays || care.length || ifThen.length
    ? `外出や運動が記録された日は${activeDays}日、セルフケアは${care.length}回、If-Thenは${ifThen.length}回あります。行動と状態の関係を見返す参考になります。`
    : "活動やセルフケアの記録はまだ少なめです。無理に増やすためではなく、ふり返り用の参考情報です。";
  const suddenText = sudden.length
    ? `突発ログは${sudden.length}件あります。よく出たきっかけは「${topTrigger}」、状態タグは「${topStateTag}」です。相談時の材料にできます。`
    : "突発ログはこの月には多くありません。記録がある場合だけ、状態の波を見返す材料にできます。";
  const thoughtText = thoughts.length
    ? `思考メモは${thoughts.length}件あります。よく出た思考タグは「${topThoughtTag}」です${thoughtIntensity !== null ? `。感情の強さは平均${thoughtIntensity.toFixed(1)}/10として残っています` : ""}。責めるためではなく、気づくための参考情報です。`
    : "思考メモはまだ少なめです。考えが頭の中で回る日は、一度メモに置いておけます。";
  const careText = care.length
    ? `セルフケアは${care.length}回記録されています。${settledCare !== "記録なし" ? `「${settledCare}」は整いやすい可能性がある行動として残っています。` : `よく使った行動は「${topSelfCare}」です。`}`
    : "セルフケア実行ログはまだ少なめです。小さな一手を試した日だけ残す形でも大丈夫です。";
  const ifThenText = ifThen.length
    ? `If-Thenプランは${ifThen.length}回実行されています。よく実行したプランは「${topIfThen}」です${ifThenFit !== null ? `。整いやすさ平均は${ifThenFit.toFixed(1)}/10` : ""}${ifThenEase !== null ? `、実行しやすさ平均は${ifThenEase.toFixed(1)}/10` : ""}として残っています。`
    : "If-Then実行ログはまだ少なめです。きっかけが見えたときに、小さな行動を1つ決める材料にできます。";
  const nextHint = topTrigger !== "記録なし"
    ? `来月は、「${topTrigger}」が出たとき用の小さなIf-Thenプランを1つ作ってみると、ふり返りやすくなりそうです。`
    : topSelfCare !== "記録なし"
      ? `来月は、「${topSelfCare}」のように続けやすかった行動を1つだけ残しておくと、整いやすさを見返しやすくなりそうです。`
      : "来月は、整いやすかった行動を1つだけ続けてみると、ふり返りやすくなりそうです。";
  const noteText = notes.length ? `相談ノートも${notes.length}件更新されています。相談時に確認したいことを整理する材料にできます。` : "";
  const summary = [overall, sleep, ifThen.length || care.length ? "セルフケアやIf-Thenの記録も、整いやすい行動を見返す材料になりそうです。" : ""].filter(Boolean).join(" ");

  return {
    summary,
    hasEnoughData,
    topTrigger,
    topStateTag,
    topThoughtTag,
    topSelfCare,
    topIfThen,
    sections: {
      overall: [overall, noteText].filter(Boolean).join(" "),
      sleep,
      anxiety,
      activity,
      suddenLogs: suddenText,
      thoughtNotes: thoughtText,
      selfCare: careText,
      ifThen: ifThenText,
      nextHint,
    },
  };
}

function monthlyReflectionEntries(reflection: MonthlyReflection): Array<[string, string]> {
  return [
    ["全体", reflection.sections.overall],
    ["睡眠", reflection.sections.sleep],
    ["不安感・状態の波", reflection.sections.anxiety],
    ["活動", reflection.sections.activity],
    ["突発ログ", reflection.sections.suddenLogs],
    ["思考メモ", reflection.sections.thoughtNotes],
    ["セルフケア", reflection.sections.selfCare],
    ["If-Then", reflection.sections.ifThen],
    ["来月の小さなヒント", reflection.sections.nextHint],
  ];
}

function monthlyReflectionToText(month: string, reflection: MonthlyReflection) {
  return `月間ふり返りコメント（${formatMonthLabel(month)}）
${reflection.summary}

${monthlyReflectionEntries(reflection).map(([label, text]) => `${label}: ${text}`).join("\n")}

この内容は記録上の傾向です。診断や治療判断ではありません。`;
}

function getHabitSummary(records: DailyRecord[]) {
  const uniqueDates = [...new Set(records.map((record) => record.date))];
  const currentMonth = today().slice(0, 7);
  const monthCount = uniqueDates.filter((date) => date.startsWith(currentMonth)).length;
  const recent7Count = uniqueDates.filter((date) => daysAgo(date) >= 0 && daysAgo(date) < 7).length;
  const weekCount = uniqueDates.filter((date) => daysAgo(date) >= 0 && daysAgo(date) < 7).length;
  const lastDate = [...uniqueDates].sort((a, b) => b.localeCompare(a))[0] || "";
  const commonTime = firstKey(countBy(records.filter((record) => record.createdAt), (record) => timeBucketFromHour(new Date(record.createdAt).getHours())));
  return { monthCount, recent7Count, weekCount, lastDate, commonTime: commonTime === "記録なし" ? "" : commonTime };
}

function shouldShowHabitReminder(settings: HabitSettings, records: DailyRecord[], dismissals: ReminderDismissal[]) {
  if (!settings.enabled) return false;
  if (records.some((record) => record.date === today())) return false;
  if (dismissals.some((item) => item.date === today())) return false;
  return reminderTimePassed(settings);
}

function shouldShowRestartSupport(records: DailyRecord[], dismissals: ReminderDismissal[]) {
  if (records.length === 0) return false;
  if (dismissals.some((item) => item.date === today())) return false;
  const lastDate = getHabitSummary(records).lastDate;
  return lastDate ? daysAgo(lastDate) >= 7 : false;
}

function reminderTimePassed(settings: HabitSettings) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= reminderMinutes(settings);
}

function reminderMinutes(settings: HabitSettings) {
  const defaults: Record<ReminderTimeType, string> = {
    朝: "08:00",
    昼: "12:00",
    夕方: "17:00",
    夜: "20:00",
    自由入力: settings.customReminderTime || "20:00",
  };
  const [hours, minutes] = defaults[settings.reminderTimeType].split(":").map(Number);
  return hours * 60 + minutes;
}

function timeBucketFromHour(hour: number) {
  if (hour < 11) return "朝";
  if (hour < 15) return "昼";
  if (hour < 19) return "夕方";
  return "夜";
}

function weeklyGoalValue(settings: HabitSettings) {
  if (settings.weeklyGoalType === "週に1回") return 1;
  if (settings.weeklyGoalType === "週に3回") return 3;
  if (settings.weeklyGoalType === "カスタム") return clampWeeklyGoal(settings.customWeeklyGoal);
  return null;
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

function calculateInsights(dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[], thoughtNotes: ThoughtNote[] = [], ifThenPlans: IfThenPlan[] = [], ifThenLogs: IfThenLog[] = []) {
  return [
    ...calculateSleepInsights(dailyRecords),
    ...calculateWeatherInsights(dailyRecords),
    ...calculateActivityInsights(dailyRecords),
    ...calculateSocialInsights(dailyRecords),
    ...calculateSuddenLogInsights(suddenLogs),
    ...calculateSelfCareInsights(selfCareLogs),
    ...calculateThoughtInsights(thoughtNotes, dailyRecords),
    ...calculateIfThenInsights(ifThenPlans, ifThenLogs),
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

function calculateThoughtInsights(notes: ThoughtNote[], dailyRecords: DailyRecord[]): Insight[] {
  const recent = notes.filter((note) => daysAgo(note.date) < 30);
  const dailyTags = dailyRecords.filter((record) => daysAgo(record.date) < 30).flatMap((record) => record.thoughtTags || []);
  const tagCounts = countFlat([...recent.flatMap((note) => note.thoughtTags), ...dailyTags]);
  if (recent.length < 3 && dailyTags.length < 3) return [];
  const topTag = tagCounts[0];
  if (!topTag) return [];
  return [{
    id: "thought-tags",
    group: "thought",
    title: "出やすい思考タグが記録されています",
    description: `「${topTag[0]}」が${topTag[1]}件記録されています。状態の波が大きいときに出やすい考え方を見つける材料になります。`,
    relatedCount: topTag[1],
    action: "場面、睡眠、きっかけ、自分にかけたい言葉を一緒に見返すと、相談時の材料にできます。",
    note: "記録上の傾向です。責めるためではなく、気づくための参考情報です。",
  }];
}

function calculateIfThenInsights(plans: IfThenPlan[], logs: IfThenLog[]): Insight[] {
  const recent = logs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < 30);
  if (plans.length < 1 && recent.length < 3) return [];
  const insights: Insight[] = [];
  const activeCount = plans.filter((plan) => plan.isActive).length;
  const topPlan = countBy(recent, (log) => log.planTitle)[0];
  const summaries = summarizeIfThenScores(plans, recent);
  const highFit = summaries.filter((summary) => summary.averageFit !== null && summary.averageFit >= 7).sort((a, b) => b.averageFit! - a.averageFit!)[0];
  const highEase = summaries.filter((summary) => summary.averageEase !== null && summary.averageEase >= 7).sort((a, b) => b.averageEase! - a.averageEase!)[0];
  const notFit = summaries.filter((summary) => summary.averageFit !== null && summary.averageFit <= 3).sort((a, b) => a.averageFit! - b.averageFit!)[0];
  const habitCandidate = summaries.filter((summary) => summary.isHabitCandidate).sort((a, b) => b.logCount - a.logCount)[0];

  if (activeCount > 0) {
    insights.push({
      id: "ifthen-active",
      group: "ifthen",
      title: "小さな行動を先に決めたプランがあります",
      description: `有効なIf-Thenプランが${activeCount}件あります。状態の波があるときの行動候補として使えます。`,
      relatedCount: activeCount,
      action: "最近の状態タグや思考タグと合わせて、使いやすい場面を見返せます。",
      note: "セルフケア補助としての記録上の情報です。",
    });
  }
  if (topPlan && topPlan[1] >= 2) {
    insights.push({
      id: "ifthen-frequent",
      group: "ifthen",
      title: "よく実行しているIf-Thenプランがあります",
      description: `「${topPlan[0]}」が${topPlan[1]}回記録されています。使いやすい可能性があります。`,
      relatedCount: topPlan[1],
      action: "どんなタイミングで実行しやすかったか、メモと一緒に見返せます。",
      note: "記録上の傾向です。必ず合うという意味ではありません。",
    });
  }
  if (highFit) {
    insights.push({
      id: "ifthen-settled",
      group: "ifthen",
      title: "整いやすい可能性があるIf-Thenプランがあります",
      description: `「${highFit.title}」は、平均整いやすさが${highFit.averageFit!.toFixed(1)}/10で記録されています。`,
      relatedCount: highFit.logCount,
      action: "使いやすかった条件を相談時の材料として残せます。",
      note: "参考情報として見てください。効果を断定するものではありません。",
    });
  }
  if (highEase) {
    insights.push({
      id: "ifthen-easy",
      group: "ifthen",
      title: "実行しやすい可能性があるIf-Thenプランがあります",
      description: `「${highEase.title}」は、平均実行しやすさが${highEase.averageEase!.toFixed(1)}/10で記録されています。`,
      relatedCount: highEase.logCount,
      action: "続けやすいタイミングや準備の少なさを見返す材料にできます。",
      note: "記録上の傾向です。無理に続ける必要はありません。",
    });
  }
  if (habitCandidate) {
    insights.push({
      id: "ifthen-habit",
      group: "ifthen",
      title: "習慣化候補として見られるプランがあります",
      description: `「${habitCandidate.title}」は、実行回数と2つの平均スコアが比較的高めに残っています。`,
      relatedCount: habitCandidate.logCount,
      action: "マイプランに残す、少し小さくするなど、続けやすい形を考える材料になります。",
      note: "記録上、このプランは続けやすい可能性があります。",
    });
  }
  if (notFit) {
    insights.push({
      id: "ifthen-not-fit",
      group: "ifthen",
      title: "今の状態では合いにくい日があるかもしれません",
      description: `「${notFit.title}」は、平均整いやすさが${notFit.averageFit!.toFixed(1)}/10で記録されています。`,
      relatedCount: notFit.logCount,
      action: "行動をもっと小さくする、別のタイミングにするなどの候補を考える材料になります。",
      note: "無理に続ける必要はありません。",
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

function nullableAverage(values: Array<number | null | undefined>) {
  const valid = values.filter(isFiniteNumber);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function formatOptionalScore(value: number | null | undefined) {
  return isFiniteNumber(value) ? `${value}/10` : "未記録";
}

function formatIfThenLogScores(log: IfThenLog) {
  return `整いやすさ ${formatOptionalScore(log.fitScore)} / 実行しやすさ ${formatOptionalScore(log.easeScore)}`;
}

type IfThenScoreSummary = {
  planId: string;
  title: string;
  logCount: number;
  averageFit: number | null;
  averageEase: number | null;
  lastRun: string;
  isHabitCandidate: boolean;
};

function summarizeIfThenScores(plans: IfThenPlan[], logs: IfThenLog[]): IfThenScoreSummary[] {
  const planMap = new Map(plans.map((plan) => [plan.id, plan.title]));
  const logsByPlan = groupItems(logs, (log) => log.planId || log.planTitle);
  return Array.from(logsByPlan.entries()).map(([planId, planLogs]) => {
    const sorted = [...planLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const averageFit = nullableAverage(planLogs.map((log) => log.fitScore));
    const averageEase = nullableAverage(planLogs.map((log) => log.easeScore));
    return {
      planId,
      title: planMap.get(planId) || sorted[0]?.planTitle || "If-Thenプラン",
      logCount: planLogs.length,
      averageFit,
      averageEase,
      lastRun: sorted[0]?.createdAt || "",
      isHabitCandidate: planLogs.length >= 3 && averageFit !== null && averageEase !== null && averageFit >= 7 && averageEase >= 7,
    };
  });
}

function isIfThenHabitCandidate(logs: IfThenLog[]) {
  const averageFit = nullableAverage(logs.map((log) => log.fitScore));
  const averageEase = nullableAverage(logs.map((log) => log.easeScore));
  return logs.length >= 3 && averageFit !== null && averageEase !== null && averageFit >= 7 && averageEase >= 7;
}

function ifThenScoreItems(summaries: IfThenScoreSummary[], key: "averageFit" | "averageEase", direction: "high" | "low" = "high") {
  return summaries
    .filter((summary) => summary[key] !== null)
    .sort((a, b) => direction === "high" ? (b[key]! - a[key]!) : (a[key]! - b[key]!))
    .slice(0, 3)
    .map((summary) => [summary.title, summary[key]!.toFixed(1)] as [string, string]);
}

function ifThenHabitItems(summaries: IfThenScoreSummary[]) {
  return summaries
    .filter((summary) => summary.isHabitCandidate)
    .sort((a, b) => b.logCount - a.logCount)
    .slice(0, 3)
    .map((summary) => [summary.title, `${summary.logCount}回`] as [string, string]);
}

function joinIfThenScoreTitles(items: [string, string][], suffix = "/10") {
  return items.length ? items.map(([title, value]) => `${title}（${value}${suffix}）`).join("、") : "記録なし";
}

function firstKey(items: [string, number][]) {
  return items[0]?.[0] || "記録なし";
}

function navGroup(screen: Screen) {
  if (screen === "metricDetail") return "home";
  if (screen === "daily" || screen === "sudden" || screen === "records") return "recordHub";
  if (screen === "analysis" || screen === "report" || screen === "calendar") return "review";
  if (screen === "selfcare" || screen === "ifthen" || screen === "thought" || screen === "consultation" || screen === "data" || screen === "privacy" || screen === "about" || screen === "habit" || screen === "display") return "menu";
  return screen;
}

const staticBackTargets: Partial<Record<Screen, Screen | null>> = {
  metricDetail: "home",
  daily: null,
  sudden: null,
  records: "recordHub",
  analysis: "review",
  report: "review",
  calendar: "review",
  thought: "review",
  ifthen: "menu",
  consultation: "menu",
  data: "menu",
  privacy: "menu",
  about: "menu",
  habit: "menu",
  display: "menu",
};

function backTargetForScreen(screen: Screen): Screen | null {
  return staticBackTargets[screen] ?? null;
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

function createIfThenDraft(prefill: IfThenPrefill = {}): IfThenPlan {
  const timestamp = nowIso();
  return {
    id: newId(),
    title: prefill.title || "",
    ifText: prefill.ifText || "",
    thenText: prefill.thenText || "",
    category: prefill.category || "体を整える",
    relatedStateTags: normalizeStringArray(prefill.relatedStateTags).map(mapLegacyStateTag),
    relatedThoughtTags: normalizeThoughtTags(prefill.relatedThoughtTags),
    ease: "すぐできそう",
    memo: prefill.memo || "",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createIfThenFromSelfCare(plan: SelfCarePlan): IfThenPlan {
  const timestamp = nowIso();
  return {
    id: newId(),
    title: `${plan.title}のIf-Then`,
    ifText: "実行しやすそうなタイミングが来たら",
    thenText: plan.title,
    category: plan.category === "習慣を見直す" ? "その他" : plan.category,
    relatedStateTags: [],
    relatedThoughtTags: [],
    ease: "すぐできそう",
    memo: plan.memo,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createSelfCareFromIfThen(plan: IfThenPlan): SelfCarePlan {
  const timestamp = nowIso();
  const category: SelfCareCategory = selfCareCategories.includes(plan.category as SelfCareCategory) ? (plan.category as SelfCareCategory) : "習慣を見直す";
  return {
    id: newId(),
    title: plan.thenText || plan.title,
    category,
    memo: `If-Thenプランから追加: もし ${plan.ifText} / そのとき ${plan.thenText}`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function hasIfThenDraftContent(plan: IfThenPlan) {
  return Boolean(
    plan.title.trim() ||
      plan.ifText.trim() ||
      plan.thenText.trim() ||
      plan.relatedStateTags.length ||
      plan.relatedThoughtTags.length ||
      plan.memo.trim(),
  );
}

function findIfThenByStateTags(plans: IfThenPlan[], stateTags: string[]) {
  if (!stateTags.length) return [];
  return plans.filter((plan) => plan.isActive && plan.relatedStateTags.some((tag) => stateTags.includes(tag)));
}

function findIfThenByThoughtTags(plans: IfThenPlan[], thoughtTags: string[]) {
  if (!thoughtTags.length) return [];
  return plans.filter((plan) => plan.isActive && plan.relatedThoughtTags.some((tag) => thoughtTags.includes(tag)));
}

function recommendIfThenPlans(plans: IfThenPlan[], logs: IfThenLog[], suddenLogs: SuddenLog[], thoughtNotes: ThoughtNote[]) {
  const active = plans.filter((plan) => plan.isActive);
  const latestSudden = [...suddenLogs].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  const latestThought = [...thoughtNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const matched = [
    ...findIfThenByStateTags(active, latestSudden?.stateTags || []),
    ...findIfThenByThoughtTags(active, latestThought?.thoughtTags || []),
  ];
  const seen = new Set<string>();
  const uniqueMatched = matched.filter((plan) => {
    if (seen.has(plan.id)) return false;
    seen.add(plan.id);
    return true;
  });
  const latestByPlan = new Map<string, string>();
  logs.forEach((log) => {
    const current = latestByPlan.get(log.planId);
    if (!current || log.createdAt > current) latestByPlan.set(log.planId, log.createdAt);
  });
  const summaries = new Map(summarizeIfThenScores(plans, logs).map((summary) => [summary.planId, summary]));
  const fallback = active
    .filter((plan) => !seen.has(plan.id))
    .sort((a, b) => {
      const aSummary = summaries.get(a.id);
      const bSummary = summaries.get(b.id);
      const aScore = (aSummary?.averageFit || 0) + (aSummary?.averageEase || 0);
      const bScore = (bSummary?.averageFit || 0) + (bSummary?.averageEase || 0);
      if (bScore !== aScore) return bScore - aScore;
      return (latestByPlan.get(a.id) || "").localeCompare(latestByPlan.get(b.id) || "");
    });
  return [...uniqueMatched, ...fallback];
}

function buildConsultationSummary(period: number, dailyRecords: DailyRecord[], suddenLogs: SuddenLog[], selfCareLogs: SelfCareLog[], thoughtNotes: ThoughtNote[], ifThenPlans: IfThenPlan[], ifThenLogs: IfThenLog[], notes: ConsultationNote[]) {
  const daily = dailyRecords.filter((record) => daysAgo(record.date) < period);
  const sudden = suddenLogs.filter((log) => daysAgo(log.occurredAt.slice(0, 10)) < period);
  const care = selfCareLogs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < period);
  const thoughts = thoughtNotes.filter((note) => daysAgo(note.date) < period);
  const ifThenInPeriod = ifThenLogs.filter((log) => daysAgo(log.createdAt.slice(0, 10)) < period);
  const insights = calculateInsights(daily, sudden, care, thoughts, ifThenPlans, ifThenInPeriod);
  const waveDays = daily.filter(hasLargeWaveScore).map((record) => record.date).join("、") || "目立つ記録なし";
  const topTags = countFlat(sudden.flatMap((log) => log.stateTags)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topTriggers = countFlat(sudden.flatMap((log) => log.triggers)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topSymptoms = countFlat(sudden.flatMap((log) => log.symptoms)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topCare = countBy(care, (log) => log.title).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const settledCare = countBy(care.filter((log) => log.result === "少し整った"), (log) => log.title).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topThoughtTags = countFlat([
    ...thoughts.flatMap((note) => note.thoughtTags),
    ...daily.flatMap((record) => record.thoughtTags || []),
  ]).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topThoughtSituations = countBy(thoughts.filter((note) => note.situation.trim()), (note) => note.situation.trim()).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const thoughtIntensity = formatAverageWithSuffix(formatAverage(thoughts.map((note) => note.intensity)), "/10");
  const compassionLines = thoughts.filter((note) => note.selfCompassion.trim()).slice(0, 3).map((note) => `- ${note.selfCompassion}`).join("\n") || "記録なし";
  const activeIfThen = ifThenPlans.filter((plan) => plan.isActive).slice(0, 5).map((plan) => `- ${plan.title}: もし ${plan.ifText} / そのとき ${plan.thenText}`).join("\n") || "記録なし";
  const topIfThen = countBy(ifThenInPeriod, (log) => log.planTitle).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const ifThenSummaries = summarizeIfThenScores(ifThenPlans, ifThenInPeriod);
  const highFitIfThen = joinIfThenScoreTitles(ifThenScoreItems(ifThenSummaries, "averageFit"));
  const highEaseIfThen = joinIfThenScoreTitles(ifThenScoreItems(ifThenSummaries, "averageEase"));
  const habitIfThen = ifThenHabitItems(ifThenSummaries).map(([title, count]) => `${title}（${count}）`).join("、") || "記録なし";
  const notFitIfThen = joinIfThenScoreTitles(
    ifThenSummaries
      .filter((summary) => summary.averageFit !== null && summary.averageFit <= 3)
      .sort((a, b) => a.averageFit! - b.averageFit!)
      .slice(0, 3)
      .map((summary) => [summary.title, summary.averageFit!.toFixed(1)] as [string, string]),
  );
  const noteLines = notes.length
    ? notes.slice(0, 8).map((note) => `- ${note.title || "相談メモ"}（${targetLabel(note.target)} / ${statusLabel(note.status)}）: ${note.mainTopic || note.recentConcern || note.dontForgetMemo || "内容未記入"}`).join("\n")
    : "相談メモはまだありません。";
  const insightLines = insights.length
    ? insights.slice(0, 6).map((insight) => `- ${insight.title}: ${insight.description} ${insight.note}`).join("\n")
    : "記録が少ないため、傾向は参考程度です。もう少し記録が増えると、状態の波が見えやすくなります。";
  const todayStability = calculateStabilityScore(today(), dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs);
  const stabilitySummary = summarizeStabilityPeriod(period, dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs);
  const monthlyReflection = generateMonthlyReflection(today().slice(0, 7), dailyRecords, suddenLogs, selfCareLogs, thoughtNotes, ifThenPlans, ifThenLogs, notes);

  return `以下は、過去${period}日間のセルフ記録をもとにした相談用メモです。診断や治療判断ではなく、相談時に状態を伝えるための参考情報として作成しています。

期間内の気分平均: ${formatAverageWithSuffix(formatAverage(daily.map((record) => record.mood)), "/10")}
期間内の不安感平均: ${formatAverageWithSuffix(formatAverage(daily.map((record) => record.anxiety)), "/10")}
睡眠時間の平均: ${formatAverageWithSuffix(formatAverage(validSleepHours(daily)), "時間")}
今日の安定度: ${todayStability.score === null ? "記録待ち" : `${todayStability.score}%`}
期間平均の安定度: ${stabilitySummary.average === null ? "記録なし" : `${stabilitySummary.average}%`}
安定度を支えていた要素: ${stabilitySummary.supportText}
状態の波を見返す材料: ${stabilitySummary.waveText}
状態の波が大きかった日: ${waveDays}
多かった状態タグ: ${topTags}
多かったきっかけ: ${topTriggers}
多かった身体のサイン: ${topSymptoms}
よく使ったセルフケア: ${topCare}
整いやすい可能性があったセルフケア: ${settledCare}
よく出た思考タグ: ${topThoughtTags}
よく出た場面: ${topThoughtSituations}
感情の強さの傾向: ${thoughtIntensity}
自分にかけたい言葉:
${compassionLines}
作成しているIf-Thenプラン:
${activeIfThen}
よく実行したIf-Thenプラン: ${topIfThen}
平均整いやすさが高いIf-Thenプラン: ${highFitIfThen}
平均実行しやすさが高いIf-Thenプラン: ${highEaseIfThen}
習慣化候補のIf-Thenプラン: ${habitIfThen}
今は合いにくかったIf-Thenプラン: ${notFitIfThen}

記録から見える傾向:
${insightLines}

月間ふり返りコメント:
${monthlyReflectionToText(today().slice(0, 7), monthlyReflection)}

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
思考の傾向として整理し、本人を責める表現は避けてください。
If-Thenプランはセルフケア補助として扱い、本人を責める表現は避けてください。
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

function defaultHabitSettings(): HabitSettings {
  return {
    enabled: false,
    reminderTimeType: "夜",
    customReminderTime: "20:00",
    reminderMessage: defaultReminderMessages[0],
    weeklyGoalType: "できる日に記録する",
    customWeeklyGoal: 1,
    updatedAt: nowIso(),
  };
}

function normalizeHabitSettings(settings?: Partial<HabitSettings>): HabitSettings {
  const defaults = defaultHabitSettings();
  return {
    enabled: Boolean(settings?.enabled),
    reminderTimeType: reminderTimeTypes.includes(settings?.reminderTimeType as ReminderTimeType) ? (settings?.reminderTimeType as ReminderTimeType) : defaults.reminderTimeType,
    customReminderTime: typeof settings?.customReminderTime === "string" && /^\d{2}:\d{2}$/.test(settings.customReminderTime) ? settings.customReminderTime : defaults.customReminderTime,
    reminderMessage: typeof settings?.reminderMessage === "string" && settings.reminderMessage.trim() ? settings.reminderMessage : defaults.reminderMessage,
    weeklyGoalType: weeklyGoalTypes.includes(settings?.weeklyGoalType as WeeklyGoalType) ? (settings?.weeklyGoalType as WeeklyGoalType) : defaults.weeklyGoalType,
    customWeeklyGoal: clampWeeklyGoal(settings?.customWeeklyGoal ?? defaults.customWeeklyGoal),
    updatedAt: settings?.updatedAt || nowIso(),
    ...sampleMetaFrom(settings),
  };
}

function isDefaultHabitSettings(settings: HabitSettings) {
  return !settings.enabled
    && settings.reminderTimeType === "夜"
    && settings.customReminderTime === "20:00"
    && settings.reminderMessage === defaultReminderMessages[0]
    && settings.weeklyGoalType === "できる日に記録する"
    && settings.customWeeklyGoal === 1;
}

function normalizeReminderDismissal(item: Partial<ReminderDismissal>): ReminderDismissal | null {
  if (!item.date || !item.dismissedAt) return null;
  return { date: item.date, dismissedAt: item.dismissedAt };
}

function clampWeeklyGoal(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(7, Math.max(1, Math.round(value)));
}

function defaultDisplaySettings(): DisplaySettings {
  return {
    theme: "standard",
    fontSize: "standard",
    updatedAt: nowIso(),
  };
}

function normalizeDisplaySettings(settings?: Partial<DisplaySettings>): DisplaySettings {
  return {
    theme: displayThemes.includes(settings?.theme as DisplayTheme) ? (settings?.theme as DisplayTheme) : "standard",
    fontSize: displayFontSizes.includes(settings?.fontSize as DisplayFontSize) ? (settings?.fontSize as DisplayFontSize) : "standard",
    updatedAt: settings?.updatedAt || nowIso(),
  };
}

function displayThemeLabel(theme: DisplayTheme) {
  if (theme === "soft") return "やわらかめ";
  if (theme === "clear") return "くっきり";
  return "標準";
}

function displayThemeFromLabel(label: string): DisplayTheme {
  if (label === "やわらかめ") return "soft";
  if (label === "くっきり") return "clear";
  return "standard";
}

function displayFontSizeLabel(size: DisplayFontSize) {
  if (size === "large") return "大きめ";
  if (size === "xlarge") return "さらに大きめ";
  return "標準";
}

function displayFontSizeFromLabel(label: string): DisplayFontSize {
  if (label === "大きめ") return "large";
  if (label === "さらに大きめ") return "xlarge";
  return "standard";
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
      ifThenPlans: [],
      ifThenLogs: [],
      consultationNotes: [],
      thoughtNotes: [],
      privacySettings: toBackupPrivacySettings(defaultPrivacySettings()),
      habitSettings: defaultHabitSettings(),
      reminderDismissals: [],
      displaySettings: defaultDisplaySettings(),
      demoDisplaySettings: defaultDemoDisplaySettings(),
    };
  }

  if (!data || typeof data !== "object") throw new Error("Invalid backup");
  const source = data as {
    dailyRecords?: Partial<DailyRecord>[];
    suddenLogs?: Partial<SuddenLog>[];
    selfCarePlans?: Partial<SelfCarePlan>[];
    selfCareLogs?: Partial<SelfCareLog>[];
    ifThenPlans?: Partial<IfThenPlan>[];
    ifThenLogs?: Array<Partial<IfThenLog> & { result?: SelfCareResult }>;
    consultationNotes?: Partial<ConsultationNote>[];
    thoughtNotes?: Partial<ThoughtNote>[];
    privacySettings?: BackupPrivacySettings;
    habitSettings?: Partial<HabitSettings>;
    reminderDismissals?: Partial<ReminderDismissal>[];
    displaySettings?: Partial<DisplaySettings>;
    demoDisplaySettings?: Partial<DemoDisplaySettings>;
    daily?: Partial<DailyRecord>[];
    sudden?: Partial<SuddenLog>[];
  };
  const daily = source.dailyRecords || source.daily;
  const sudden = source.suddenLogs || source.sudden;
  const plans = source.selfCarePlans || [];
  const logs = source.selfCareLogs || [];
  const ifThenPlans = source.ifThenPlans || [];
  const ifThenLogs = source.ifThenLogs || [];
  const notes = source.consultationNotes || [];
  const thoughtNotes = source.thoughtNotes || [];
  if (!Array.isArray(daily) || !Array.isArray(sudden)) throw new Error("Invalid backup");

  return {
    app: { name: "Self Compass", version: appVersion, exportedAt: nowIso() },
    dailyRecords: daily.map(normalizeDailyRecord),
    suddenLogs: sudden.map(normalizeSuddenLog),
    selfCarePlans: Array.isArray(plans) ? plans.map(normalizeSelfCarePlan) : [],
    selfCareLogs: Array.isArray(logs) ? logs.map(normalizeSelfCareLog) : [],
    ifThenPlans: Array.isArray(ifThenPlans) ? ifThenPlans.map(normalizeIfThenPlan) : [],
    ifThenLogs: Array.isArray(ifThenLogs) ? ifThenLogs.map(normalizeIfThenLog) : [],
    consultationNotes: Array.isArray(notes) ? notes.map(normalizeConsultationNote) : [],
    thoughtNotes: Array.isArray(thoughtNotes) ? thoughtNotes.map(normalizeThoughtNote) : [],
    privacySettings: source.privacySettings ? {
      isLockEnabled: false,
      autoLockMinutes: normalizeAutoLock(source.privacySettings.autoLockMinutes),
      privateDisplayMode: Boolean(source.privacySettings.privateDisplayMode),
      passcodeIncluded: false,
      updatedAt: source.privacySettings.updatedAt || nowIso(),
    } : toBackupPrivacySettings(defaultPrivacySettings()),
    habitSettings: normalizeHabitSettings(source.habitSettings),
    reminderDismissals: Array.isArray(source.reminderDismissals) ? source.reminderDismissals.map(normalizeReminderDismissal).filter(Boolean) as ReminderDismissal[] : [],
    displaySettings: normalizeDisplaySettings(source.displaySettings),
    demoDisplaySettings: normalizeDemoDisplaySettings(source.demoDisplaySettings),
  };
}

function toDailyCsv(records: DailyRecord[]) {
  const rows = [
    ["記録日", "気分", "不安度", "イライラ度", "疲労度", "睡眠時間", "睡眠の質", "天気", "食事", "運動", "外出", "人との接触", "薬・サプリ", "思考タグ", "今日の主な出来事", "今日のメモ"],
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
      (record.thoughtTags || []).join("、"),
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

function toThoughtCsv(notes: ThoughtNote[]) {
  const rows = [
    ["発生日", "場面", "頭に浮かんだ考え", "感情", "感情の強さ", "思考タグ", "別の見方メモ", "自分にかけたい言葉", "関連する行動", "メモ"],
    ...notes.map((note) => [
      note.date,
      note.situation,
      note.thought,
      note.emotion,
      note.intensity ?? "未入力",
      note.thoughtTags.join("、"),
      note.alternativeView,
      note.selfCompassion,
      note.relatedAction,
      note.memo,
    ]),
  ];
  return `\uFEFF${rows.map(csvRow).join("\n")}`;
}

function toIfThenPlansCsv(plans: IfThenPlan[]) {
  const rows = [
    ["タイトル", "もし", "そのとき", "カテゴリ", "関連状態タグ", "関連思考タグ", "実行しやすさ", "有効状態", "メモ", "作成日", "更新日"],
    ...plans.map((plan) => [
      plan.title,
      plan.ifText,
      plan.thenText,
      plan.category,
      plan.relatedStateTags.join("、"),
      plan.relatedThoughtTags.join("、"),
      plan.ease,
      plan.isActive ? "有効" : "一時停止",
      plan.memo,
      formatDateTime(plan.createdAt),
      formatDateTime(plan.updatedAt),
    ]),
  ];
  return `\uFEFF${rows.map(csvRow).join("\n")}`;
}

function toIfThenLogsCsv(logs: IfThenLog[]) {
  const rows = [
    ["実行日時", "プランタイトル", "もし", "そのとき", "整いやすさ", "実行しやすさ", "旧形式の感じ方", "メモ"],
    ...logs.map((log) => [
      formatDateTime(log.createdAt),
      log.planTitle,
      log.ifText,
      log.thenText,
      log.fitScore ?? "未記録",
      log.easeScore ?? "未記録",
      log.legacyResult || "",
      log.memo,
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
    thoughtTags: normalizeThoughtTags(record.thoughtTags),
    createdAt: timestamp,
    updatedAt: record.updatedAt || timestamp,
    ...sampleMetaFrom(record),
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
    ...sampleMetaFrom(log),
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
    ...sampleMetaFrom(plan),
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
    ...sampleMetaFrom(log),
  };
}

function normalizeIfThenPlan(plan: Partial<IfThenPlan>): IfThenPlan {
  const timestamp = plan.createdAt || nowIso();
  return {
    id: plan.id || newId(),
    title: plan.title || "If-Thenプラン",
    ifText: plan.ifText || "",
    thenText: plan.thenText || "",
    category: normalizeIfThenCategory(plan.category),
    relatedStateTags: normalizeStringArray(plan.relatedStateTags).map(mapLegacyStateTag),
    relatedThoughtTags: normalizeThoughtTags(plan.relatedThoughtTags),
    ease: normalizeIfThenEase(plan.ease),
    memo: plan.memo || "",
    isActive: plan.isActive ?? true,
    createdAt: timestamp,
    updatedAt: plan.updatedAt || timestamp,
    ...sampleMetaFrom(plan),
  };
}

function normalizeIfThenLog(log: Partial<IfThenLog> & { result?: SelfCareResult }): IfThenLog {
  const legacyResult = log.legacyResult || log.result;
  return {
    id: log.id || newId(),
    planId: log.planId || "",
    planTitle: log.planTitle || "If-Thenプラン",
    ifText: log.ifText || "",
    thenText: log.thenText || "",
    fitScore: normalizeOptionalScore(log.fitScore ?? legacyResultToFitScore(legacyResult)),
    easeScore: normalizeOptionalScore(log.easeScore),
    legacyResult: legacyResult ? normalizeSelfCareResult(legacyResult) : undefined,
    memo: log.memo || "",
    createdAt: log.createdAt || nowIso(),
    ...sampleMetaFrom(log),
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
    ...sampleMetaFrom(note),
  };
}

function normalizeThoughtNote(note: Partial<ThoughtNote>): ThoughtNote {
  const timestamp = note.createdAt || nowIso();
  return {
    id: note.id || newId(),
    date: note.date || today(),
    situation: note.situation || "",
    thought: note.thought || "",
    emotion: note.emotion || "",
    intensity: normalizeScore(note.intensity),
    thoughtTags: normalizeThoughtTags(note.thoughtTags),
    alternativeView: note.alternativeView || "",
    selfCompassion: note.selfCompassion || "",
    relatedAction: note.relatedAction || "",
    memo: note.memo || "",
    sourceLogId: note.sourceLogId,
    createdAt: timestamp,
    updatedAt: note.updatedAt || timestamp,
    ...sampleMetaFrom(note),
  };
}

function normalizeSelfCareCategory(category?: string): SelfCareCategory {
  return selfCareCategories.includes(category as SelfCareCategory) ? (category as SelfCareCategory) : "体を整える";
}

function normalizeIfThenCategory(category?: string): IfThenCategory {
  return ifThenCategories.includes(category as IfThenCategory) ? (category as IfThenCategory) : "その他";
}

function normalizeIfThenEase(ease?: string): IfThenEase {
  if (ease === "今は難しいかも") return "今は小さくした方がよさそう";
  return ifThenEaseOptions.includes(ease as IfThenEase) ? (ease as IfThenEase) : "すぐできそう";
}

function normalizeSelfCareResult(result?: string): SelfCareResult {
  const options: SelfCareResult[] = ["少し整った", "変化は少なめ", "今は合わなかった", "後で振り返る"];
  return options.includes(result as SelfCareResult) ? (result as SelfCareResult) : "後で振り返る";
}

function normalizeScore(value: unknown) {
  if (!isFiniteNumber(value)) return null;
  return Math.min(10, Math.max(1, Math.round(value)));
}

function normalizeOptionalScore(value: unknown) {
  if (!isFiniteNumber(value)) return null;
  return Math.min(10, Math.max(1, Math.round(value)));
}

function legacyResultToFitScore(result?: SelfCareResult) {
  if (result === "今は合わなかった") return 2;
  if (result === "変化は少なめ") return 5;
  if (result === "少し整った") return 7;
  return null;
}

function normalizeStateTags(tags?: string[], legacyState?: string) {
  const source = tags?.length ? tags : legacyState ? [legacyState] : [];
  return source.map(mapLegacyStateTag).filter(Boolean);
}

function normalizeThoughtTags(tags?: string[]) {
  return Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string" && tag.trim()).map((tag) => tag.trim()) : [];
}

function normalizeStringArray(values?: string[]) {
  return Array.isArray(values) ? values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()) : [];
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

function shortText(text: string, maxLength = 42) {
  if (!text) return "未記入";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type RootElement = HTMLElement & { selfCompassRoot?: ReturnType<typeof createRoot> };

const rootElement = document.getElementById("root") as RootElement;
const root = rootElement.selfCompassRoot || createRoot(rootElement);
rootElement.selfCompassRoot = root;

root.render(
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
