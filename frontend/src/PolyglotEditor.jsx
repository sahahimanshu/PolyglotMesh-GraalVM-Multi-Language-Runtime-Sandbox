import { useState } from "react";
import Editor from "@monaco-editor/react";
import "./PolyglotEditor.css";

const languages = {
  Java: {
    language: "java",
    icon: "☕",
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java");
    }
}`,
  },

  Python: {
    language: "python",
    icon: "🐍",
    code: `print("Hello from Python")`,
  },

  JavaScript: {
    language: "javascript",
    icon: "JS",
    code: `console.log("Hello from JavaScript");`,
  },
};

function PolyglotEditor() {
  const [selectedLanguage, setSelectedLanguage] = useState("Java");

  const [code, setCode] = useState(languages.Java.code);

  const [output, setOutput] = useState(
    "Ready to execute code..."
  );

  const [isRunning, setIsRunning] = useState(false);

  const currentLanguage = languages[selectedLanguage];

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCode(languages[language].code);
    setOutput("Ready to execute code...");
  };

  const handleRunCode = async () => {

    if (selectedLanguage === "Java") {
      setOutput(
        "Java execution is not available yet."
      );
      return;
    }

    setIsRunning(true);

    setOutput("Executing...");

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

      if (!response.ok) {
        setOutput(
          `Execution failed: ${result}`
        );

        return;
      }

      setOutput(
        result || "Code executed successfully."
      );

    } catch (error) {

      setOutput(
        "Unable to connect to PolyglotMesh backend. Make sure Spring Boot is running on port 8080."
      );

    } finally {

      setIsRunning(false);

    }
  };

  return (
    <div className="polyglot-page">

      <div className="polyglot-container">

       
       

        <header className="polyglot-header">

          <div className="brand-section">

            <div className="brand-logo">
              P
            </div>

            <div className="brand-info">

              <h1>
                PolyglotMesh
              </h1>

              <p>
                Multi-Language Runtime Sandbox
              </p>

            </div>

          </div>


          <div className="runtime-status">

            <span className="status-dot"></span>

            <span>
              GraalVM Runtime
            </span>

          </div>

        </header>



        <div className="language-bar">

          {Object.keys(languages).map(
            (language) => (

              <button
                key={language}

                className={`language-tab ${
                  selectedLanguage === language
                    ? "active"
                    : ""
                }`}

                onClick={() =>
                  handleLanguageChange(language)
                }
              >

                <span
                  className={`language-icon ${language.toLowerCase()}`}
                >
                  {languages[language].icon}
                </span>

                <span>
                  {language}
                </span>

              </button>

            )
          )}

        </div>


        

        <div className="workspace">


          

          <div className="editor-pane">

            <div className="pane-header">

              <span>
                CODE EDITOR
              </span>

              <span className="pane-language">
                {selectedLanguage}
              </span>

            </div>


            <div className="editor-wrapper">

              <Editor
                height="100%"

                theme="vs-dark"

                language={
                  currentLanguage.language
                }

                value={code}

                onChange={(value) => {
                  setCode(value || "");
                }}

                options={{

                  automaticLayout: true,

                  minimap: {
                    enabled: false,
                  },

                  fontSize: 14,

                  lineHeight: 22,

                  padding: {
                    top: 20,
                    bottom: 20,
                  },

                  scrollBeyondLastLine: false,

                  wordWrap: "on",

                  renderLineHighlight: "line",

                  cursorBlinking: "smooth",

                  smoothScrolling: true,

                  suggestOnTriggerCharacters: true,

                  tabSize: 4,

                  roundedSelection: false,

                }}

              />

            </div>


            {/* =========================
                RUN BAR
            ========================== */}

            <div className="run-bar">

              <button
                className="run-button"

                onClick={handleRunCode}

                disabled={isRunning}
              >

                {isRunning
                  ? "⏳ Running..."
                  : "▶ Run Code"}

              </button>


              <span className="selected-runtime">

                {selectedLanguage}

              </span>

            </div>

          </div>


          

          <section className="output-section">

            <div className="output-header">

              <div className="output-title">

                <span className="terminal-icon">
                  &gt;_
                </span>

                <span>
                  CONSOLE OUTPUT
                </span>

              </div>

              <span className="console-status">
                Sandbox
              </span>

            </div>


            <div className="output-content">

              <span className="output-line"></span>

              <pre className="output-text">
                {output}
              </pre>

            </div>

          </section>

        </div>


        

        <footer className="polyglot-footer">

          <span className="footer-brand">
            PolyglotMesh
          </span>

          <span className="footer-runtime">
            Java 21 • GraalVM
          </span>

          <span className="footer-links">
            Write&nbsp; • &nbsp;Run&nbsp; • &nbsp;Explore&nbsp; • &nbsp;Learn
          </span>

        </footer>

      </div>

    </div>
  );
}

export default PolyglotEditor;