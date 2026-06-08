import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type SleepQuality = "良い" | "普通" | "悪い";
type DailyChoice = "晴れ" | "曇り" | "雨" | "雪" | "その他";
type RiskLevel = "低" | "中" | "高";

type DailyRecord = {
  id: string;
  date: string;
  mood: number;
  anxiety: number;
  irritability: number;
  fatigue: number;
  sleepHours: number;
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
  stateType: string;
  intensity: number;
  riskLevel: RiskLevel;
  triggers: string[];
  place: string;
  symptoms: string[];
  thoughts: string;
  actions: string[];
  afterChange: "変わらない" | "少し落ち着いた" | "かなり落ち着いた" | "悪化した";
  memo: string;
  createdAt: string;
  updatedAt: string;
};

type Screen = "home" | "daily" | "sudden" | "analysis" | "report";

const dailyStorageKey = "self-compass-daily-records";
const suddenStorageKey = "self-compass-sudden-logs";

const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();
const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const stateTypes = ["強い不安", "パニック", "怒り", "涙が止まらない", "無気力", "焦り", "孤独感", "希死念慮", "自傷衝動", "過食衝動", "その他"];
const triggerOptions = ["仕事", "LINE・メッセージ", "SNS", "家族", "恋人・パートナー", "友人", "体調不良", "睡眠不足", "天気", "お金", "将来への不安", "理由が分からない", "その他"];
const placeOptions = ["自宅", "外", "職場", "車内", "電車", "店", "その他"];
const symptomOptions = ["動悸", "息苦しさ", "胸の圧迫感", "吐き気", "頭痛", "腹痛", "震え", "涙", "だるさ", "その他"];
const actionOptions = ["寝た", "散歩した", "深呼吸した", "入浴した", "誰かに連絡した", "薬を飲んだ", "食べた", "泣いた", "何もしなかった", "その他"];
const dangerWords = ["死にたい", "消えたい", "自傷", "もう無理", "薬を大量に飲む", "飛び降りる", "首を吊る"];

function readStorage<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>(() => readStorage<DailyRecord>(dailyStorageKey));
  const [suddenLogs, setSuddenLogs] = useState<SuddenLog[]>(() => readStorage<SuddenLog>(suddenStorageKey));
  const [editingDaily, setEditingDaily] = useState<DailyRecord | null>(null);
  const [editingSudden, setEditingSudden] = useState<SuddenLog | null>(null);
  const [flash, setFlash] = useState("");

  const saveDaily = (record: DailyRecord) => {
    const next = dailyRecords.some((item) => item.id === record.id)
      ? dailyRecords.map((item) => (item.id === record.id ? record : item))
      : [record, ...dailyRecords];
    setDailyRecords(next);
    localStorage.setItem(dailyStorageKey, JSON.stringify(next));
    setEditingDaily(null);
    setFlash("今日の記録を保存しました");
    setScreen("home");
  };

  const saveSudden = (log: SuddenLog) => {
    const next = suddenLogs.some((item) => item.id === log.id)
      ? suddenLogs.map((item) => (item.id === log.id ? log : item))
      : [log, ...suddenLogs];
    setSuddenLogs(next);
    localStorage.setItem(suddenStorageKey, JSON.stringify(next));
    setEditingSudden(null);
    setFlash("突発ログを保存しました");
    setScreen("home");
  };

  const deleteDaily = (id: string) => {
    const next = dailyRecords.filter((record) => record.id !== id);
    setDailyRecords(next);
    localStorage.setItem(dailyStorageKey, JSON.stringify(next));
  };

  const deleteSudden = (id: string) => {
    const next = suddenLogs.filter((log) => log.id !== id);
    setSuddenLogs(next);
    localStorage.setItem(suddenStorageKey, JSON.stringify(next));
  };

  return (
    <div className="app-shell">
      <main className="screen">
        {screen === "home" && (
          <Home
            dailyRecords={dailyRecords}
            suddenLogs={suddenLogs}
            flash={flash}
            onDaily={() => {
              setFlash("");
              setEditingDaily(dailyRecords.find((record) => record.date === today()) || null);
              setScreen("daily");
            }}
            onSudden={() => {
              setFlash("");
              setEditingSudden(null);
              setScreen("sudden");
            }}
          />
        )}
        {screen === "daily" && <DailyForm key={editingDaily?.id || "new-daily"} initial={editingDaily} onSave={saveDaily} onCancel={() => setScreen("home")} />}
        {screen === "sudden" && <SuddenForm key={editingSudden?.id || "new-sudden"} initial={editingSudden} onSave={saveSudden} onCancel={() => setScreen("home")} />}
        {screen === "analysis" && <Analysis dailyRecords={dailyRecords} suddenLogs={suddenLogs} />}
        {screen === "report" && <Report dailyRecords={dailyRecords} suddenLogs={suddenLogs} />}

        {screen === "daily" && (
          <History title="日々の記録" records={dailyRecords} onEdit={(record) => setEditingDaily(record)} onDelete={deleteDaily} />
        )}
        {screen === "sudden" && (
          <SuddenHistory records={suddenLogs} onEdit={(log) => setEditingSudden(log)} onDelete={deleteSudden} />
        )}
      </main>
      <nav className="bottom-nav" aria-label="主要ナビゲーション">
        {[
          ["home", "ホーム"],
          ["daily", "今日の記録"],
          ["sudden", "突発ログ"],
          ["analysis", "分析"],
          ["report", "レポート"],
        ].map(([id, label]) => (
          <button
            className={screen === id ? "active" : ""}
            key={id}
            onClick={() => {
              setFlash("");
              setScreen(id as Screen);
            }}
          >
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Home({ dailyRecords, suddenLogs, flash, onDaily, onSudden }: { dailyRecords: DailyRecord[]; suddenLogs: SuddenLog[]; flash: string; onDaily: () => void; onSudden: () => void }) {
  const todayRecord = dailyRecords.find((record) => record.date === today());
  const weekRecords = dailyRecords.filter((record) => daysAgo(record.date) <= 6);
  const weekLogs = suddenLogs.filter((log) => daysAgo(log.occurredAt.slice(0, 10)) <= 6);

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

      <section className="status-panel">
        <div>
          <p className="label">今日の記録</p>
          <h2>{todayRecord ? "記録済み" : "まだ未記録"}</h2>
        </div>
        <div className="quick-grid">
          <Metric label="気分" value={todayRecord ? `${todayRecord.mood}/10` : "-"} />
          <Metric label="不安" value={todayRecord ? `${todayRecord.anxiety}/10` : "-"} />
          <Metric label="睡眠" value={todayRecord ? `${todayRecord.sleepHours}h` : "-"} />
        </div>
      </section>

      <div className="action-stack">
        <button className="urgent-btn" onClick={onSudden}>今つらい・突発ログを記録</button>
        <button className="primary-btn" onClick={onDaily}>今日の記録をする</button>
      </div>

      <section className="section-block">
        <h2>直近7日間</h2>
        <div className="summary-list">
          <Metric label="記録日数" value={`${weekRecords.length}日`} />
          <Metric label="平均気分" value={formatAverage(weekRecords.map((record) => record.mood))} />
          <Metric label="平均不安" value={formatAverage(weekRecords.map((record) => record.anxiety))} />
          <Metric label="突発ログ" value={`${weekLogs.length}件`} />
        </div>
      </section>
    </section>
  );
}

function DailyForm({ initial, onSave, onCancel }: { initial: DailyRecord | null; onSave: (record: DailyRecord) => void; onCancel: () => void }) {
  const [form, setForm] = useState<DailyRecord>(
    initial || {
      id: newId(),
      date: today(),
      mood: 5,
      anxiety: 5,
      irritability: 5,
      fatigue: 5,
      sleepHours: 7,
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

  return (
    <section>
      <FormHead title="今日の記録" sub="その日全体の状態を記録します" onCancel={onCancel} />
      <div className="form-card">
        <FormSection title="基本スコア">
          <label className="field">
            <span>記録日</span>
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <ScoreField label="気分" value={form.mood} onChange={(mood) => setForm({ ...form, mood })} />
          <ScoreField label="不安度" value={form.anxiety} onChange={(anxiety) => setForm({ ...form, anxiety })} />
          <ScoreField label="イライラ度" value={form.irritability} onChange={(irritability) => setForm({ ...form, irritability })} />
          <ScoreField label="疲労度" value={form.fatigue} onChange={(fatigue) => setForm({ ...form, fatigue })} />
        </FormSection>

        <FormSection title="睡眠と生活">
          <label className="field">
            <span>睡眠時間</span>
            <input type="number" min="0" max="24" step="0.5" value={form.sleepHours} onChange={(event) => setForm({ ...form, sleepHours: Number(event.target.value) })} />
          </label>
          <Choice label="睡眠の質" options={["良い", "普通", "悪い"]} value={form.sleepQuality} onChange={(sleepQuality) => setForm({ ...form, sleepQuality: sleepQuality as SleepQuality })} />
          <Choice label="天気" options={["晴れ", "曇り", "雨", "雪", "その他"]} value={form.weather} onChange={(weather) => setForm({ ...form, weather: weather as DailyChoice })} />
          <Choice label="食事" options={["しっかり食べた", "普通", "少ない", "食べていない"]} value={form.meal} onChange={(meal) => setForm({ ...form, meal: meal as DailyRecord["meal"] })} />
          <Choice label="運動" options={["なし", "散歩", "軽い運動", "筋トレ", "その他"]} value={form.exercise} onChange={(exercise) => setForm({ ...form, exercise: exercise as DailyRecord["exercise"] })} />
          <Choice label="外出" options={["あり", "なし"]} value={form.wentOut} onChange={(wentOut) => setForm({ ...form, wentOut: wentOut as DailyRecord["wentOut"] })} />
          <Choice label="人との接触" options={["多い", "普通", "少ない", "なし"]} value={form.socialContact} onChange={(socialContact) => setForm({ ...form, socialContact: socialContact as DailyRecord["socialContact"] })} />
          <Choice label="薬・サプリ" options={["飲んだ", "飲んでいない", "該当なし"]} value={form.medicine} onChange={(medicine) => setForm({ ...form, medicine: medicine as DailyRecord["medicine"] })} />
        </FormSection>

        <FormSection title="できごと・メモ">
          <TextArea label="今日の主な出来事" value={form.events} onChange={(events) => setForm({ ...form, events })} />
          <TextArea label="今日のメモ" value={form.memo} onChange={(memo) => setForm({ ...form, memo })} />
        </FormSection>
      </div>
      <button className="primary-btn sticky-save" onClick={() => onSave({ ...form, updatedAt: nowIso() })}>保存する</button>
    </section>
  );
}

function SuddenForm({ initial, onSave, onCancel }: { initial: SuddenLog | null; onSave: (log: SuddenLog) => void; onCancel: () => void }) {
  const [form, setForm] = useState<SuddenLog>(
    initial || {
      id: newId(),
      occurredAt: nowIso(),
      stateType: "強い不安",
      intensity: 5,
      riskLevel: "低",
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
  const showDanger = form.riskLevel === "高" || ["希死念慮", "自傷衝動"].includes(form.stateType) || dangerWords.some((word) => `${form.memo} ${form.thoughts}`.includes(word));

  return (
    <section>
      <FormHead title="突発ログ" sub="急につらくなった瞬間だけを記録します" onCancel={onCancel} />
      {showDanger && <DangerNotice />}
      <div className="form-card">
        <FormSection title="まず記録">
          <label className="field">
            <span>発生日時</span>
            <input type="datetime-local" value={toDateTimeLocal(form.occurredAt)} onChange={(event) => setForm({ ...form, occurredAt: new Date(event.target.value).toISOString() })} />
          </label>
          <Choice label="状態の種類" options={stateTypes} value={form.stateType} onChange={(stateType) => setForm({ ...form, stateType })} />
          <ScoreField label="強さ" value={form.intensity} onChange={(intensity) => setForm({ ...form, intensity })} />
          <Choice label="危険度" options={["低", "中", "高"]} value={form.riskLevel} onChange={(riskLevel) => setForm({ ...form, riskLevel: riskLevel as RiskLevel })} />
        </FormSection>

        <FormSection title="状況">
          <MultiChoice label="直前にあったこと" options={triggerOptions} values={form.triggers} onChange={(triggers) => setForm({ ...form, triggers })} />
          <Choice label="場所" options={placeOptions} value={form.place} onChange={(place) => setForm({ ...form, place })} />
          <MultiChoice label="身体症状" options={symptomOptions} values={form.symptoms} onChange={(symptoms) => setForm({ ...form, symptoms })} />
          <TextArea label="頭に浮かんだ言葉・思考" value={form.thoughts} onChange={(thoughts) => setForm({ ...form, thoughts })} />
        </FormSection>

        <FormSection title="対処">
          <MultiChoice label="実際に取った行動" options={actionOptions} values={form.actions} onChange={(actions) => setForm({ ...form, actions })} />
          <Choice label="対処後の変化" options={["変わらない", "少し落ち着いた", "かなり落ち着いた", "悪化した"]} value={form.afterChange} onChange={(afterChange) => setForm({ ...form, afterChange: afterChange as SuddenLog["afterChange"] })} />
        </FormSection>

        <FormSection title="任意メモ">
          <TextArea label="メモ" helper="書けるときだけで大丈夫です" value={form.memo} onChange={(memo) => setForm({ ...form, memo })} />
        </FormSection>
      </div>
      <button className="urgent-btn sticky-save" onClick={() => onSave({ ...form, updatedAt: nowIso() })}>突発ログを保存</button>
    </section>
  );
}

function Analysis({ dailyRecords, suddenLogs }: { dailyRecords: DailyRecord[]; suddenLogs: SuddenLog[] }) {
  const sortedDaily = [...dailyRecords].sort((a, b) => a.date.localeCompare(b.date));
  const highDaily = sortedDaily.slice(-14);
  const weatherMood = groupedAverage(dailyRecords, (record) => record.weather, (record) => record.mood);
  const exerciseMood = groupedAverage(dailyRecords, (record) => (record.exercise === "なし" ? "運動なし" : "運動あり"), (record) => record.mood);
  const sleepLow = dailyRecords.filter((record) => record.sleepHours < 6);
  const sleepOk = dailyRecords.filter((record) => record.sleepHours >= 6);
  const suddenByType = countBy(suddenLogs, (log) => log.stateType);
  const riskCounts = countBy(suddenLogs, (log) => log.riskLevel);
  const triggerCounts = countFlat(suddenLogs.flatMap((log) => log.triggers));
  const symptomCounts = countFlat(suddenLogs.flatMap((log) => log.symptoms));
  const helpfulActions = countFlat(suddenLogs.filter((log) => log.afterChange.includes("落ち着いた")).flatMap((log) => log.actions));
  const dayCounts = countBy(suddenLogs, (log) => ["日", "月", "火", "水", "木", "金", "土"][new Date(log.occurredAt).getDay()]);
  const hourCounts = countBy(suddenLogs, (log) => `${new Date(log.occurredAt).getHours()}時台`);

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">記録上の傾向です</p>
        <h1>分析</h1>
      </header>
      <p className="soft-text">断定ではなく、関連している可能性があります。医師や専門家に相談する材料として使えます。</p>

      <section className="section-block">
        <h2>日々の記録</h2>
        {dailyRecords.length === 0 ? (
          <EmptyState text="まだ記録がありません" />
        ) : (
          <>
            <div className="summary-list">
              <Metric label="平均気分" value={`${formatAverage(dailyRecords.map((record) => record.mood))}/10`} />
              <Metric label="平均不安" value={`${formatAverage(dailyRecords.map((record) => record.anxiety))}/10`} />
              <Metric label="平均睡眠" value={`${formatAverage(dailyRecords.map((record) => record.sleepHours))}h`} />
              <Metric label="平均疲労" value={`${formatAverage(dailyRecords.map((record) => record.fatigue))}/10`} />
            </div>
            <MiniTrend title="気分の推移" values={highDaily.map((record) => record.mood)} labels={highDaily.map((record) => record.date.slice(5))} />
            <MiniTrend title="不安度の推移" values={highDaily.map((record) => record.anxiety)} labels={highDaily.map((record) => record.date.slice(5))} />
            <MiniTrend title="睡眠時間の推移" values={highDaily.map((record) => record.sleepHours)} labels={highDaily.map((record) => record.date.slice(5))} max={10} />
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
            <KeyValueList title="状態の種類ごとの回数" items={suddenByType} suffix="件" />
            <KeyValueList title="危険度別の件数" items={riskCounts} suffix="件" />
            <KeyValueList title="よく出る直前の出来事" items={triggerCounts} suffix="件" />
            <KeyValueList title="よく出る身体症状" items={symptomCounts} suffix="件" />
            <KeyValueList title="効果がありそうだった対処法" items={helpfulActions} suffix="件" />
            <KeyValueList title="突発ログが多い曜日" items={dayCounts} suffix="件" />
            <KeyValueList title="突発ログが多い時間帯" items={hourCounts} suffix="件" />
          </>
        )}
      </section>
    </section>
  );
}

function Report({ dailyRecords, suddenLogs }: { dailyRecords: DailyRecord[]; suddenLogs: SuddenLog[] }) {
  const [period, setPeriod] = useState(7);
  const [doctorMemo, setDoctorMemo] = useState("");
  const daily = dailyRecords.filter((record) => daysAgo(record.date) < period);
  const sudden = suddenLogs.filter((log) => daysAgo(log.occurredAt.slice(0, 10)) < period);
  const hasFewRecords = daily.length < 3 && sudden.length < 2;
  const topState = firstKey(countBy(sudden, (log) => log.stateType));
  const topTriggers = countFlat(sudden.flatMap((log) => log.triggers)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topSymptoms = countFlat(sudden.flatMap((log) => log.symptoms)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const topActions = countFlat(sudden.filter((log) => log.afterChange.includes("落ち着いた")).flatMap((log) => log.actions)).slice(0, 3).map(([key]) => key).join("、") || "記録なし";
  const toughDays = daily.filter((record) => record.mood <= 3 || record.anxiety >= 8 || record.fatigue >= 8).map((record) => record.date).join("、") || "目立つ記録なし";

  const fewRecordsNote = hasFewRecords ? "記録が少ないため参考程度です。\n" : "";
  const summary = `過去${period}日間のセルフ記録です。このアプリは診断・治療・服薬指示を行うものではありません。
${fewRecordsNote}

気分平均: ${formatAverage(daily.map((record) => record.mood))}/10
不安平均: ${formatAverage(daily.map((record) => record.anxiety))}/10
睡眠平均: ${formatAverage(daily.map((record) => record.sleepHours))}時間
不調が強かった日: ${toughDays}
突発ログの回数: ${sudden.length}件
突発ログで多かった状態: ${topState}
多かったトリガー: ${topTriggers}
多かった身体症状: ${topSymptoms}
効果がありそうだった対処: ${topActions}
医師に相談したいこと: ${doctorMemo || "未記入"}`;

  const prompt = `以下はメンタルヘルスのセルフ記録です。診断や治療判断、服薬指示はしないでください。
記録から、記録上の傾向、関連している可能性があるトリガー、生活面で見直せそうな点、医師や専門家に相談すべき点を分けて整理してください。

${summary}`;

  return (
    <section>
      <header className="page-head">
        <p className="eyebrow">共有用</p>
        <h1>レポート</h1>
      </header>
      {hasFewRecords && <div className="notice">記録が少ないため参考程度です。無理に分析せず、共有用の整理メモとして使えます。</div>}
      <Choice label="期間" options={["7日間", "14日間", "30日間"]} value={`${period}日間`} onChange={(value) => setPeriod(Number(value.replace("日間", "")))} />
      <TextArea label="医師に相談したいことメモ" value={doctorMemo} onChange={setDoctorMemo} />
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
            <p>気分 {record.mood}/10 ・ 不安 {record.anxiety}/10 ・ 睡眠 {record.sleepHours}h</p>
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
            <p>{record.stateType} ・ 強さ {record.intensity}/10 ・ 危険度 {record.riskLevel}</p>
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

function ScoreField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="field">
      <div className="score-head">
        <span>{label}</span>
        <strong>{value}/10</strong>
      </div>
      <div className="score-grid">
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

function DangerNotice() {
  return (
    <div className="danger-notice">
      今は一人で抱え込まないでください。命に関わる危険がある場合は、すぐに119番、近くの救急外来、または信頼できる人に連絡してください。このアプリは医療機関の代わりにはなれません。
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="empty empty-box">{text}</p>;
}

function MiniTrend({ title, values, labels, max = 10 }: { title: string; values: number[]; labels: string[]; max?: number }) {
  return (
    <div className="trend">
      <h3>{title}</h3>
      <div className="bars">
        {values.length === 0 && <p className="empty">記録がまだありません</p>}
        {values.map((value, index) => (
          <div className="bar-wrap" key={`${labels[index]}-${index}`}>
            <div className="bar" style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
            <small>{labels[index]}</small>
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

function formatAverage(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return "-";
  return (valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1);
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

function groupedAverage<T>(items: T[], keyer: (item: T) => string, valuer: (item: T) => number): [string, string][] {
  const groups = new Map<string, number[]>();
  items.forEach((item) => {
    const key = keyer(item);
    groups.set(key, [...(groups.get(key) || []), valuer(item)]);
  });
  return [...groups.entries()].map(([key, values]) => [key, formatAverage(values)]);
}

function firstKey(items: [string, number][]) {
  return items[0]?.[0] || "記録なし";
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
