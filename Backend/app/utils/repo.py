import os
import subprocess
import shutil
import stat
from typing import List

IGNORE_DIRS = {"node_modules", "build", "dist", ".git", "__pycache__", ".venv", "venv"}
ALLOWED_EXTS = {".js", ".jsx", ".ts", ".tsx", ".py", ".html", ".css"} # Added a few common ones

def clone_repo(repo_url: str, target_dir: str) -> str:
    repo_path = os.path.join(target_dir, "repo")
    try:
        # Check if git is available
        subprocess.run(["git", "--version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, repo_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
    except FileNotFoundError:
         raise ValueError("Git is not installed on the server. Please install Git.")
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.strip()
        if "Repository not found" in error_msg:
             raise ValueError(f"Repository not found or private: {repo_url}")
        raise ValueError(f"Failed to clone repo: {error_msg or 'unknown error'}")
    return repo_path

def find_src_dir(repo_path: str) -> str:
    direct_src = os.path.join(repo_path, "src")
    if os.path.isdir(direct_src):
        return direct_src
    
    # If no 'src', consider the root as source, but respect IGNORE_DIRS
    # OR search for 'src' deeper. Let's stick to searching for now, 
    # but fall back to repo root if not found (common in Python/small projects)
    for root, dirs, _ in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        if os.path.basename(root) == "src":
            return root
            
    return repo_path # Fallback to root if no src folder found

def _is_allowed_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in ALLOWED_EXTS

def read_source_files(src_path: str) -> str:
    parts: List[str] = []
    
    # Walk safely
    for root, dirs, files in os.walk(src_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for filename in files:
            if not _is_allowed_file(filename):
                continue
            file_path = os.path.join(root, filename)
            try:
                # Use base of src_path for relative paths
                rel_path = os.path.relpath(file_path, src_path)
                
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    # Skip massive files (mock data, minified code)
                    if len(content) > 100000: 
                        continue
                    parts.append(f"// --- file: {rel_path} ---\n{content}")
            except Exception:
                continue

    if not parts:
        raise FileNotFoundError("No analysis-supported source files found in the repository.")
    
    # Limit total size to avoid LLM token limits (approx 100k chars)
    full_text = "\n\n".join(parts)
    if len(full_text) > 150000:
        full_text = full_text[:150000] + "\n... (truncated)"
    return full_text

# Helper to delete read-only files on Windows
def on_rm_error(func, path, exc_info):
    os.chmod(path, stat.S_IWRITE)
    func(path)