"use client";

import { shipporiMincho } from "./fonts";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [dismissedHoverDay, setDismissedHoverDay] = useState<string | null>(
    null,
  );

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [goal, setGoal] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [isDeadlineClosing, setIsDeadlineClosing] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [status, setStatus] = useState("未着手");

  const [eventTime, setEventTime] = useState("");

  const [endTime, setEndTime] = useState("");

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);

  const [isReminderPickerOpen, setIsReminderPickerOpen] = useState(false);

  const [reminderUnit, setReminderUnit] = useState<string | null>(null);
  const [reminderValue, setReminderValue] = useState<number | null>(null);
  const [reminderTime, setReminderTime] = useState("09:00");

  const [reminderDays, setReminderDays] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchRecords = async () => {
      if (!user) {
        setRecords({});
        return;
      }

      const { data, error } = await supabase
        .from("records")
        .select("*")
        .eq("user_id", user.id);

      if (!isActive) return;

      if (error) {
        console.error("Supabaseエラー:", error);
        return;
      }

      const convertedRecords: Record<
        string,
        {
          id: string;
          title: string;
          memo: string;
          goal: string;
          status: string;
          reminder_days: number | null;
          event_time: string | null;
          reminder_unit: string | null;
          reminder_value: number | null;
          reminder_time: string | null;
          end_time: string | null;
        }[]
      > = {};

      data.forEach((record) => {
        if (!convertedRecords[record.date]) {
          convertedRecords[record.date] = [];
        }

        convertedRecords[record.date].push({
          id: record.id,
          title: record.title,
          memo: record.memo,
          goal: record.goal,
          status: record.status,
          reminder_days: record.reminder_days,
          event_time: record.event_time,
          end_time: record.end_time,
          reminder_unit: record.reminder_unit,
          reminder_value: record.reminder_value,
          reminder_time: record.reminder_time,
        });
      });

      setRecords(convertedRecords);
    };

    fetchRecords();

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    if (selectedDay !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedDay]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service Worker登録エラー:", error);
    });
  }, []);

  const [records, setRecords] = useState<
    Record<
      string,
      {
        id: string;
        title: string;
        memo: string;
        goal: string;
        status: string;
        reminder_days: number | null;
        event_time: string | null;
        reminder_unit: string | null;
        reminder_value: number | null;
        reminder_time: string | null;
        end_time: string | null;
      }[]
    >
  >({});

  // 最初にlocalStorageから読み込む

  const saveRecord = async () => {
    if (selectedDay === null) return;

    if (reminderUnit !== null) {
      if (
        reminderValue === null ||
        !Number.isInteger(reminderValue) ||
        reminderValue < 1
      ) {
        alert("通知までの数値は1以上の整数で入力してください");
        return;
      }

      if (
        (reminderUnit === "hours" || reminderUnit === "minutes") &&
        !eventTime
      ) {
        alert("時間前・分前の通知には予定の開始時刻が必要です");
        return;
      }

      if (reminderUnit === "days" && !reminderTime) {
        alert("通知する時刻を入力してください");
        return;
      }
    }

    // 現在ログインしているユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("ユーザーを取得できません:", userError);
      return;
    }

    console.log("ログイン中のユーザーID:", user.id);

    const dateKey = getDateKey(selectedDay);

    const recordData = {
      user_id: user.id,
      date: dateKey,
      title,
      memo,
      goal,
      status,
      reminder_days: null,
      event_time: eventTime || null,
      end_time: endTime || null,
      reminder_unit: reminderUnit,
      reminder_value: reminderValue,
      reminder_time: reminderUnit === "days" ? reminderTime : null,
    };

    const { data, error } =
      selectedRecordId === null
        ? await supabase.from("records").insert(recordData).select().single()
        : await supabase
            .from("records")
            .update(recordData)
            .eq("id", selectedRecordId)
            .eq("user_id", user.id)
            .select()
            .single();

    if (error) {
      console.error("保存エラー:", error);
      return;
    }

    if (!data) return;

    setRecords((prev) => {
      const dayRecords = prev[dateKey] ?? [];

      const updatedRecords =
        selectedRecordId === null
          ? [...dayRecords, data]
          : dayRecords.map((record) => (record.id === data.id ? data : record));

      return {
        ...prev,
        [dateKey]: updatedRecords,
      };
    });

    closeModal();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const getDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  const today = new Date();

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };
  const getDaysLeft = (day: number) => {
    const targetDate = new Date(year, month, day);

    const difference = targetDate.getTime() - today.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const deleteRecord = async () => {
    if (selectedDay === null || selectedRecordId === null || !user) {
      return;
    }

    const isConfirmed = window.confirm("選択した予定を削除しますか？");

    if (!isConfirmed) return;

    const dateKey = getDateKey(selectedDay);

    const { error } = await supabase
      .from("records")
      .delete()
      .eq("id", selectedRecordId)
      .eq("user_id", user.id);

    if (error) {
      console.error("削除エラー:", error);
      return;
    }

    setRecords((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).filter(
        (record) => record.id !== selectedRecordId,
      ),
    }));

    closeModal();
  };

  const openDay = (day: number) => {
    const record = records[getDateKey(day)]?.[0];

    setSelectedRecordId(record?.id ?? null);

    if (record) {
      setTitle(record.title);
      setMemo(record.memo);
      setGoal(record.goal);
      setStatus(record.status);

      setEventTime(record.event_time ?? "");
      setEndTime(record.end_time ?? "");
      setReminderUnit(record.reminder_unit);
      setReminderValue(record.reminder_value);
      setReminderTime(record.reminder_time ?? "09:00");
    } else {
      setTitle("");
      setMemo("");
      setGoal("");
      setStatus("未着手");

      setEventTime("");
      setEndTime("");
      setReminderUnit(null);
      setReminderValue(null);
      setReminderTime("09:00");
    }

    setSelectedDay(day);
  };

  const closeDeadlinePanel = () => {
    setIsDeadlineClosing(true);

    setTimeout(() => {
      setIsDeadlineOpen(false);
      setIsDeadlineClosing(false);
    }, 350);
  };

  const activeDeadlineRecords = Object.entries(records)
    .flatMap(([date, dayRecords]) =>
      dayRecords.map((record) => ({
        date,
        record,
      })),
    )
    .filter(({ date, record }) => {
      const recordDate = new Date(date);

      return (
        record.status !== "完了" &&
        recordDate >=
          new Date(today.getFullYear(), today.getMonth(), today.getDate())
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedDeadlineRecords = Object.entries(records)
    .flatMap(([date, dayRecords]) =>
      dayRecords.map((record) => ({
        date,
        record,
      })),
    )
    .filter(({ record }) => record.status === "完了")
    .sort((a, b) => b.date.localeCompare(a.date));

  const generateAiSchedule = async () => {
    const response = await fetch("/api/ai", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        text: aiInput,
      }),
    });

    const data = await response.json();

    console.log("サーバーから返ってきたデータ:", data);
  };

  const selectedDayRecords =
    selectedDay === null ? [] : (records[getDateKey(selectedDay)] ?? []);

  const closeModal = () => {
    setIsModalClosing(true);

    setTimeout(() => {
      setSelectedDay(null);
      setIsModalClosing(false);
    }, 350);
  };
  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("新規登録エラー:", error);

      setAuthError("アカウントの作成に失敗しました");
      setAuthMessage("");
      return;
    }
    setAuthError("");
    setAuthMessage("確認メールを送信しましたメールを確認してください");

    console.log("新規登録成功:", data);
  };
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("ログインエラー:", error);
      setAuthError("メールアドレスまたはパスワードが違います");
      return;
    }

    console.log("ログイン成功:", data);
  };
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("ログアウトエラー:", error);
      return;
    }

    console.log("ログアウト成功");
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("このブラウザは通知に対応していません");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      alert("通知が許可されました！");
    } else {
      alert("通知が許可されませんでした");
    }
  };

  if (!user) {
    return (
      <main className={`calendar-page ${shipporiMincho.className}`}>
        <div className="auth-container">
          <h1>Calendar</h1>

          <p>
            {isSignUp ? "アカウントを作成してください" : "ログインしてください"}
          </p>

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {authError && <p className="auth-error">{authError}</p>}

          {authMessage && <p className="auth-message">{authMessage}</p>}

          {isSignUp ? (
            <button onClick={signUp}>SIGN UP</button>
          ) : (
            <button onClick={signIn}>LOGIN</button>
          )}

          <button
            className="auth-switch"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError("");
              setAuthMessage("");
            }}
          >
            {isSignUp
              ? "すでにアカウントをお持ちの方 → LOGIN"
              : "アカウントをお持ちでない方 → CREATE ACCOUNT"}
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className={`calendar-page ${shipporiMincho.className}`}>
      <header className="calendar-header">
        <div className="calendar-header-top">
          <div className="calendar-title-area">
            <h1>Calendar</h1>

            <button className="logout-button" onClick={signOut}>
              LOGOUT
            </button>
            <button type="button" onClick={requestNotificationPermission}>
              通知を有効にする
            </button>
          </div>

          <div className="month-selector">
            <button className="month-button" onClick={previousMonth}>
              <span className="arrow">←</span>
              <span className="button-text">PREV</span>
            </button>

            <h2>
              <span className="year">{year}</span>
              <span className="slash"> / </span>
              <span className="month">
                {String(month + 1).padStart(2, "0")}
              </span>
            </h2>

            <button className="month-button" onClick={nextMonth}>
              <span className="button-text">NEXT</span>
              <span className="arrow">→</span>
            </button>
          </div>
        </div>

        <div className="search-box">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="タイトルを検索"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </header>
      <div className="weekdays">
        <div>SUN</div>
        <div>MON</div>
        <div>TUE</div>
        <div>WED</div>
        <div>THU</div>
        <div>FRI</div>
        <div>SAT</div>
      </div>
      <div className="calendar-grid">
        {Array.from({ length: firstDay }).map((_, index) => (
          <div className="calendar-day empty-day" key={`empty-${index}`} />
        ))}

        {days.map((day) => {
          const dayRecords = records[getDateKey(day)] ?? [];
          const daysLeft = getDaysLeft(day);
          const isMatch =
            searchText === "" ||
            dayRecords.some((record) =>
              record.title.toLowerCase().includes(searchText.toLowerCase()),
            );

          return (
            <div
              className={`calendar-day
    ${isToday(day) ? "today" : ""}
    ${!isMatch ? "search-hidden" : ""}
  `}
              key={day}
              onClick={() => openDay(day)}
              onMouseLeave={() => setDismissedHoverDay(null)}
            >
              <span>{day}</span>

              {dayRecords.length > 0 && (
                <>
                  {dayRecords.some((record) => record.status !== "完了") &&
                    daysLeft >= 0 && (
                      <span className="deadline">
                        {daysLeft === 0 ? "今日まで" : `${daysLeft}日`}
                      </span>
                    )}

                  {dayRecords.slice(0, 1).map((record) => (
                    <div className="record-preview" key={record.id}>
                      <div className={`status-badge status-${record.status}`}>
                        {record.status}
                      </div>

                      <p>{record.title}</p>
                      <small>{record.memo}</small>
                    </div>
                  ))}

                  {dayRecords.length > 1 && (
                    <p className="more-records">＋{dayRecords.length - 1}件</p>
                  )}

                  <div
                    className={`hover-card ${
                      dismissedHoverDay === getDateKey(day) ? "dismissed" : ""
                    }`}
                  >
                    <p className="hover-date">
                      {year} / {month + 1} / {day}
                    </p>
                    <div className="hover-card-content">
                      {dayRecords.map((record) => (
                        <div key={record.id}>
                          <div>
                            <p className="hover-label">タイトル：</p>
                            <h3>{record.title}</h3>
                          </div>

                          {record.event_time && (
                            <div>
                              <p className="hover-label">予定の開始時刻：</p>
                              <p className="hover-event-time">
                                {record.event_time.slice(0, 5)}
                              </p>
                            </div>
                          )}

                          {record.end_time && (
                            <div>
                              <p className="hover-label">予定の終了時刻：</p>
                              <p className="hover-event-time">
                                {record.end_time.slice(0, 5)}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="hover-label">進捗ステータス：</p>
                            <div
                              className={`status-badge status-${record.status}`}
                            >
                              {record.status}
                            </div>
                          </div>

                          <div>
                            <p className="hover-label">やったこと：</p>
                            <p>{record.memo}</p>
                          </div>

                          <div>
                            <p className="hover-label">この日までの目標：</p>
                            <p>{record.goal}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hover-card-actions">
                      <button
                        type="button"
                        className="hover-card-ok"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissedHoverDay(getDateKey(day));
                        }}
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div className={`modal-overlay ${isModalClosing ? "closing" : ""}`}>
          <div className="day-modal">
            <button className="close-button" onClick={closeModal}>
              ×
            </button>

            <p className="modal-label">DAILY RECORD</p>

            <h2 className="modal-date">
              {year} / {month + 1} / {selectedDay}
            </h2>

            {selectedDayRecords.length > 0 && (
              <div className="day-record-list">
                <p className="input-label">この日の予定</p>

                {selectedDayRecords.map((record) => (
                  <div
                    className="day-record-item"
                    key={record.id}
                    onClick={() => {
                      setSelectedRecordId(record.id);
                      setTitle(record.title);
                      setMemo(record.memo);
                      setGoal(record.goal);
                      setStatus(record.status);
                      setEventTime(record.event_time ?? "");
                      setReminderUnit(record.reminder_unit);
                      setReminderValue(record.reminder_value);
                      setReminderTime(record.reminder_time ?? "09:00");
                      setEndTime(record.end_time ?? "");
                    }}
                  >
                    <span>
                      {record.event_time?.slice(0, 5) ?? "時刻未設定"}
                    </span>
                    <span>{record.title}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedDayRecords.length > 0 && (
              <button
                type="button"
                className="add-record-button"
                onClick={() => {
                  setSelectedRecordId(null);
                  setTitle("");
                  setMemo("");
                  setGoal("");
                  setStatus("未着手");
                  setEndTime("");
                  setEventTime("");
                  setReminderUnit(null);
                  setReminderValue(null);
                  setReminderTime("09:00");
                }}
              >
                ＋ 新しい予定を追加
              </button>
            )}

            <input
              type="text"
              placeholder="タイトルを入力"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="status-field">
              <p className="input-label">進捗ステータス</p>

              <div className="status-options">
                <button
                  type="button"
                  className={
                    status === "未着手"
                      ? "status-option active"
                      : "status-option"
                  }
                  onClick={() => setStatus("未着手")}
                >
                  未着手
                </button>

                <button
                  type="button"
                  className={
                    status === "進行中"
                      ? "status-option active"
                      : "status-option"
                  }
                  onClick={() => setStatus("進行中")}
                >
                  進行中
                </button>

                <button
                  type="button"
                  className={
                    status === "完了" ? "status-option active" : "status-option"
                  }
                  onClick={() => setStatus("完了")}
                >
                  完了
                </button>
              </div>
            </div>
            <div className="record-fields">
              <div className="time-fields-row">
                <div className="record-field">
                  <p className="input-label">予定の開始時刻</p>

                  <button
                    type="button"
                    className="time-picker-button"
                    onClick={() => setIsTimePickerOpen(true)}
                  >
                    <span>{eventTime || "時刻を選択"}</span>
                    <span className="time-picker-icon">◷</span>
                  </button>
                </div>

                <div className="record-field">
                  <p className="input-label">予定の終了時刻</p>

                  <button
                    type="button"
                    className="time-picker-button"
                    onClick={() => setIsEndTimePickerOpen(true)}
                  >
                    <span>{endTime || "時刻を選択"}</span>
                    <span className="time-picker-icon">◷</span>
                  </button>
                </div>
              </div>

              <div className="record-field">
                <p className="input-label">リマインダー通知</p>

                <button
                  type="button"
                  className="time-picker-button"
                  onClick={() => setIsReminderPickerOpen(true)}
                >
                  <span>
                    {reminderUnit === null
                      ? "通知なし"
                      : reminderUnit === "days"
                        ? `${reminderValue}日前 ${reminderTime}`
                        : reminderUnit === "hours"
                          ? `${reminderValue}時間前`
                          : `${reminderValue}分前`}
                  </span>

                  <span className="time-picker-icon">♧</span>
                </button>
              </div>

              <div className="record-field">
                <p className="input-label">やったこと</p>

                <textarea
                  placeholder="今日やったことを入力"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>

              <div className="record-field">
                <p className="input-label">この日までの目標</p>

                <textarea
                  placeholder="この日までに達成したい目標を入力"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="save-button" onClick={saveRecord}>
                保存
              </button>

              {selectedRecordId !== null && (
                <button className="delete-button" onClick={deleteRecord}>
                  削除
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {isAiOpen && (
        <div className="ai-modal-overlay" onClick={() => setIsAiOpen(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="ai-modal-close"
              onClick={() => setIsAiOpen(false)}
            >
              ×
            </button>

            <p className="ai-modal-label">AI SCHEDULE</p>

            <h2>予定をAIで作成</h2>

            <p className="ai-modal-description">
              やりたいことや期限を自由に入力してください。
            </p>

            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="例：来週の金曜日までにReactの基礎を終わらせたい"
            />

            <button className="ai-generate-button" onClick={generateAiSchedule}>
              ✦ GENERATE
            </button>
          </div>
        </div>
      )}
      {isDeadlineOpen && (
        <div
          className={`deadline-panel-overlay ${
            isDeadlineClosing ? "closing" : ""
          }`}
          onClick={closeDeadlinePanel}
        >
          <aside
            className="deadline-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="deadline-panel-header">
              <div>
                <p>UPCOMING</p>
                <h2>DEADLINES</h2>
              </div>

              <button
                className="deadline-panel-close"
                onClick={closeDeadlinePanel}
              >
                ×
              </button>
            </div>

            <div className="deadline-list">
              <p className="deadline-section-label">ACTIVE</p>

              {activeDeadlineRecords.map(({ date, record }) => {
                const recordDate = new Date(date);

                const daysLeft = Math.ceil(
                  (recordDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                return (
                  <div className="deadline-item" key={record.id}>
                    <div className="deadline-item-top">
                      <span className="deadline-item-date">{date}</span>

                      <span className="deadline-item-days">
                        {daysLeft === 0 ? "TODAY" : `${daysLeft}日`}
                      </span>
                    </div>

                    <h3>{record.title}</h3>

                    <p>{record.goal}</p>

                    <div className={`status-badge status-${record.status}`}>
                      {record.status}
                    </div>
                  </div>
                );
              })}

              <p className="deadline-section-label completed-label">
                COMPLETED
              </p>

              {completedDeadlineRecords.map(({ date, record }) => (
                <div className="deadline-item completed-item" key={record.id}>
                  <div className="deadline-item-top">
                    <span className="deadline-item-date">{date}</span>
                  </div>

                  <h3>{record.title}</h3>

                  <p>{record.goal}</p>

                  <div className="status-badge status-完了">完了</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      <button
        className="deadline-button"
        onClick={() => setIsDeadlineOpen(true)}
      >
        DEADLINES
      </button>
      <button className="ai-button" onClick={() => setIsAiOpen(true)}>
        ✦ AI ADD
      </button>

      {isTimePickerOpen && (
        <div className="time-picker-overlay">
          <div className="time-picker-modal">
            <p className="time-picker-label">START TIME</p>
            <h2>開始時刻を選択</h2>

            <div className="time-picker-selects">
              <div className="time-picker-column">
                <p>時</p>

                <div className="time-picker-list">
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = String(i).padStart(2, "0");

                    return (
                      <button
                        key={hour}
                        type="button"
                        className={
                          (eventTime.split(":")[0] || "09") === hour
                            ? "time-picker-option active"
                            : "time-picker-option"
                        }
                        onClick={() => {
                          const minute = eventTime.split(":")[1] || "00";
                          setEventTime(`${hour}:${minute}`);
                        }}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              <span>:</span>

              <div className="time-picker-column">
                <p>分</p>

                <div className="time-picker-list">
                  {Array.from({ length: 60 }, (_, i) => {
                    const minute = String(i).padStart(2, "0");

                    return (
                      <button
                        key={minute}
                        type="button"
                        className={
                          (eventTime.split(":")[1] || "00") === minute
                            ? "time-picker-option active"
                            : "time-picker-option"
                        }
                        onClick={() => {
                          const hour = eventTime.split(":")[0] || "09";
                          setEventTime(`${hour}:${minute}`);
                        }}
                      >
                        {minute}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="time-picker-confirm"
              onClick={() => {
                if (!eventTime) setEventTime("09:00");
                setIsTimePickerOpen(false);
              }}
            >
              決定
            </button>
          </div>
        </div>
      )}

      {isEndTimePickerOpen && (
        <div className="time-picker-overlay">
          <div className="time-picker-modal">
            <p className="time-picker-label">END TIME</p>
            <h2>終了時刻を選択</h2>

            <div className="time-picker-selects">
              <div className="time-picker-column">
                <p>時</p>

                <div className="time-picker-list">
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = String(i).padStart(2, "0");

                    return (
                      <button
                        key={hour}
                        type="button"
                        className={
                          (endTime.split(":")[0] || "09") === hour
                            ? "time-picker-option active"
                            : "time-picker-option"
                        }
                        onClick={() => {
                          const minute = endTime.split(":")[1] || "00";
                          setEndTime(`${hour}:${minute}`);
                        }}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              <span>:</span>

              <div className="time-picker-column">
                <p>分</p>

                <div className="time-picker-list">
                  {Array.from({ length: 60 }, (_, i) => {
                    const minute = String(i).padStart(2, "0");

                    return (
                      <button
                        key={minute}
                        type="button"
                        className={
                          (endTime.split(":")[1] || "00") === minute
                            ? "time-picker-option active"
                            : "time-picker-option"
                        }
                        onClick={() => {
                          const hour = endTime.split(":")[0] || "09";
                          setEndTime(`${hour}:${minute}`);
                        }}
                      >
                        {minute}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="time-picker-confirm"
              onClick={() => {
                if (!endTime) setEndTime("09:00");
                setIsEndTimePickerOpen(false);
              }}
            >
              決定
            </button>
          </div>
        </div>
      )}

      {isReminderPickerOpen && (
        <div className="time-picker-overlay">
          <div className="time-picker-modal">
            <p className="time-picker-label">REMINDER SETTINGS</p>
            <h2>リマインダーを設定</h2>

            <div className="reminder-options">
              {[
                { value: "", label: "通知なし" },
                { value: "days", label: "日前" },
                { value: "hours", label: "時間前" },
                { value: "minutes", label: "分前" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    (reminderUnit ?? "") === option.value
                      ? "reminder-option active"
                      : "reminder-option"
                  }
                  onClick={() => {
                    setReminderUnit(option.value || null);
                    setReminderValue(option.value ? 1 : null);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {reminderUnit !== null && (
              <div className="reminder-value-field">
                <p className="input-label">通知するタイミング</p>

                <div className="time-picker-list reminder-number-list">
                  {Array.from(
                    {
                      length:
                        reminderUnit === "days"
                          ? 30
                          : reminderUnit === "hours"
                            ? 24
                            : 60,
                    },
                    (_, i) => i + 1,
                  ).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={
                        reminderValue === value
                          ? "time-picker-option active"
                          : "time-picker-option"
                      }
                      onClick={() => setReminderValue(value)}
                    >
                      {value}
                      {reminderUnit === "days"
                        ? "日前"
                        : reminderUnit === "hours"
                          ? "時間前"
                          : "分前"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {reminderUnit === "days" && (
              <div className="reminder-value-field">
                <p className="input-label">通知する時刻</p>

                <div className="time-picker-selects">
                  <div className="time-picker-column">
                    <p>時</p>

                    <div className="time-picker-list">
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = String(i).padStart(2, "0");

                        return (
                          <button
                            key={hour}
                            type="button"
                            className={
                              reminderTime.split(":")[0] === hour
                                ? "time-picker-option active"
                                : "time-picker-option"
                            }
                            onClick={() => {
                              const minute = reminderTime.split(":")[1] || "00";
                              setReminderTime(`${hour}:${minute}`);
                            }}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <span>:</span>

                  <div className="time-picker-column">
                    <p>分</p>

                    <div className="time-picker-list">
                      {Array.from({ length: 60 }, (_, i) => {
                        const minute = String(i).padStart(2, "0");

                        return (
                          <button
                            key={minute}
                            type="button"
                            className={
                              reminderTime.split(":")[1] === minute
                                ? "time-picker-option active"
                                : "time-picker-option"
                            }
                            onClick={() => {
                              const hour = reminderTime.split(":")[0] || "09";
                              setReminderTime(`${hour}:${minute}`);
                            }}
                          >
                            {minute}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="time-picker-confirm"
              onClick={() => {
                setIsReminderPickerOpen(false);
              }}
            >
              決定
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
