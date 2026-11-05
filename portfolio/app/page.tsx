"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { shipporiMincho } from "./fonts";

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isImageClosing, setIsImageClosing] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const closeProjectModal = () => {
    setIsClosing(true);

    setTimeout(() => {
      setSelectedProject(null);
      setIsClosing(false);
    }, 400);
  };
  const closeImagePreview = () => {
    setIsImageClosing(true);

    setTimeout(() => {
      setIsImageOpen(false);
      setIsImageClosing(false);
    }, 400);
  };
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(
      ".reveal, .reveal-left, .reveal-right, .reveal-from-top, .reveal-from-bottom",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            // アニメーションをリセット
            element.classList.remove("active");

            // ブラウザに再描画させてアニメーションを再実行
            void element.offsetWidth;

            element.classList.add("active");
          } else {
            // 画面外に出たらリセット
            element.classList.remove("active");
          }
        });
      },
      {
        threshold: 0.2,
      },
    );

    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main>
      {/* ==================== HEADER ==================== */}

      <header>
        <div>MY PORTFOLIO</div>

        <nav>
          <a href="#about">ABOUT</a>
          <a href="#skills">SKILLS</a>
          <a href="#projects">PROJECTS</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </header>

      {/* ==================== HERO ==================== */}

      <section className={`reveal ${shipporiMincho.className}`}>
        <div>
          <p>WEB APPLICATION DEVELOPER</p>

          <h1>
            一つ一つの
            <br />
            <span>学びを</span>
            <br />
            大切にする。
          </h1>

          <p>
            React / Next.js / JavaScript
            <br />
            Designing and developing modern web applications.
          </p>

          <div>
            <button>VIEW PROJECTS →</button>
            <button>DEVELOPMENT LOG →</button>
          </div>
        </div>

        <div>
          <p>SCROLL TO EXPLORE</p>
          <div>↓</div>
        </div>
      </section>

      {/* ==================== ABOUT ==================== */}

      <section id="about">
        <div>
          <p>01 — ABOUT</p>

          <h2 className={`reveal ${shipporiMincho.className}`}>
            学びを
            <br />
            <span>積み重ね、</span>
            <br />
            カタチにする。
          </h2>
        </div>

        <div className={shipporiMincho.className}>
          <p className="reveal">
            私はWebアプリケーション開発を中心に学んでいる エンジニアです。
          </p>

          <p className="reveal">
            フロントエンドからバックエンドまで幅広い技術に触れ、
            ユーザーにとって使いやすく、実際に価値を提供できる
            アプリケーションの開発を目指します。
          </p>

          <p className="reveal">
            現在はReact / Next.js / JavaScriptを中心に、
            モダンなWeb開発について学習しています。
          </p>
        </div>
      </section>

      {/* ==================== SKILLS ==================== */}

      <section id="skills">
        <div>
          <p>02 — SKILLS</p>

          <h2 className={`reveal ${shipporiMincho.className}`}>
            技術
            <br />
            スタック
          </h2>
        </div>

        <div className={shipporiMincho.className}>
          <div>
            <span>01</span>
            <h3>FRONTEND</h3>
            <p>HTML / CSS / JavaScript / React / Next.js</p>
          </div>

          <div>
            <span>02</span>
            <h3>BACKEND</h3>
            <p>PHP / Laravel / Node.js</p>
          </div>

          <div>
            <span>03</span>
            <h3>DATABASE</h3>
            <p>MySQL / PostgreSQL</p>
          </div>

          <div>
            <span>04</span>
            <h3>TOOLS</h3>
            <p>Git / GitHub / VS Code / Figma</p>
          </div>
        </div>
      </section>

      {/* ==================== PROJECTS ==================== */}

      <section id="projects">
        {selectedProject === "calendar" && (
          <div
            className={`project-modal-overlay ${isClosing ? "closing" : ""}`}
          >
            <div className={`project-modal ${shipporiMincho.className}`}>
              <button
                className="project-modal-close"
                onClick={closeProjectModal}
              >
                ×
              </button>

              <span>PROJECT 01</span>

              <h2>CALENDAR APP</h2>

              <p>
                日付ごとに予定やメモを保存できる カレンダーアプリケーション。
              </p>
              <div
                className="project-modal-image"
                onClick={() => setIsImageOpen(true)}
              >
                <Image
                  src="/calendar-app.png"
                  alt="Calendar Appの画面"
                  width={1536}
                  height={1024}
                />
              </div>
              <div className="project-modal-tech">
                <span>React</span>
                <span>Next.js</span>
                <span>TypeScript</span>
                <span>localStorage</span>
              </div>

              <h3>FEATURES</h3>

              <ul>
                <li>月ごとのカレンダー表示</li>
                <li>予定・メモの保存</li>
                <li>モーダルからの予定入力</li>
                <li>localStorageによるデータ保持</li>
              </ul>

              <div className="project-modal-links">
                <a
                  href="https://github.com/yuki25642349-arch/Project.exe/tree/main/calendar-app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GITHUB →
                </a>

                <a
                  href="ここに公開したサイトのURL"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LIVE DEMO →
                </a>
              </div>
            </div>
            {isImageOpen && (
              <div
                className={`image-preview-overlay ${
                  isImageClosing ? "closing" : ""
                }`}
                onClick={closeImagePreview}
              >
                <button
                  className="image-preview-close"
                  onClick={closeImagePreview}
                >
                  ×
                </button>

                <div
                  className="image-preview-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src="/calendar-app.png"
                    alt="Calendar Appの拡大画面"
                    width={1536}
                    height={1024}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedProject === "hackathon" && (
          <div
            className={`project-modal-overlay ${isClosing ? "closing" : ""}`}
          >
            <div className={`project-modal ${shipporiMincho.className}`}>
              <button
                type="button"
                className="project-modal-close"
                onClick={closeProjectModal}
              >
                ×
              </button>

              <span>PROJECT 02</span>

              <h2>Hackathon — Audience Award</h2>

              <p>
                3人チームで地方創生をテーマにした Webアプリケーションを開発。
                Supabaseを用いたバックエンド開発を担当し、
                オーディエンス賞を受賞しました。
              </p>

              <div className="project-modal-image">
                <Image
                  src="/hackathon.jpg"
                  alt="ハッカソンの写真"
                  width={1200}
                  height={800}
                />
              </div>

              <div className="project-modal-tech">
                <span>Next.js</span>
                <span>Supabase</span>
              </div>
            </div>
          </div>
        )}

        <div>
          <p>03 — SELECTED WORKS</p>

          <h2 className={`reveal ${shipporiMincho.className}`}>
            MY
            <br />
            PROJECTS
          </h2>
        </div>

        <div className={shipporiMincho.className}>
          <article className="reveal-left">
            <span>01</span>

            <h3>CALENDAR APP</h3>

            <p>日付ごとに予定やメモを保存できる カレンダーアプリケーション。</p>

            <p>React / Next.js / TypeScript / localStorage</p>

            <button onClick={() => setSelectedProject("calendar")}>
              VIEW PROJECT →
            </button>
          </article>

          <article className="reveal-right">
            <span>2026.09</span>

            <h3>Hackathon — Audience Award</h3>

            <p>
              3人チームで地方創生をテーマにした Webアプリケーションを開発。
              Supabaseを用いたバックエンド開発を担当。
              <br />
              オーディエンス賞を受賞。
            </p>

            <button
              type="button"
              onClick={() => setSelectedProject("hackathon")}
            >
              VIEW PROJECT →
            </button>
          </article>

          <article className="reveal-from-bottom">
            <span>03</span>

            <h3>PROJECT THREE</h3>

            <p>AI Application</p>
            <p>Python / AI / API</p>

            <button>VIEW PROJECT →</button>
          </article>
        </div>
      </section>

      {/* ==================== DEVELOPMENT LOG ==================== */}

      <section className={shipporiMincho.className}>
        <div>
          <p>04 — DEVELOPMENT LOG</p>

          <h2 className="reveal">
            ALWAYS
            <br />
            <span>LEARNING.</span>
          </h2>
        </div>

        <div>
          <article className="reveal-right">
            <span>2026.08</span>

            <h3>React / Next.js</h3>

            <p>コンポーネント設計やAPI連携、 Server Componentsについて学習。</p>
          </article>

          <article className="reveal-left">
            <span>2026.07</span>

            <h3>JavaScript</h3>

            <p>非同期処理、Promise、API通信などを学習。</p>
          </article>

          <article className="reveal-right">
            <span>2026.06</span>

            <h3>Web Development</h3>

            <p>
              HTML / CSS / JavaScriptを使った Webアプリケーション開発を開始。
            </p>
          </article>
        </div>
      </section>

      {/* ==================== CONTACT ==================== */}

      <section className={shipporiMincho.className}>
        <p>05 — CONTACT</p>

        <h2 className="reveal">
          LET&apos;S
          <br />
          BUILD
          <br />
          SOMETHING.
        </h2>

        <button type="button" onClick={() => setIsContactOpen(true)}>
          CONTACT ME →
        </button>

        {isContactOpen && (
          <div className="contact-modal-overlay">
            <div className={`contact-modal ${shipporiMincho.className}`}>
              <button
                type="button"
                className="contact-modal-close"
                onClick={() => setIsContactOpen(false)}
                aria-label="閉じる"
              >
                ×
              </button>

              <span>05 — CONTACT</span>
              <h2>GET IN TOUCH.</h2>

              <p>GitHubやSNSからお気軽にご連絡ください。</p>

              <div className="contact-links">
                <a
                  href="https://github.com/kanzaki-tech"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ==================== FOOTER ==================== */}

      <footer>
        <p>© 2026 MY PORTFOLIO</p>
        <p>WEB APPLICATION DEVELOPER</p>
      </footer>
    </main>
  );
}
