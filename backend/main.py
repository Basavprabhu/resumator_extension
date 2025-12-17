from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
import os
import logging
import json
from services.gemini import generate_resume_content, calculate_match_score
from services.pdf_gen import create_pdf_buffer

from fastapi.middleware.cors import CORSMiddleware

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

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
    logger.info("----- [GENERATE RESUME] Incoming Request -----")
    logger.info(f"User Data: {json.dumps(request.user_data, indent=2)}")
    logger.info(f"Job Description: {request.job_description}")
    
    # 1. Generate Content with AI
    resume_content = generate_resume_content(request.user_data, request.job_description)
    
    if "error" in resume_content:
        logger.error(f"[GENERATE RESUME] Error in content generation: {resume_content['error']}")
        raise HTTPException(status_code=500, detail=resume_content["error"])

    logger.info("----- [GENERATE RESUME] Generated Content (Summary) -----")
    # Log keys to verify structure without dumping huge text
    logger.info(f"Generated Keys: {list(resume_content.keys())}")
    
    # 2. Generate PDF
    pdf_buffer = create_pdf_buffer(resume_content)
    logger.info("[GENERATE RESUME] PDF Generated successfully")
    
    # 3. Return PDF
    return Response(content=pdf_buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=resume.pdf"})

@app.post("/api/match")
def match_score(request: ResumeRequest):
    logger.info("----- [MATCH SCORE] Incoming Request -----")
    logger.info(f"User Data: {json.dumps(request.user_data, indent=2)}")
    logger.info(f"Job Description: {request.job_description}")

    # Reuse ResumeRequest since it has the same structure (user_data + job_description)
    match_result = calculate_match_score(request.user_data, request.job_description)
    
    if "error" in match_result:
        logger.error(f"[MATCH SCORE] Error in calculation: {match_result['error']}")
        raise HTTPException(status_code=500, detail=match_result["error"])
        
    logger.info("----- [MATCH SCORE] Result -----")
    logger.info(f"Match Result: {json.dumps(match_result, indent=2)}")

    return match_result
