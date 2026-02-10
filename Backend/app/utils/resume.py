import io
import re

MAX_RESUME_CHARS = 20000

def clean_text(text: str) -> str:
    """
    Cleans extracted text to be more 'Markdown-like' and readable.
    Removes excessive whitespace and weird characters.
    """
    # Replace multiple newlines with a double newline (paragraph break)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    # Replace multiple spaces with single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Remove non-printable characters (except standard whitespace)
    text = "".join(ch for ch in text if ch.isprintable() or ch in "\n\r\t")
    return text.strip()

def extract_resume_text(file_bytes: bytes, filename: str = "") -> str:
    text = ""
    filename_lower = filename.lower()
    
    # 1. Attempt PDF Extraction
    if filename_lower.endswith(".pdf") or file_bytes.startswith(b"%PDF"):
        try:
            import pypdf
            pdf_file = io.BytesIO(file_bytes)
            reader = pypdf.PdfReader(pdf_file)
            extracted_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_parts.append(page_text)
            text = "\n".join(extracted_parts)
        except ImportError:
            print("WARNING: pypdf not installed. Install with `pip install pypdf`")
        except Exception as e:
            print(f"PDF extract error: {e}")
            # fall through to text decode

    # 2. If no text from PDF (or it wasn't a PDF), try text decoding
    if not text.strip():
        # Try UTF-8 first
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            # Try Latin-1 (common for older docs)
            try:
                text = file_bytes.decode("latin-1")
            except Exception:
                # Force decode ignoring errors
                text = file_bytes.decode("utf-8", errors="ignore")

    # 3. Clean and Truncate
    text = clean_text(text)
    
    if len(text) > MAX_RESUME_CHARS:
        text = text[:MAX_RESUME_CHARS] + "\n...(truncated)"
        
    return text