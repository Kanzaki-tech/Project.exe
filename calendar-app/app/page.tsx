"use client";

import { shipporiMincho } from "./fonts";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
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
          title: string;
          memo: string;
          goal: string;
          status: string;
          reminder_days: number | null;
        }
      > = {};

      data.forEach((record) => {
        convertedRecords[record.date] = {
          title: record.title,
          memo: record.memo,
          goal: record.goal,
          status: record.status,
          reminder_days: record.reminder_days,
        };
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

  const [records, setRecords] = useState<
    Record<
      string,
      {
        title: string;
        memo: string;
        goal: string;
        status: string;
        reminder_days: number | null;
      }
    >
  >({});
  // 最初にlocalStorageから読み込む

  const saveRecord = async () => {
    if (selectedDay === null) return;

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

    const { error } = await supabase.from("records").upsert(
      {
        user_id: user.id,
        date: dateKey,
        title: title,
        memo: memo,
        goal: goal,
        status: status,
        reminder_days: reminderDays,
      },
      {
        onConflict: "user_id,date",
      },
    );

    if (error) {
      console.error("保存エラー:", error);
      return;
    }

    setRecords((prev) => ({
      ...prev,
      [dateKey]: {
        title,
        memo,
        goal,
        status,
        reminder_days: reminderDays,
      },
    }));

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
    if (selectedDay === null) return;

    const isConfirmed = window.confirm(
      `${year}年${month + 1}月${selectedDay}日の記録を削除しますか？`,
    );

    if (!isConfirmed) return;

    const dateKey = getDateKey(selectedDay);

    const { error } = await supabase
      .from("records")
      .delete()
      .eq("date", dateKey);

    if (error) {
      console.error("削除エラー:", error);
      return;
    }

    setRecords((prev) => {
      const newRecords = { ...prev };

      delete newRecords[dateKey];

      return newRecords;
    });

    closeModal();
  };
  const openDay = (day: number) => {
    const record = records[getDateKey(day)];

    if (record) {
      setTitle(record.title);
      setMemo(record.memo);
      setGoal(record.goal);
      setStatus(record.status);
      setReminderDays(record.reminder_days);
    } else {
      setTitle("");
      setMemo("");
      setGoal("");
      setStatus("未着手");
      setReminderDays(null);
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
    .filter(([date, record]) => {
      const recordDate = new Date(date);

      return (
        record.status !== "完了" &&
        recordDate >=
          new Date(today.getFullYear(), today.getMonth(), today.getDate())
      );
    })
    .sort(([dateA], [dateB]) => {
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  const completedDeadlineRecords = Object.entries(records)
    .filter(([, record]) => record.status === "完了")
    .sort(([dateA], [dateB]) => {
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
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
          const record = records[getDateKey(day)];
          const daysLeft = getDaysLeft(day);
          const isMatch =
            searchText === "" ||
            record?.title.toLowerCase().includes(searchText.toLowerCase());

          return (
            <div
              className={`calendar-day
        ${isToday(day) ? "today" : ""}
        ${!isMatch ? "search-hidden" : ""}
      `}
              key={day}
              onClick={() => openDay(day)}
            >
              <span>{day}</span>

              {record && (
                <>
                  {record.status !== "完了" && daysLeft >= 0 && (
                    <span className="deadline">
                      {daysLeft === 0 ? "今日まで" : `${daysLeft}日`}
                    </span>
                  )}

                  <div className="record-preview">
                    <div className={`status-badge status-${record.status}`}>
                      {record.status}
                    </div>

                    <p>{record.title}</p>
                    <small>{record.memo}</small>
                  </div>

                  <div className="hover-card">
                    <p className="hover-date">
                      {year} / {month + 1} / {day}
                    </p>

                    <div>
                      <p className="hover-label">タイトル：</p>
                      <h3>{record.title}</h3>
                    </div>
                    <div>
                      <p className="hover-label">進捗ステータス：</p>
                      <div className={`status-badge status-${record.status}`}>
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

              {records[getDateKey(selectedDay)] && (
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

              {activeDeadlineRecords.map(([date, record]) => {
                const recordDate = new Date(date);

                const daysLeft = Math.ceil(
                  (recordDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                return (
                  <div className="deadline-item" key={date}>
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

              {completedDeadlineRecords.map(([date, record]) => (
                <div className="deadline-item completed-item" key={date}>
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
    </main>
  );
}
