"""
PansGPT PDF Processor Tool
Extracts text and images from PDF lecture slides, uploads images to Supabase,
and uses AI vision to analyze diagrams. Outputs a .txt file ready for PansGPT upload.
"""

import streamlit as st
import os
import sys
import subprocess
import time
import base64
import requests
import re
import fitz  # PyMuPDF
from datetime import datetime

# --- SETUP PAGE CONFIG ---
st.set_page_config(
    page_title="PansGPT PDF Processor",
    page_icon="📄",
    layout="wide"
)

# --- HELPER: INSTALL PACKAGES ---
def install_package(package_name):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
    except subprocess.CalledProcessError:
        pass

# --- IMPORTS ---
try:
    from dotenv import load_dotenv
    from groq import Groq
except ImportError:
    install_package("python-dotenv")
    install_package("groq")
    from dotenv import load_dotenv
    from groq import Groq

load_dotenv()

# --- SECRETS MANAGEMENT ---
def get_secret(key):
    try:
        if key in st.secrets:
            return st.secrets[key]
    except Exception:
        pass
    return os.getenv(key)

GROQ_API_KEY = get_secret("GROQ_API_KEY")
SUPABASE_URL = get_secret("SUPABASE_URL")
SUPABASE_KEY = get_secret("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = "lecture-images"

# Initialize Groq client
groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)

# --- PROCESSING LOGIC ---

def upload_image_to_storage(image_bytes, filename):
    """Uploads image to Supabase Storage bucket"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        st.warning("Supabase credentials missing - using placeholder URL")
        return f"https://placeholder.url/{filename}"

    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{filename}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "image/png"
    }
    
    try:
        response = requests.post(url, data=image_bytes, headers=headers)
        final_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
        if response.status_code == 200 or response.status_code == 409 or "Duplicate" in response.text:
            return final_url
        st.warning(f"Upload failed for {filename}: {response.text}")
        return f"https://placeholder.url/{filename}"
    except Exception as e:
        st.warning(f"Upload error: {e}")
        return f"https://placeholder.url/{filename}"


def analyze_image_with_ai(image_bytes):
    """Use Groq Vision API to analyze the image"""
    if not groq_client:
        return "[AI analysis unavailable - Groq API key missing]"
    
    try:
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        prompt = """Analyze this pharmacy/medical slide image. 
        - If it contains a table, transcribe it to markdown format.
        - If it contains a diagram or pathway, describe it in detail.
        - If it contains text, transcribe it accurately.
        Return ONLY the content, no commentary."""
        
        response = groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct", 
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},
                ],
            }],
            max_tokens=1024,
            temperature=0.1,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[AI analysis error: {str(e)}]"


def process_pdf(uploaded_file):
    """Process PDF file, extract text and images with AI analysis"""
    doc = fitz.open(stream=uploaded_file.read(), filetype="pdf")
    full_content = ""
    image_count = 0
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    total_pages = len(doc)
    
    for page_num, page in enumerate(doc):
        progress_bar.progress((page_num + 1) / total_pages)
        status_text.text(f"Processing page {page_num + 1}/{total_pages}...")
        
        # Get text blocks sorted by position
        blocks = page.get_text("dict")["blocks"]
        blocks.sort(key=lambda b: b["bbox"][1])

        for block in blocks:
            if block["type"] == 0:  # Text block
                text = " ".join([
                    span["text"] 
                    for line in block["lines"] 
                    for span in line["spans"]
                ])
                if text.strip():
                    full_content += text.strip() + "\n\n"
            
            elif block["type"] == 1:  # Image block
                image_count += 1
                img_bytes = block["image"]
                
                # Skip tiny images (likely icons/artifacts)
                if len(img_bytes) < 2048:
                    continue
                
                # Generate unique filename
                clean_name = uploaded_file.name.split('.')[0].replace(" ", "_")
                filename = f"doc_{clean_name}_p{page_num}_img{image_count}.{block['ext']}"
                
                # Upload to Supabase
                public_url = upload_image_to_storage(img_bytes, filename)
                
                # Analyze with AI
                description = analyze_image_with_ai(img_bytes)
                
                # Clean description for embedding
                clean_desc = description.replace('"', "'").replace('\n', ' ')
                
                # Create image token
                token = f'\n<<SLIDE_IMAGE: url="{public_url}" caption="Image {image_count} (Page {page_num + 1})" context="{clean_desc}">>\n'
                
                full_content += token + "\n"
                
                # Rate limit safety
                time.sleep(1.0)

    progress_bar.progress(100)
    status_text.text("✅ Processing complete!")
    
    return full_content, image_count


# --- UI ---

st.title("📄 PansGPT PDF Processor")
st.markdown("Convert PDF lecture slides to text with embedded image references for Study Mode")

st.divider()

# Configuration status
col1, col2 = st.columns(2)
with col1:
    if GROQ_API_KEY:
        st.success("✅ Groq API connected")
    else:
        st.error("❌ Groq API key missing")
        st.caption("Add `GROQ_API_KEY` to `.env` file")

with col2:
    if SUPABASE_URL and SUPABASE_KEY:
        st.success("✅ Supabase connected")
    else:
        st.warning("⚠️ Supabase not configured")
        st.caption("Images will use placeholder URLs")

st.divider()

# File upload
uploaded_file = st.file_uploader("Upload PDF file", type=["pdf"])

if uploaded_file:
    st.info(f"📎 Selected: **{uploaded_file.name}** ({uploaded_file.size / 1024:.1f} KB)")
    
    if st.button("🚀 Process PDF", type="primary"):
        if not GROQ_API_KEY:
            st.error("Cannot process without Groq API key")
        else:
            with st.spinner("Processing... this may take a few minutes"):
                processed_text, num_images = process_pdf(uploaded_file)
                
                if processed_text:
                    st.success(f"✅ Processed successfully! Found {num_images} images.")
                    
                    # Preview
                    with st.expander("Preview output (first 2000 chars)"):
                        st.code(processed_text[:2000] + "..." if len(processed_text) > 2000 else processed_text)
                    
                    # Download button
                    output_filename = uploaded_file.name.replace(".pdf", "_processed.txt")
                    st.download_button(
                        label="📥 Download Processed Text",
                        data=processed_text,
                        file_name=output_filename,
                        mime="text/plain",
                        type="primary"
                    )
                    
                    st.info("👉 Upload this .txt file to PansGPT to use in Study Mode with images!")

st.divider()

# Instructions
with st.expander("ℹ️ How to use"):
    st.markdown("""
    ### Setup
    1. Create a `.env` file in this folder with:
       ```
       GROQ_API_KEY=your_groq_api_key
       SUPABASE_URL=your_supabase_url
       SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
       ```
    2. Create a storage bucket called `lecture-images` in Supabase
    3. Make the bucket public (for images to display)
    
    ### Usage
    1. Upload a PDF lecture file
    2. Click "Process PDF"
    3. Download the processed `.txt` file
    4. Upload the `.txt` to PansGPT's Upload page
    5. View in Study Mode - images will display inline!
    
    ### Image Token Format
    The tool embeds images as tokens like:
    ```
    <<SLIDE_IMAGE: url="..." caption="..." context="AI description...">>
    ```
    PansGPT's Study Mode renders these as interactive image cards.
    """)
