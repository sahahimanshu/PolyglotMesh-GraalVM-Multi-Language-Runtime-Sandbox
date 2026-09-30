import { useState } from "react";
import Editor from "@monaco-editor/react";
import "./PolyglotEditor.css";

const languages = {
  Python: {
    language: "python",
    icon: "🐍",
    code: `print("Hello from PolyglotMesh")`,
  },

  JavaScript: {
    language: "javascript",
    icon: "JS",
    code: `console.log("Hello from JavaScript");`,
  },

  Java: {
    language: "java",
    icon: "☕",
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java");
    }
}`,
  },
};

function PolyglotEditor() {
  const [selectedLanguage, setSelectedLanguage] = useState("Python");
  const [code, setCode] = useState(languages.Python.code);
  const [output, setOutput] = useState(
    'Welcome to PolyglotMesh. Press "Run Code" to execute your program.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState("--");

  const currentLanguage = languages[selectedLanguage];

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCode(languages[language].code);
    setOutput(
      `Ready to execute ${language} code...`
    );
    setExecutionTime("--");
  };

  const handleRunCode = async () => {
    if (selectedLanguage === "Java") {
      setOutput(
        "Java execution is not available yet.\n\nPython and JavaScript execution are currently supported."
      );
      setExecutionTime("--");
      return;
    }

    setIsRunning(true);
    setOutput("Executing...");
    setExecutionTime("--");

    const startTime = performance.now();

    try {
      const endpoint =
        selectedLanguage === "Python"
          ? "http://localhost:8080/api/execute/python"
          : "http://localhost:8080/api/execute/javascript";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: code,
      });

      const result = await response.text();

      const endTime = performance.now();
      setExecutionTime(`${Math.round(endTime - startTime)} ms`);

      if (!response.ok) {
        setOutput(`Execution failed:\n${result}`);
        return;
      }

      setOutput(result || "Code executed successfully.");
    } catch (error) {
      setOutput(
        "Unable to connect to PolyglotMesh backend.\n\nMake sure Spring Boot is running on port 8080."
      );
      setExecutionTime("--");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="ide-page">

      {/* ================= TOP BAR ================= */}

      <header className="topbar">

        <div className="brand">
          <div className="brand-mark">P</div>

          <div>
            <div className="brand-name">
              PolyglotMesh
            </div>

            <div className="brand-subtitle">
              Multi-Language Runtime Sandbox
            </div>
          </div>
        </div>

        <div className="topbar-right">

          <div className="runtime-badge">
            <span className="live-dot"></span>
            <span>GraalVM Runtime</span>
          </div>

          <button className="icon-button">
            ⚙
          </button>

        </div>

      </header>


      

      <div className="ide-body">


        <aside className="sidebar">

          <div className="sidebar-title">
            EXPLORER
          </div>

          <div className="project-name">
            <span>⌄</span>
            <span>📁</span>
            <span>PolyglotMesh</span>
          </div>

          <div className="file active-file">
            <span>🐍</span>
            <span>main.py</span>
          </div>

          <div className="file">
            <span>JS</span>
            <span>script.js</span>
          </div>

          <div className="file">
            <span>☕</span>
            <span>Main.java</span>
          </div>


          <div className="sidebar-section">

            <div className="sidebar-title">
              RUNTIMES
            </div>

            <div className="runtime-item">
              <span className="runtime-icon python">
                🐍
              </span>

              <div>
                <strong>Python</strong>
                <small>GraalPy</small>
              </div>

              <span className="runtime-online"></span>
            </div>


            <div className="runtime-item">

              <span className="runtime-icon javascript">
                JS
              </span>

              <div>
                <strong>JavaScript</strong>
                <small>GraalJS</small>
              </div>

              <span className="runtime-online"></span>

            </div>


            <div className="runtime-item">

              <span className="runtime-icon java">
                ☕
              </span>

              <div>
                <strong>Java</strong>
                <small>JVM</small>
              </div>

              <span className="runtime-online"></span>

            </div>

          </div>


          <div className="sidebar-bottom">

            <div className="sandbox-status">
              <span className="shield">🛡</span>

              <div>
                <strong>Sandbox Active</strong>
                <small>Host access restricted</small>
              </div>

            </div>

          </div>

        </aside>


        

        <main className="workspace">


          

          <div className="editor-toolbar">

            <div className="language-tabs">

              {Object.keys(languages).map((language) => (

                <button
                  key={language}
                  className={`language-tab ${
                    selectedLanguage === language
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleLanguageChange(language)
                  }
                >

                  <span
                    className={`tab-icon ${language.toLowerCase()}`}
                  >
                    {languages[language].icon}
                  </span>

                  {language}

                  {selectedLanguage === language && (
                    <span className="tab-close">
                      ×
                    </span>
                  )}

                </button>

              ))}

            </div>


            <div className="toolbar-actions">

              <button className="small-button">
                ↻
              </button>

              <button
                className="run-button"
                onClick={handleRunCode}
                disabled={isRunning}
              >

                {isRunning ? (
                  <>
                    <span className="spinner"></span>
                    Running...
                  </>
                ) : (
                  <>
                    ▶
                    Run Code
                  </>
                )}

              </button>

            </div>

          </div>


          {/* EDITOR */}

          <section className="editor-section">

            <div className="editor-header">

              <div className="editor-file">

                <span className="file-language-icon">
                  {currentLanguage.icon}
                </span>

                <span>
                  {selectedLanguage === "Python"
                    ? "main.py"
                    : selectedLanguage === "JavaScript"
                    ? "script.js"
                    : "Main.java"}
                </span>

              </div>


              <div className="editor-info">

                <span>
                  {selectedLanguage}
                </span>

                <span>UTF-8</span>

                <span>Spaces: 4</span>

              </div>

            </div>


            <div className="monaco-container">

              <Editor
                height="100%"
                theme="vs-dark"
                language={currentLanguage.language}
                value={code}
                onChange={(value) =>
                  setCode(value || "")
                }
                options={{
                  automaticLayout: true,
                  minimap: {
                    enabled: true,
                  },
                  fontSize: 14,
                  lineHeight: 23,
                  padding: {
                    top: 20,
                    bottom: 20,
                  },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  tabSize: 4,
                  roundedSelection: false,
                  bracketPairColorization: {
                    enabled: true,
                  },
                  suggestOnTriggerCharacters: true,
                }}
              />

            </div>

          </section>


          {/* CONSOLE */}

          <section className="console">

            <div className="console-header">

              <div className="console-tabs">

                <span className="console-tab active">
                  TERMINAL
                </span>

                <span className="console-tab">
                  OUTPUT
                </span>

                <span className="console-tab">
                  PROBLEMS
                </span>

              </div>


              <div className="console-meta">

                <span>
                  Execution: {executionTime}
                </span>

                <button
                  className="clear-button"
                  onClick={() =>
                    setOutput("Console cleared.")
                  }
                >
                  Clear
                </button>

              </div>

            </div>


            <div className="console-body">

              <div className="console-prompt">
                <span className="prompt-symbol">
                  ❯
                </span>

                <span className="prompt-text">
                  PolyglotMesh
                </span>

                <span className="prompt-path">
                  ~/sandbox
                </span>
              </div>


              <pre className="console-output">
                {output}
              </pre>

            </div>

          </section>



          <footer className="statusbar">

            <div className="status-left">

              <span>
                ⬢ {selectedLanguage}
              </span>

              <span>
                main
              </span>

              <span>
                ✓ No Problems
              </span>

            </div>


            <div className="status-right">

              <span>
                Sandbox: <strong>ACTIVE</strong>
              </span>

              <span>
                Java 21
              </span>

              <span>
                GraalVM
              </span>

            </div>

          </footer>

        </main>

      </div>

    </div>
  );
}

export default PolyglotEditor;