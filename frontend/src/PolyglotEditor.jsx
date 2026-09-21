import { useState } from "react";
import Editor from "@monaco-editor/react";

const languages = {
  Java: {
    language: "java",
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java");
    }
}`,
  },

  Python: {
    language: "python",
    code: `print("Hello from Python")`,
  },

  JavaScript: {
    language: "javascript",
    code: `console.log("Hello from JavaScript");`,
  },
};

function PolyglotEditor() {
  const [selectedLanguage, setSelectedLanguage] = useState("Python");

  const currentLanguage = languages[selectedLanguage];

  return (
    <div>
      <h1>PolyglotMesh IDE</h1>

      <div>
        {Object.keys(languages).map((language) => (
          <button
            key={language}
            onClick={() => setSelectedLanguage(language)}
          >
            {language}
          </button>
        ))}
      </div>

      <Editor
        height="500px"
        theme="vs-dark"
        language={currentLanguage.language}
        value={currentLanguage.code}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
}

export default PolyglotEditor;