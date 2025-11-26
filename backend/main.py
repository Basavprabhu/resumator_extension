from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
import os
from services.gemini import generate_resume_content, calculate_match_score
from services.pdf_gen import create_pdf_buffer

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeRequest(BaseModel):
    user_data: dict
    job_description: str

@app.get("/")
def read_root():
    return {"Hello": "Resumator Backend"}

@app.post("/api/generate")
def generate_resume(request: ResumeRequest):
    # 1. Generate Content with AI
    resume_content = generate_resume_content(request.user_data, request.job_description)
    
    if "error" in resume_content:
        raise HTTPException(status_code=500, detail=resume_content["error"])

    # 2. Generate PDF
    pdf_buffer = create_pdf_buffer(resume_content)
    
    # 3. Return PDF
    # 3. Return PDF
    return Response(content=pdf_buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=resume.pdf"})

@app.post("/api/match")
def match_score(request: ResumeRequest):
    # Reuse ResumeRequest since it has the same structure (user_data + job_description)
    match_result = calculate_match_score(request.user_data, request.job_description)
    
    if "error" in match_result:
        raise HTTPException(status_code=500, detail=match_result["error"])
        
    return match_result
