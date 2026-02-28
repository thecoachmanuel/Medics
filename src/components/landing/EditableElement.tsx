"use client";
import React, { useState, useEffect } from "react";

interface EditableElementProps {
  tag?: React.ElementType;
  html: string;
  isEditable: boolean;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
}

const EditableElement: React.FC<EditableElementProps> = ({
  tag: Tag = "div",
  html,
  isEditable,
  onChange,
  className = "",
  multiline = false,
}) => {
  const [text, setText] = useState(html);

  useEffect(() => {
    setText(html);
  }, [html]);

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const newText = e.currentTarget.innerText;
    setText(newText);
    if (onChange && newText !== html) {
      onChange(newText);
    }
  };

  if (!isEditable) {
    return <Tag className={className}>{html}</Tag>;
  }

  return (
    <Tag
      className={`${className} outline-none border-b-2 border-dashed border-blue-300 hover:bg-blue-50 transition-colors cursor-text min-w-[20px]`}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
    >
      {text}
    </Tag>
  );
};

export default EditableElement;
