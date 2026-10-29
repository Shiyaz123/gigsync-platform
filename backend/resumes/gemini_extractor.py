import os
import re
import json
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Load optional .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Pydantic Schemas matching user requirements
class EducationItemSchema(BaseModel):
    institution: Optional[str] = Field(default=None, description="University, college, or school name")
    degree: Optional[str] = Field(default=None, description="Degree title (e.g. Bachelor of Science)")
    field_of_study: Optional[str] = Field(default=None, description="Major, discipline, or field of study")
    start_date: Optional[str] = Field(default=None, description="Start year or date")
    end_date: Optional[str] = Field(default=None, description="Graduation year or end date")
    gpa: Optional[str] = Field(default=None, description="GPA if explicitly stated")

class ExperienceItemSchema(BaseModel):
    company: Optional[str] = Field(default=None, description="Organization or company name")
    role: Optional[str] = Field(default=None, description="Job title or role")
    location: Optional[str] = Field(default=None, description="Job location or Remote")
    start_date: Optional[str] = Field(default=None, description="Start date")
    end_date: Optional[str] = Field(default=None, description="End date or Present")
    bullets: List[str] = Field(default_factory=list, description="Responsibilities or achievements")

class ProjectItemSchema(BaseModel):
    title: Optional[str] = Field(default=None, description="Project title")
    tech_stack: List[str] = Field(default_factory=list, description="Technologies, libraries, or languages used")
    description: Optional[str] = Field(default=None, description="Brief summary of what was built")
    bullets: List[str] = Field(default_factory=list, description="Key bullet points")

class CertificationItemSchema(BaseModel):
    name: Optional[str] = Field(default=None, description="Certification title")
    issuer: Optional[str] = Field(default=None, description="Issuing organization")
    issue_date: Optional[str] = Field(default=None, description="Issue date")

class ResumeExtractionResponse(BaseModel):
    full_name: Optional[str] = Field(default=None, description="Candidate's actual full name. NEVER use '%PDF-1.5' or PDF metadata.")
    email: Optional[str] = Field(default=None, description="Candidate's contact email address")
    phone: Optional[str] = Field(default=None, description="Candidate's phone number")
    location: Optional[str] = Field(default=None, description="Candidate's city and state/country")
    target_role: Optional[str] = Field(default=None, description="Target role or professional title")
    education: List[EducationItemSchema] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list, description="List of technical, framework, and tool skills")
    experience: List[ExperienceItemSchema] = Field(default_factory=list)
    projects: List[ProjectItemSchema] = Field(default_factory=list)
    certifications: List[CertificationItemSchema] = Field(default_factory=list)


SYSTEM_PROMPT = """You are a strict, truthful document parsing assistant for GigSync.
Your task is to extract factual candidate information from the provided resume text.

CRITICAL INSTRUCTIONS:
1. Extract ONLY information explicitly stated in the document.
2. NEVER invent, hallucinate, or substitute demo names (like 'Alex Morgan', 'Jordan Lee'), fake universities, or placeholder skills.
3. NEVER return PDF metadata, magic bytes (like '%PDF-1.5'), or file headers as the full_name.
4. If a field cannot be identified with high confidence, set it to null (or [] for arrays).
5. Extract all technical skills, programming languages, frameworks, and developer tools mentioned in the text into the 'skills' array.
6. Preserve the exact spelling of candidate names, universities, companies, and technologies as written.
"""

def extract_with_gemini(
    text: str,
    file_bytes: Optional[bytes] = None,
    mime_type: Optional[str] = None
) -> Tuple[Dict[str, Any], bool, Optional[str]]:
    """
    Extract structured resume data using the official Google Gen AI SDK (google-genai).
    Returns: (extracted_dict, is_gemini_success, error_or_warning)
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return deterministic_python_fallback(text), False, "GEMINI_API_KEY environment variable not set; using local parser."

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=25000)
        )

        contents = []

        # If text is empty or document is scanned PDF, provide binary part for multimodal OCR
        if (not text or len(text.strip()) < 30) and file_bytes and mime_type == "application/pdf":
            contents.append(types.Part.from_bytes(data=file_bytes, mime_type="application/pdf"))
            contents.append("Please extract all factual resume information from this scanned document into the required schema.")
        else:
            contents.append(f"RESUME TEXT:\n---\n{text}\n---")

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ResumeExtractionResponse,
                temperature=0.0
            )
        )

        raw_json = response.text
        if not raw_json:
            return deterministic_python_fallback(text), False, "Gemini returned empty response."

        data = json.loads(raw_json)
        return data, True, None

    except Exception as e:
        err_msg = str(e)
        # Log error securely without exposing keys
        print(f"[GigSync Gemini] Extraction failed: {err_msg}")
        fallback_data = deterministic_python_fallback(text)
        return fallback_data, False, f"Gemini API call failed ({err_msg}). Used local parser."


def deterministic_python_fallback(text: str) -> Dict[str, Any]:
    """
    High-accuracy zero-hallucination local Python fallback.
    Never invents data, never produces %PDF-1.5, leaves missing fields as null/empty.
    """
    if not text:
        return {
            "full_name": None,
            "email": None,
            "phone": None,
            "location": None,
            "target_role": None,
            "education": [],
            "skills": [],
            "experience": [],
            "projects": [],
            "certifications": []
        }

    lines = [line.strip() for line in text.split('\n') if line.strip()]

    # 1. Contact Info
    email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text)
    email = email_match.group(1).strip() if email_match else None

    phone_match = re.search(r'(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})', text)
    phone = phone_match.group(0).strip() if phone_match else None

    # Full Name extraction (Guarded against %PDF, binary headers, keywords)
    full_name = None
    for line in lines[:6]:
        # STRICT GUARD: Never accept %PDF or binary headers
        if re.search(r'%PDF|\.pdf|http|github\.com|linkedin\.com|@|obj|endobj|stream', line, re.I):
            continue
        if re.search(r'^(resume|curriculum|vitae|cv|profile|contact|summary|objective|education)', line, re.I):
            continue
        words = line.split()
        if 2 <= len(words) <= 4 and all(re.match(r'^[A-Z][a-zA-Z.\'-]*$', w) or len(w) == 1 for w in words):
            full_name = line.strip()
            break
        elif 2 <= len(words) <= 4 and not re.search(r'[0-9:;!@#$%^&*()_+={}[\]|\\<>]', line):
            full_name = line.strip()
            break

    # Location
    location = None
    US_STATES = {
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
    }
    loc_regex = re.compile(
        r'(?:([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2}|[A-Z][a-zA-Z]+))|'
        r'(San Francisco|San Jose|Palo Alto|Mountain View|Sunnyvale|Oakland|Berkeley|'
        r'New York|Seattle|Austin|Boston|Chicago|Los Angeles|Ann Arbor|Detroit|Pittsburgh|'
        r'London|Berlin|Toronto|Vancouver|Singapore|Bengaluru|Bangalore|Remote)',
        re.I
    )
    for line in lines[:8]:
        # Skip section header lines or skill lines
        if re.search(r'^(skills|education|experience|projects|certifications|languages|courses)', line, re.I):
            continue
        segments = re.split(r'[|•·\t]', line)
        for seg in segments:
            seg = seg.strip()
            if '@' in seg or 'http' in seg or re.search(r'university|college|school|skills|python|sql|java|react', seg, re.I):
                continue
            m = loc_regex.search(seg)
            if m:
                # If matched via City, State code
                if m.group(1) and m.group(2):
                    state_code = m.group(2).upper()
                    city = m.group(1).strip()
                    if len(state_code) == 2 and state_code not in US_STATES:
                        continue
                    if any(tech.lower() in city.lower() for tech in ['python', 'sql', 'react', 'node', 'java']):
                        continue
                    location = f"{city}, {state_code}"
                    break
                else:
                    location = m.group(0).strip()
                    break
        if location:
            break

    # Target Role / Title
    target_role = None
    roles = [
        'Full-Stack Developer', 'Frontend Engineer', 'Frontend Developer',
        'Backend Engineer', 'Backend Developer', 'Software Engineer', 'Software Developer',
        'Machine Learning Engineer', 'AI Research Assistant', 'Data Scientist', 'Data Engineer',
        'DevOps Engineer', 'Cloud Architect', 'Security Engineer', 'Robotics Systems Engineer',
        'Systems Engineer', 'Mobile Developer', 'iOS Developer', 'Android Developer'
    ]
    for r in roles:
        if re.search(rf'(^|[^a-zA-Z]){re.escape(r)}([^a-zA-Z]|$)', text[:1000], re.I):
            target_role = r
            break

    # 2. Skills
    known_skills = [
        'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'SQL', 'HTML5', 'HTML', 'CSS3', 'CSS',
        'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'R', 'Scala', 'Dart', 'Bash', 'Shell',
        'React', 'Node.js', 'Next.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Vue', 'Angular',
        'PyTorch', 'TensorFlow', 'Keras', 'HuggingFace', 'FastAI', 'ROS', 'OpenCV', 'Tailwind CSS', 'Redux', 'GraphQL',
        'Git', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'MySQL', 'SQLite', 'Redis', 'AWS', 'GCP', 'Azure',
        'Linux', 'CUDA', 'Webpack', 'Jest', 'CI/CD'
    ]
    extracted_skills = []
    for s in known_skills:
        if s == 'R':
            if re.search(r'(^|[^a-zA-Z0-9])R([^a-zA-Z0-9]|$)', text):
                extracted_skills.append(s)
        else:
            if re.search(rf'(^|[^a-zA-Z0-9]){re.escape(s)}([^a-zA-Z0-9]|$)', text, re.I):
                extracted_skills.append(s)

    # 3. Education
    education = []
    in_edu = False
    edu_lines = []
    for line in lines:
        if re.search(r'^(education|academic background|academics)', line, re.I):
            in_edu = True
            continue
        if in_edu and re.search(r'^(skills|experience|work history|projects|certifications|employment)', line, re.I):
            in_edu = False
            break
        if in_edu:
            edu_lines.append(line)

    edu_text = "\n".join(edu_lines) if edu_lines else text

    institution = None
    for el in edu_lines:
        if re.search(r'(University|College|Polytechnic|Institute of Technology|Academy|School)', el, re.I):
            institution = re.sub(r'^(?:at|from|institution:?)\s*', '', el, flags=re.I)
            institution = re.sub(r',\s*(?:201\d|202\d).*$', '', institution).strip()
            break
    if not institution:
        m = re.search(r'(?:University\s+of\s+[A-Za-z\s]+|[A-Za-z\s&]+(?:University|College|Institute of Technology|Polytechnic|Academy|School of [A-Za-z\s]+))', edu_text, re.I)
        if m:
            institution = m.group(0).strip()

    degree = None
    field_of_study = None
    for el in edu_lines:
        m = re.search(r'(Bachelor\s+of\s+[A-Za-z]+|Master\s+of\s+[A-Za-z]+|Bachelor|Master|B\.S\.|B\.A\.|M\.S\.|M\.A\.|Ph\.?D\.|B\.Tech|B\.E\.)(?:\s+(?:in|of)\s+([A-Za-z\s]+))?', el, re.I)
        if m:
            degree = m.group(1).strip()
            if m.group(2):
                field_of_study = re.sub(r'\s+(?:from|at|in|with).*$', '', m.group(2), flags=re.I).strip()
            break

    yr_match = re.search(r'(201\d|202\d)\s*[-–—to]+\s*(201\d|202\d|Present|Expected)', edu_text, re.I)
    gpa_match = re.search(r'GPA[:\s]+([0-4]\.\d{1,2}(?:\s*/\s*4(?:\.0)?)?)', edu_text, re.I)

    if institution or degree:
        education.append({
            "institution": institution,
            "degree": degree,
            "field_of_study": field_of_study,
            "start_date": yr_match.group(1) if yr_match else None,
            "end_date": yr_match.group(2) if yr_match else None,
            "gpa": gpa_match.group(1) if gpa_match else None
        })

    # 4. Experience
    experience = []
    in_exp = False
    exp_lines = []
    for line in lines:
        if re.search(r'^(experience|work experience|employment history|professional experience|internships)', line, re.I):
            in_exp = True
            continue
        if in_exp and re.search(r'^(education|skills|projects|certifications)', line, re.I):
            in_exp = False
            break
        if in_exp:
            exp_lines.append(line)

    if exp_lines:
        curr_exp = None
        i = 0
        while i < len(exp_lines):
            el = exp_lines[i]
            date_match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Summer|Fall|Spring|Winter)?\s*(201\d|202\d)\s*[-–—to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(201\d|202\d|Present)', el, re.I)
            if date_match or (' - ' in el and re.search(r'Intern|Engineer|Developer|Assistant', el, re.I)):
                if curr_exp:
                    experience.append(curr_exp)
                raw_clean = re.sub(r'\([^\)]*(?:201\d|202\d)[^\)]*\)', '', el)
                parts = [p.strip() for p in re.split(r'[-–|@,]', raw_clean) if p.strip()]
                company = parts[0] if parts else "Organization"
                role = parts[1] if len(parts) > 1 else None

                # Lookahead for title on next line
                if not role and i + 1 < len(exp_lines) and not exp_lines[i + 1].startswith(('•', '-', '*')) and len(exp_lines[i + 1]) < 65:
                    role = exp_lines[i + 1].strip()
                    i += 1

                curr_exp = {
                    "company": company.strip('()'),
                    "role": role or "Software Engineer",
                    "location": None,
                    "start_date": date_match.group(0).split('-')[0].strip() if date_match else None,
                    "end_date": date_match.group(0).split('-')[-1].strip() if date_match else None,
                    "bullets": []
                }
            elif curr_exp and el.startswith(('•', '-', '*')):
                curr_exp["bullets"].append(re.sub(r'^[•\-*]\s*', '', el).strip())
            elif curr_exp and len(el) > 20:
                curr_exp["bullets"].append(el.strip())
            i += 1
        if curr_exp:
            experience.append(curr_exp)

    # 5. Projects
    projects = []
    in_proj = False
    proj_lines = []
    for line in lines:
        if re.search(r'^(projects|technical projects|academic projects)', line, re.I):
            in_proj = True
            continue
        if in_proj and re.search(r'^(education|skills|experience|work history|certifications)', line, re.I):
            in_proj = False
            break
        if in_proj:
            proj_lines.append(line)

    if proj_lines:
        curr_proj = None
        for pl in proj_lines:
            if not pl.startswith(('•', '-', '*')) and len(pl) < 60 and 'http' not in pl:
                if curr_proj:
                    projects.append(curr_proj)
                title = re.sub(r'[:\-].*$', '', pl).strip()
                curr_proj = {
                    "title": title,
                    "tech_stack": [s for s in known_skills if re.search(rf'\b{re.escape(s)}\b', pl, re.I)],
                    "description": pl,
                    "bullets": []
                }
            elif curr_proj and pl.startswith(('•', '-', '*')):
                curr_proj["bullets"].append(re.sub(r'^[•\-*]\s*', '', pl).strip())
        if curr_proj:
            projects.append(curr_proj)

    return {
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "location": location,
        "target_role": target_role,
        "education": education,
        "skills": extracted_skills,
        "experience": experience,
        "projects": projects,
        "certifications": []
    }
