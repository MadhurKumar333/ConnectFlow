import React, { useRef, useState } from "react";
import JoditEditor from "jodit-react";
import { toast } from "react-toastify";
import "./Editor.css";

const Editor = () => {
  const editor = useRef(null);
  const [content, setContent] = useState("Start collaborating on your document here...");

  const handleSave = () => {
    toast.success("Document saved!");
  };

  return (
    <div className="editor-bg">
      <div className="editor-panel">
        <div className="editor-header">
          <h2>Document Editor</h2>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
        <JoditEditor
          ref={editor}
          value={content}
          config={{
            readonly: false,
            height: 400,
            toolbarAdaptive: false,
            toolbarSticky: false,
          }}
          onBlur={newContent => setContent(newContent)}
        />
      </div>
    </div>
  );
};

export default Editor;
