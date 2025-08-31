import { useState, KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder: string;
  label: string;
  maxTags?: number;
}

const TagInput = ({
  tags,
  setTags,
  placeholder,
  label,
  maxTags = 10,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      setTags([...tags, trimmedTag]);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const handleAddButtonClick = () => {
    handleAddTag(inputValue);
  };

  return (
    <div className="form-group">
      <label htmlFor="tag-input">{label}</label>
      <div className="tag-input-container">
        <div className="tag-input-wrapper">
          <input
            id="tag-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="form-input tag-input-field"
            disabled={tags.length >= maxTags}
          />
          <button
            type="button"
            onClick={handleAddButtonClick}
            className="btn btn-add-tag"
            disabled={!inputValue.trim() || tags.length >= maxTags}
          >
            Add
          </button>
        </div>
        {tags.length >= maxTags && (
          <small className="tag-limit-warning">
            Maximum {maxTags} tags allowed
          </small>
        )}
      </div>

      {tags.length > 0 && (
        <div className="tags-container">
          {tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="tag-remove"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
