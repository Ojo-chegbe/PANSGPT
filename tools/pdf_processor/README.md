# PansGPT PDF Processor

A tool to convert PDF lecture slides into text files with embedded image references for PansGPT Study Mode.

## Features

- Extracts text from PDF pages
- Extracts and uploads images to Supabase Storage
- Uses AI (Groq) to analyze diagrams and generate descriptions
- Outputs a `.txt` file ready for PansGPT upload

## Setup

### 1. Install dependencies

```bash
cd tools/pdf_processor
pip install -r requirements.txt
```

### 2. Configure environment

Create a `.env` file in this folder:

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Create Supabase Storage bucket

1. Go to your Supabase dashboard → Storage
2. Create a new bucket called `lecture-images`
3. Make it **public** (so images can be displayed in Study Mode)

## Usage

### Run the tool

```bash
cd tools/pdf_processor
streamlit run app.py
```

This opens a web interface at `http://localhost:8501`

### Process a PDF

1. Upload your PDF lecture file
2. Click "Process PDF"
3. Wait for processing (may take a few minutes for large files with many images)
4. Download the processed `.txt` file
5. Upload the `.txt` to PansGPT's Upload page
6. View in Study Mode - images will display inline!

## How it works

The tool embeds images as special tokens in the text:

```
<<SLIDE_IMAGE: url="https://..." caption="Image 1 (Page 3)" context="AI-generated description of the image...">>
```

PansGPT's Study Mode detects these tokens and renders them as interactive image cards with:
- The actual image
- A caption
- An expandable AI-generated description
