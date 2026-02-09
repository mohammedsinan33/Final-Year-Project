import io
from pypdf import PdfReader

MAX_RESUME_CHARS = 20000

def extract_resume_text(file_bytes: bytes) -> str:
    text = ""

    # 1. Handle PDF files
    if file_bytes.startswith(b'%PDF'):
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() or ""
            text = text.strip()
            
            if not text:
                return "Error: Could not extract text from this PDF. It might be an image-only PDF."
                
        except Exception as e:
            return f"Error: Failed to process PDF file. {str(e)}"

    # 2. Handle Text files (if not PDF)
    else:
        # Check for binary content that isn't PDF (like images/word docs)
        if b'\0' in file_bytes:
             return "Error: Binary file format not supported. Please upload a PDF or text (.txt) file."
        
        text = file_bytes.decode("utf-8", errors="ignore").strip()
        if not text:
            text = file_bytes.decode("latin-1", errors="ignore").strip()

    # 3. Final cleanup and truncation
    if len(text) > MAX_RESUME_CHARS:
        text = text[:MAX_RESUME_CHARS]
        
    return text