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

const API_BASE = "http://localhost:8080/api/execute";

function PolyglotEditor() {
    const [selectedLanguage, setSelectedLanguage] = useState("Python");
    const [code, setCode] = useState(languages.Python.code);
    const [output, setOutput] = useState(
        'Welcome to PolyglotMesh. Press "Run Code" to execute your program.'
    );
    const [isRunning, setIsRunning] = useState(false);
    const [executionTime, setExecutionTime] = useState("--");

    const [polyglotTime, setPolyglotTime] = useState("--");
    const [mockRestTime, setMockRestTime] = useState("--");
    const [performanceDifference, setPerformanceDifference] =
        useState("--");
    const [comparisonRunning, setComparisonRunning] = useState(false);

    const currentLanguage = languages[selectedLanguage];

    const endpoints = {
        Python: `${API_BASE}/python`,
        JavaScript: `${API_BASE}/javascript`,
        Java: `${API_BASE}/java`,
    };

    const isExecutionError = (result) => {
        const errorPatterns = [
            /execution timed out/i,
            /execution error/i,
            /python execution error/i,
            /javascript execution error/i,
            /execution interrupted/i,
            /execution cancelled/i,
            /compilation failed/i,
            /java execution error/i,
            /requires an isolated process/i,
            /^error:/i,
        ];

        return errorPatterns.some((pattern) =>
            pattern.test(result || "")
        );
    };

    const resetMetrics = () => {
        setPolyglotTime("--");
        setMockRestTime("--");
        setPerformanceDifference("--");
    };

    const handleLanguageChange = (language) => {
        if (isRunning || comparisonRunning) return;

        setSelectedLanguage(language);
        setCode(languages[language].code);
        setOutput(`Ready to execute ${language} code...`);
        setExecutionTime("--");
        resetMetrics();
    };

    // Execute code in Python, JavaScript, or Java.
    const handleRunCode = async () => {
        if (!code.trim()) {
            setOutput("Please enter some code before running.");
            return;
        }

        setIsRunning(true);
        setOutput("Executing...");
        setExecutionTime("--");

        const startTime = performance.now();

        try {
            const response = await fetch(endpoints[selectedLanguage], {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/plain",
                },
                body: JSON.stringify({ code }),
            });

            const result = await response.text();
            const elapsed = performance.now() - startTime;

            setExecutionTime(`${elapsed.toFixed(2)} ms`);

            if (!response.ok) {
                setOutput(`Execution failed:\n${result}`);
                return;
            }

            if (isExecutionError(result)) {
                setOutput(`Execution failed:\n${result}`);
                return;
            }

            setOutput(result || "Code executed successfully.");
        } catch (error) {
            setExecutionTime("--");
            setOutput(
                "Unable to connect to PolyglotMesh backend.\n\n" +
                "Make sure the backend is running on port 8080.\n" +
                `Details: ${error.message}`
            );
        } finally {
            setIsRunning(false);
        }
    };

    // Compare Polyglot execution against the mock REST endpoint.
    const runPerformanceComparison = async () => {
        if (!code.trim()) {
            setOutput("Please enter some code before comparing performance.");
            return;
        }

        setComparisonRunning(true);
        resetMetrics();
        setOutput("Running performance comparison...");

        try {
            // Measure the language execution request.
            const polyglotStart = performance.now();

            const polyglotResponse = await fetch(
                endpoints[selectedLanguage],
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "text/plain",
                    },
                    body: JSON.stringify({ code }),
                }
            );

            const polyglotResult = await polyglotResponse.text();
            const polyglotElapsed = performance.now() - polyglotStart;

            if (!polyglotResponse.ok) {
                throw new Error(
                    `Polyglot request failed (${polyglotResponse.status}): ` +
                    polyglotResult
                );
            }

            if (isExecutionError(polyglotResult)) {
                throw new Error(
                    `Code execution failed:\n${polyglotResult}`
                );
            }

            // Measure the mock REST request separately.
            const restStart = performance.now();

            const restResponse = await fetch(`${API_BASE}/mock-rest`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/plain",
                },
                body: JSON.stringify({ code }),
            });

            const restResult = await restResponse.text();
            const restElapsed = performance.now() - restStart;

            if (!restResponse.ok) {
                throw new Error(
                    `Mock REST request failed (${restResponse.status}): ` +
                    restResult
                );
            }

            const difference = restElapsed - polyglotElapsed;

            setPolyglotTime(polyglotElapsed.toFixed(2));
            setMockRestTime(restElapsed.toFixed(2));
            setPerformanceDifference(difference.toFixed(2));

            setOutput(
                "Performance comparison completed successfully.\n\n" +
                `Language: ${selectedLanguage}\n` +
                `Polyglot response: ${polyglotResult || "(no output)"}\n` +
                `Polyglot request time: ${polyglotElapsed.toFixed(2)} ms\n\n` +
                `Mock REST response: ${restResult}\n` +
                `Mock REST request time: ${restElapsed.toFixed(2)} ms\n\n` +
                `Difference (REST - Polyglot): ${difference.toFixed(2)} ms`
            );
        } catch (error) {
            resetMetrics();

            setOutput(
                `Performance comparison failed:\n${error.message}\n\n` +
                "Check that the backend is running and try again."
            );
        } finally {
            setComparisonRunning(false);
        }
    };

    return (
        <div className="ide-page">
            <header className="topbar">
                <div className="brand">
                    <div className="brand-mark">P</div>
                    <div>
                        <div className="brand-name">PolyglotMesh</div>
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
                    <button className="icon-button" type="button">
                        ⚙
                    </button>
                </div>
            </header>

            <div className="ide-body">
                <aside className="sidebar">
                    <div className="sidebar-title">EXPLORER</div>

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
                        <div className="sidebar-title">RUNTIMES</div>

                        <div className="runtime-item">
                            <span className="runtime-icon python">🐍</span>
                            <div>
                                <strong>Python</strong>
                                <small>GraalPy</small>
                            </div>
                            <span className="runtime-online"></span>
                        </div>

                        <div className="runtime-item">
                            <span className="runtime-icon javascript">JS</span>
                            <div>
                                <strong>JavaScript</strong>
                                <small>GraalJS</small>
                            </div>
                            <span className="runtime-online"></span>
                        </div>

                        <div className="runtime-item">
                            <span className="runtime-icon java">☕</span>
                            <div>
                                <strong>Java</strong>
                                <small>JDK compiler</small>
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
                                    type="button"
                                    className={`language-tab ${
                                        selectedLanguage === language
                                            ? "selected"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleLanguageChange(language)
                                    }
                                    disabled={isRunning || comparisonRunning}
                                >
                                    <span
                                        className={`tab-icon ${language.toLowerCase()}`}
                                    >
                                        {languages[language].icon}
                                    </span>
                                    {language}
                                    {selectedLanguage === language && (
                                        <span className="tab-close">×</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="toolbar-actions">
                            <button
                                className="small-button"
                                type="button"
                                onClick={() =>
                                    handleLanguageChange(selectedLanguage)
                                }
                                disabled={isRunning || comparisonRunning}
                            >
                                ↻
                            </button>

                            <button
                                className="run-button"
                                type="button"
                                onClick={handleRunCode}
                                disabled={isRunning || comparisonRunning}
                            >
                                {isRunning ? (
                                    <>
                                        <span className="spinner"></span>
                                        Running...
                                    </>
                                ) : (
                                    <>▶ Run Code</>
                                )}
                            </button>
                        </div>
                    </div>

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
                                <span>{selectedLanguage}</span>
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
                                onChange={(value) => setCode(value || "")}
                                options={{
                                    automaticLayout: true,
                                    minimap: { enabled: true },
                                    fontSize: 14,
                                    lineHeight: 23,
                                    padding: { top: 20, bottom: 20 },
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

                    <section className="performance-section">
                        <div className="performance-header">
                            <div>
                                <h2>Performance Metrics</h2>
                                <p>
                                    Polyglot Engine vs Traditional REST
                                </p>
                            </div>

                            <button
                                className="comparison-button"
                                type="button"
                                onClick={runPerformanceComparison}
                                disabled={comparisonRunning || isRunning}
                            >
                                {comparisonRunning
                                    ? "Running..."
                                    : "Run Comparison"}
                            </button>
                        </div>

                        <div className="metrics-grid">
                            <div className="metric-card">
                                <div className="metric-icon">⚡</div>
                                <div className="metric-content">
                                    <span className="metric-label">
                                        Polyglot Engine
                                    </span>
                                    <strong className="metric-value">
                                        {polyglotTime === "--"
                                            ? "-- ms"
                                            : `${polyglotTime} ms`}
                                    </strong>
                                    <span className="metric-description">
                                        Browser-to-backend request
                                    </span>
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="metric-icon">🌐</div>
                                <div className="metric-content">
                                    <span className="metric-label">
                                        Mock REST
                                    </span>
                                    <strong className="metric-value">
                                        {mockRestTime === "--"
                                            ? "-- ms"
                                            : `${mockRestTime} ms`}
                                    </strong>
                                    <span className="metric-description">
                                        Includes simulated 50 ms delay
                                    </span>
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="metric-icon">📊</div>
                                <div className="metric-content">
                                    <span className="metric-label">
                                        Performance Difference
                                    </span>
                                    <strong className="metric-value">
                                        {performanceDifference === "--"
                                            ? "-- ms"
                                            : `${performanceDifference} ms`}
                                    </strong>
                                    <span className="metric-description">
                                        REST time − Polyglot time
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="console">
                        <div className="console-header">
                            <div className="console-tabs">
                                <span className="console-tab active">
                                    TERMINAL
                                </span>
                                <span className="console-tab">OUTPUT</span>
                                <span className="console-tab">PROBLEMS</span>
                            </div>

                            <div className="console-meta">
                                <span>Execution: {executionTime}</span>
                                <button
                                    className="clear-button"
                                    type="button"
                                    onClick={() => setOutput("Console cleared.")}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="console-body">
                            <div className="console-prompt">
                                <span className="prompt-symbol">❯</span>
                                <span className="prompt-text">
                                    PolyglotMesh
                                </span>
                                <span className="prompt-path">
                                    ~/sandbox
                                </span>
                            </div>

                            <pre className="console-output">{output}</pre>
                        </div>
                    </section>

                    <footer className="statusbar">
                        <div className="status-left">
                            <span>⬢ {selectedLanguage}</span>
                            <span>main</span>
                            <span>✓ Ready</span>
                        </div>

                        <div className="status-right">
                            <span>
                                Sandbox: <strong>ACTIVE</strong>
                            </span>
                            <span>Java 21</span>
                            <span>GraalVM</span>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}

export default PolyglotEditor;