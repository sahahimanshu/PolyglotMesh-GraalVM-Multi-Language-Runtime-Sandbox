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

  // Stores the code currently being edited
  const [code, setCode] = useState(languages.Java.code);

  const currentLanguage = languages[selectedLanguage];

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCode(languages[language].code);
  };

  return (
    <div className="polyglot-page">

      <div className="polyglot-container">

        {/* HEADER */}
        <header className="polyglot-header">

          <div className="brand-section">

            <div className="brand-logo">
              P
            </div>

            <div className="brand-info">
              <h1>PolyglotMesh</h1>
              <p>Multi-Language Runtime Sandbox</p>
            </div>

          </div>

          <div className="runtime-status">
            <span className="status-dot"></span>
            <span>GraalVM Runtime</span>
          </div>

        </header>


        {/* LANGUAGE TABS */}
        <div className="language-bar">

          {Object.keys(languages).map((language) => (

            <button
              key={language}
              className={`language-tab ${
                selectedLanguage === language ? "active" : ""
              }`}
              onClick={() => handleLanguageChange(language)}
            >

              <span
                className={`language-icon ${language.toLowerCase()}`}
              >
                {languages[language].icon}
              </span>

              <span>{language}</span>

            </button>

          ))}

        </div>


        {/* MONACO EDITOR */}
        <div className="editor-wrapper">

          <Editor
            height="300px"
            theme="vs-dark"

            language={currentLanguage.language}

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
                top: 25,
                bottom: 20,
              },

              scrollBeyondLastLine: false,

              wordWrap: "on",

              renderLineHighlight: "line",

              cursorBlinking: "smooth",

              smoothScrolling: true,

              suggestOnTriggerCharacters: true,

              tabSize: 4,
            }}
          />

        </div>


        {/* RUN BAR */}
        <div className="run-bar">

          <button className="run-button">
            ▶ Run Code
          </button>

          <span className="selected-runtime">
            {selectedLanguage}
          </span>

        </div>


        {/* OUTPUT */}
        <section className="output-section">

          <div className="output-header">

            <div className="output-title">

              <span className="terminal-icon">
                &gt;_
              </span>

              <span>OUTPUT</span>

            </div>

          </div>


          <div className="output-content">

            <span className="output-line"></span>

            <span>
              Ready to execute code...
            </span>

          </div>

        </section>


        {/* FOOTER */}
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