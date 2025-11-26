import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Configure API Key
if "API_KEY" in os.environ:
    genai.configure(api_key=os.environ["API_KEY"])

def generate_resume_content(user_data: dict, job_description: str) -> dict:
    """
    Generates a tailored resume JSON using Gemini Pro.
    """
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    You are an expert resume writer. Create a tailored resume for the following job description using the user's data.
    
    JOB DESCRIPTION:
    {job_description}
    
    USER DATA:
    {json.dumps(user_data)}
    
    INSTRUCTIONS:
    1. Analyze the job description for keywords and requirements.
    2. Select relevant experience and skills from the user data.
    3. Rewrite bullet points to match the job tone and keywords.
    4. Return the result strictly as a JSON object with the following structure:
    {{
        "full_name": "...",
        "contact_info": "...",
        "summary": "...",
        "skills": ["..."],
        "experience": [
            {{
                "role": "...",
                "company": "...",
                "duration": "...",
                "points": ["..."]
            }}
        ],
        "education": "..."
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean up code blocks if present
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Error generating resume: {e}")
        # Return a fallback or re-raise
        return {"error": str(e)}

def calculate_match_score(user_data: dict, job_description: str) -> dict:
    """
    Calculates a match score (0-100) and provides reasoning using Gemini.
    """
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    You are an expert HR recruiter. Analyze the match between the user's profile and the job description.
    
    JOB DESCRIPTION:
    {job_description}
    
    USER DATA:
    {json.dumps(user_data)}
    
    INSTRUCTIONS:
    1. Evaluate how well the user's skills, experience, and education match the job requirements.
    2. Assign a match score from 0 to 100.
    3. Provide a brief, constructive reasoning for the score (max 2 sentences).
    4. Return the result strictly as a JSON object with the following structure:
    {{
        "score": 85,
        "reasoning": "Good match for skills X and Y, but missing experience in Z."
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Error calculating match score: {e}")
        return {"error": str(e)}
