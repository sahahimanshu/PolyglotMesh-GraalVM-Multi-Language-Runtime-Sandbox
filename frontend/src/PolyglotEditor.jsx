import { useState } from "react";
import Editor from "@monaco-editor/react";
import "./PolyglotEditor.css";

const languages = {
    Python: {
        language: "python",
        icon: "🐍",
        code: 'print("Hello from PolyglotMesh")',
    },
    JavaScript: {
        language: "javascript",
        icon: "JS",
        code: 'console.log("Hello from JavaScript");',
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
const SCRIPTS_API = "http://localhost:8080/api/scripts";

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

    const [scriptName, setScriptName] = useState("My Script");
    const [savedScripts, setSavedScripts] = useState([]);
    const [selectedScriptId, setSelectedScriptId] = useState("");
    const [isSavingScript, setIsSavingScript] = useState(false);
    const [isLoadingScripts, setIsLoadingScripts] = useState(false);

    const currentLanguage = languages[selectedLanguage];

    const endpoints = {
        Python: `${API_BASE}/python`,
        JavaScript: `${API_BASE}/javascript`,
        Java: `${API_BASE}/java`,
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

    const handleRunCode = async () => {
        if (!code.trim()) {
            setOutput("Please enter some code before running.");
            return;
        }

        setIsRunning(true);
        setOutput("Executing...");
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

            setExecutionTime(
                `${(performance.now() - startTime).toFixed(2)} ms`
            );

            if (!response.ok) {
                setOutput(`Execution failed:\n${result}`);
            } else {
                setOutput(result || "Code executed successfully.");
            }
        } catch (error) {
            setOutput(
                `Unable to connect to the backend.\n${error.message}`
            );
        } finally {
            setIsRunning(false);
        }
    };

    const handleSaveScript = async () => {
        if (!scriptName.trim()) {
            setOutput("Please enter a script name.");
            return;
        }

        setIsSavingScript(true);

        try {
            const response = await fetch(SCRIPTS_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    name: scriptName.trim(),
                    language: currentLanguage.language,
                    code,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || result.error || `HTTP ${response.status}`
                );
            }

            setSavedScripts((previous) => [
                result,
                ...previous.filter((item) => item.id !== result.id),
            ]);
            setSelectedScriptId(result.id);
            setOutput(`Script saved successfully: ${result.name}`);
        } catch (error) {
            setOutput(`Unable to save script:\n${error.message}`);
        } finally {
            setIsSavingScript(false);
        }
    };

    const handleLoadScripts = async () => {
        setIsLoadingScripts(true);

        try {
            const response = await fetch(SCRIPTS_API);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || result.error || `HTTP ${response.status}`
                );
            }

            setSavedScripts(result);

            if (result.length === 0) {
                setSelectedScriptId("");
                setOutput("No saved scripts found.");
            } else {
                setOutput(`Loaded ${result.length} saved script(s).`);
            }
        } catch (error) {
            setOutput(`Unable to load scripts:\n${error.message}`);
        } finally {
            setIsLoadingScripts(false);
        }
    };

    const handleSelectSavedScript = async (id) => {
        setSelectedScriptId(id);
        if (!id) return;

        try {
            const response = await fetch(
                `${SCRIPTS_API}/${encodeURIComponent(id)}`
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || result.error || `HTTP ${response.status}`
                );
            }

            const languageEntry = Object.entries(languages).find(
                ([, item]) => item.language === result.language
            );

            if (!languageEntry) {
                throw new Error(`Unsupported language: ${result.language}`);
            }

            setSelectedLanguage(languageEntry[0]);
            setCode(result.code || "");
            setScriptName(result.name || "My Script");
            setOutput(`Loaded script: ${result.name}`);
            setExecutionTime("--");
            resetMetrics();
        } catch (error) {
            setOutput(`Unable to open script:\n${error.message}`);
        }
    };

    const runPerformanceComparison = async () => {
        if (!code.trim()) {
            setOutput("Please enter some code first.");
            return;
        }

        setComparisonRunning(true);
        resetMetrics();
        setOutput("Running performance comparison...");

        try {
            const start1 = performance.now();

            const response1 = await fetch(endpoints[selectedLanguage], {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const result1 = await response1.text();
            const time1 = performance.now() - start1;

            if (!response1.ok) {
                throw new Error(result1);
            }

            const start2 = performance.now();

            const response2 = await fetch(`${API_BASE}/mock-rest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const result2 = await response2.text();
            const time2 = performance.now() - start2;

            if (!response2.ok) {
                throw new Error(result2);
            }

            setPolyglotTime(time1.toFixed(2));
            setMockRestTime(time2.toFixed(2));
            setPerformanceDifference((time2 - time1).toFixed(2));

            setOutput(
                `Performance comparison completed.\n\n` +
                `Language: ${selectedLanguage}\n` +
                `Polyglot response: ${result1}\n` +
                `Polyglot request time: ${time1.toFixed(2)} ms\n\n` +
                `Mock REST response: ${result2}\n` +
                `Mock REST request time: ${time2.toFixed(2)} ms\n\n` +
                `Difference: ${(time2 - time1).toFixed(2)} ms`
            );
        } catch (error) {
            resetMetrics();
            setOutput(`Performance comparison failed:\n${error.message}`);
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
                                </button>
                            ))}
                        </div>

                        <div className="toolbar-actions">
                            <input
                                className="small-button"
                                type="text"
                                value={scriptName}
                                onChange={(event) =>
                                    setScriptName(event.target.value)
                                }
                                placeholder="Script name"
                                aria-label="Script name"
                            />

                            <button
                                className="small-button"
                                type="button"
                                onClick={handleSaveScript}
                                disabled={isSavingScript}
                            >
                                {isSavingScript ? "Saving..." : "Save Script"}
                            </button>

                            <button
                                className="small-button"
                                type="button"
                                onClick={handleLoadScripts}
                                disabled={isLoadingScripts}
                            >
                                {isLoadingScripts ? "Loading..." : "Load Scripts"}
                            </button>

                            <select
                                className="small-button"
                                value={selectedScriptId}
                                onChange={(event) =>
                                    handleSelectSavedScript(event.target.value)
                                }
                                aria-label="Saved scripts"
                            >
                                <option value="">Choose saved script</option>
                                {savedScripts.map((script) => (
                                    <option key={script.id} value={script.id}>
                                        {script.name} ({script.language})
                                    </option>
                                ))}
                            </select>

                            <button
                                className="run-button"
                                type="button"
                                onClick={handleRunCode}
                                disabled={isRunning || comparisonRunning}
                            >
                                {isRunning ? "Running..." : "▶ Run Code"}
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
                                    bracketPairColorization: {
                                        enabled: true,
                                    },
                                }}
                            />
                        </div>
                    </section>

                    <section className="performance-section">
                        <div className="performance-header">
                            <div>
                                <h2>Performance Metrics</h2>
                                <p>Polyglot Engine vs Traditional REST</p>
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
                                    <span className="metric-label">Mock REST</span>
                                    <strong className="metric-value">
                                        {mockRestTime === "--"
                                            ? "-- ms"
                                            : `${mockRestTime} ms`}
                                    </strong>
                                    <span className="metric-description">
                                        Includes simulated delay
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
                                <span className="prompt-path">~/sandbox</span>
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