export const MAX_QUESTION_LENGTH = 2000;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;
export const ALLOWED_FILE_EXTENSIONS = [".md", ".txt"];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateChatInput(text: string): ValidationResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { valid: false };
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return {
      valid: false,
      error: `Question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`,
    };
  }
  return { valid: true };
}

export function validateUploadFiles(files: File[]): ValidationResult {
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return {
      valid: false,
      error: `Maximum ${MAX_FILES_PER_UPLOAD} files per upload.`,
    };
  }
  for (const file of files) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: "Only .md and .txt files are supported.",
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: "File exceeds the 5MB size limit." };
    }
  }
  return { valid: true };
}

export function validateGitHubUsername(username: string): ValidationResult {
  if (username.trim().length === 0) {
    return { valid: false, error: "GitHub username is required." };
  }
  return { valid: true };
}

export function validateGitHubToken(token: string): ValidationResult {
  if (token.length === 0) return { valid: true };
  if (!token.startsWith("github_")) {
    return {
      valid: false,
      error: "Invalid token format. GitHub PATs start with github_.",
    };
  }
  return { valid: true };
}
