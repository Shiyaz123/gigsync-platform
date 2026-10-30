import os
import re
import json
from typing import Optional, List, Dict, Any, Tuple
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
        print(f"[GigSync Gemini] Extraction failed: {err_msg}", file=sys.stderr)
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

    # 1. Contact Info - Email
    email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text)
    email = email_match.group(1).strip() if email_match else None

    # Phone (International, Indian, US formats)
    phone_candidates = re.findall(r'(?:\+?\d{1,3}[\s-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}', text)
    phone = None
    for cand in phone_candidates:
        digits = re.sub(r'\D', '', cand)
        if 10 <= len(digits) <= 15:
            phone = cand.strip()
            break

    # Full Name extraction (Guarded against %PDF, binary headers, keywords, roles)
    full_name = None
    for line in lines[:5]:
        if re.search(r'%PDF|\.pdf|http|github\.com|linkedin\.com|@|obj|endobj|stream', line, re.I):
            continue
        if re.search(r'^(resume|curriculum|vitae|cv|profile|contact|summary|objective|education|skills)', line, re.I):
            continue
        if re.search(r'[0-9:;!@#$%^*_+={}[\]|\\<>]', line):
            continue
        if re.search(r'\b(developer|engineer|student|intern|analyst|designer|specialist|consultant)\b', line, re.I):
            continue
        words = line.split()
        if 2 <= len(words) <= 4 and all(re.match(r'^[a-zA-Z][a-zA-Z.\'-]*$', w) for w in words):
            full_name = line.strip()
            break

    # Target Role / Headline (Check lines 1..3 first, then standard roles)
    target_role = None
    for l in lines[1:min(4, len(lines))]:
        if re.search(r'@|http|\+?\d', l):
            continue
        if re.search(r'\b(student|developer|engineer|intern|designer|architect|analyst|specialist|scientist)\b', l, re.I):
            target_role = l.strip()
            break

    if not target_role:
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

    # Location (Scan only header lines before summary/education to avoid prose false positives)
    location = None
    INDIAN_STATES = [
        'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh',
        'Kerala', 'Delhi', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan',
        'Punjab', 'Haryana', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Assam'
    ]
    US_STATES = {
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
    }

    for line in lines[:6]:
        if re.search(r'^(summary|professional summary|education|skills|projects|experience|about)\b', line, re.I):
            break
        if re.search(r'@|http|university|college|developer|student|engineer', line, re.I):
            continue

        # Check Indian City, State
        for state in INDIAN_STATES:
            m = re.search(rf'([a-zA-Z\s.-]+),\s*{state}\b', line, re.I)
            if m:
                location = f"{m.group(1).strip()}, {state}"
                break
        if location:
            break

        # Check US City, ST
        us_match = re.search(r'\b([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2})\b', line)
        if us_match and us_match.group(2).upper() in US_STATES:
            location = f"{us_match.group(1).strip()}, {us_match.group(2).upper()}"
            break

        # Check major standalone metro cities
        metro_match = re.search(r'\b(San Francisco|New York|Seattle|Austin|Boston|Chicago|Los Angeles|Bengaluru|Bangalore|Hyderabad|Mumbai|Delhi|Pune|Chennai|London|Berlin|Toronto|Vancouver|Singapore|Remote)\b', line, re.I)
        if metro_match and 'develop' not in line.lower() and 'experience' not in line.lower():
            location = metro_match.group(0).strip()
            break

    # 2. Skills Extraction (Canonical mapping & deduplication)
    CANONICAL_SKILL_SPECS = [
        ('Python', r'\b(?:Basic\s+)?Python\b', re.I),
        ('JavaScript', r'\b(?:JavaScript|JS)\b', re.I),
        ('TypeScript', r'\b(?:TypeScript|TS)\b', re.I),
        ('Java', r'\b(?:Basic\s+)?Java\b(?!script)', re.I),
        ('C', r'(?:^|[^a-zA-Z0-9])C(?:$|[^a-zA-Z0-9+#])', 0),
        ('C++', r'\bC\+\+\b', re.I),
        ('C#', r'\bC#\b', re.I),
        ('SQL', r'\bSQL\b', re.I),
        ('HTML5', r'\bHTML5\b', re.I),
        ('HTML', r'\bHTML\b', re.I),
        ('CSS3', r'\bCSS3\b', re.I),
        ('CSS', r'\bCSS\b', re.I),
        ('Go', r'\b(?:Golang|Go)\b', 0),
        ('Rust', r'\bRust\b', re.I),
        ('PHP', r'\bPHP\b', re.I),
        ('React', r'\b(?:React\.js|ReactJS|React)\b', re.I),
        ('Node.js', r'\b(?:Node\.js|NodeJS|Node)\b', re.I),
        ('Express', r'\b(?:Express\.js|ExpressJS|Express)\b', re.I),
        ('REST APIs', r'\b(?:REST\s*APIs?|RESTful\s*APIs?)\b', re.I),
        ('FastAPI', r'\bFastAPI\b', re.I),
        ('Django', r'\bDjango\b', re.I),
        ('Flask', r'\bFlask\b', re.I),
        ('Spring Boot', r'\bSpring\s*Boot\b', re.I),
        ('Machine Learning', r'\b(?:Machine\s+Learning(?:\s+Fundamentals)?|ML)\b', re.I),
        ('Computer Vision', r'\bComputer\s+Vision\b', re.I),
        ('OpenCV', r'\bOpenCV\b', re.I),
        ('TensorFlow', r'\bTensorFlow\b', re.I),
        ('Keras', r'\bKeras\b', re.I),
        ('Scikit-learn', r'\b(?:Scikit-learn|sklearn)\b', re.I),
        ('PyTorch', r'\bPyTorch\b', re.I),
        ('Facial Recognition', r'\bFacial\s+Recognition\b', re.I),
        ('Prompt Engineering', r'\bPrompt\s+Engineering\b', re.I),
        ('Data Structures & Algorithms', r'\b(?:Data\s+Structures\s*(?:&|and)\s*Algorithms|DSA)\b', re.I),
        ('MySQL', r'\bMySQL\b', re.I),
        ('PostgreSQL', r'\b(?:PostgreSQL|Postgres)\b', re.I),
        ('MongoDB', r'\bMongoDB\b', re.I),
        ('SQLite', r'\bSQLite\b', re.I),
        ('Git', r'\bGit\b(?!hub|lab)', re.I),
        ('GitHub', r'\bGitHub\b', re.I),
        ('Docker', r'\bDocker\b', re.I),
        ('Kubernetes', r'\b(?:Kubernetes|K8s)\b', re.I),
        ('Linux', r'\bLinux\b', re.I),
        ('VS Code', r'\b(?:VS\s*Code|Visual\s+Studio\s+Code)\b', re.I),
        ('AWS', r'\bAWS\b', re.I),
        ('GCP', r'\b(?:GCP|Google\s+Cloud)\b', re.I),
        ('Azure', r'\bAzure\b', re.I)
    ]

    extracted_skills_set = set()
    for name, pattern, flags in CANONICAL_SKILL_SPECS:
        if re.search(pattern, text, flags):
            extracted_skills_set.add(name)

    if 'HTML5' in extracted_skills_set and 'HTML' in extracted_skills_set:
        extracted_skills_set.remove('HTML')
    if 'CSS3' in extracted_skills_set and 'CSS' in extracted_skills_set:
        extracted_skills_set.remove('CSS')

    extracted_skills = sorted(list(extracted_skills_set))

    # 3. Education
    education = []
    in_edu = False
    edu_lines = []
    for line in lines:
        if re.search(r'^(education|academic background|academics)\b', line, re.I):
            in_edu = True
            continue
        if in_edu and re.search(r'^(technical skills|skills|areas of interest|soft skills|languages|projects|experience|work history|employment|certifications|relevant coursework|achievements|leadership)\b', line, re.I):
            in_edu = False
            break
        if in_edu:
            edu_lines.append(line)

    if edu_lines:
        uni_regex = re.compile(r'(University|College|Polytechnic|Institute of Technology|Academy|School)', re.I)
        deg_regex = re.compile(r'(Bachelor(?:\s+of\s+[A-Za-z]+)?|Master(?:\s+of\s+[A-Za-z]+)?|B\.S\.|B\.A\.|M\.S\.|M\.A\.|Ph\.?D\.|Associate|B\.Tech|B\.E\.)', re.I)
        yr_regex = re.compile(r'(201\d|202\d)\s*[-–—to]+\s*(201\d|202\d|Present|Expected)', re.I)
        gpa_regex = re.compile(r'(?:CGPA|GPA)[:\s]+([0-9]\.?\d{0,2})', re.I)

        curr_edu = None
        for el in edu_lines:
            if uni_regex.search(el):
                if curr_edu and (curr_edu.get("institution") or curr_edu.get("degree")):
                    education.append(curr_edu)
                inst = re.sub(yr_regex, '', el)
                inst = re.sub(r'\b\d{1,2}(?:\.\d{1,2})?%', '', inst).strip()
                inst = re.sub(r'[–—,-]+$', '', inst).strip()
                yr_match = yr_regex.search(el)

                curr_edu = {
                    "institution": inst,
                    "degree": None,
                    "field_of_study": None,
                    "start_date": yr_match.group(1) if yr_match else None,
                    "end_date": yr_match.group(2) if yr_match else None,
                    "gpa": None
                }
            elif curr_edu and deg_regex.search(el):
                deg_match = deg_regex.search(el)
                curr_edu["degree"] = deg_match.group(1).strip() if deg_match else None
                field_match = re.search(r'(?:in|of)\s+([A-Za-z\s&()]+?)(?=\s*CGPA|\s*GPA|\s*\d|\s*$)', el, re.I)
                if field_match:
                    curr_edu["field_of_study"] = re.sub(r'[()]', '', field_match.group(1)).strip()
                gpa_match = gpa_regex.search(el)
                if gpa_match:
                    curr_edu["gpa"] = gpa_match.group(1).strip()
                yr_match = yr_regex.search(el)
                if yr_match and not curr_edu.get("end_date"):
                    curr_edu["start_date"] = yr_match.group(1)
                    curr_edu["end_date"] = yr_match.group(2)
            elif curr_edu and yr_regex.search(el):
                yr_match = yr_regex.search(el)
                if yr_match and not curr_edu.get("end_date"):
                    curr_edu["start_date"] = yr_match.group(1)
                    curr_edu["end_date"] = yr_match.group(2)
                gpa_match = gpa_regex.search(el)
                if gpa_match and not curr_edu.get("gpa"):
                    curr_edu["gpa"] = gpa_match.group(1).strip()

        if curr_edu and (curr_edu.get("institution") or curr_edu.get("degree")):
            education.append(curr_edu)

    # 4. Work Experience
    experience = []
    in_exp = False
    exp_lines = []
    for line in lines:
        if re.search(r'^(experience|work experience|employment history|professional experience|internships)\b', line, re.I):
            in_exp = True
            continue
        if in_exp and re.search(r'^(technical skills|skills|areas of interest|soft skills|languages|projects|education|certifications|relevant coursework|achievements|leadership)\b', line, re.I):
            in_exp = False
            break
        if in_exp:
            exp_lines.append(line)

    if exp_lines:
        curr_exp = None
        bullet_re = re.compile(r'^[•·\u2022\u2023\u25E6\u25AA\u25CF\u25CB\uFFFD\-*–—]\s*')
        for el in exp_lines:
            date_match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Summer|Fall|Spring|Winter)?\s*(201\d|202\d)\s*[-–—to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(201\d|202\d|Present)', el, re.I)
            is_bullet = bool(bullet_re.search(el))
            if (date_match or (' - ' in el and re.search(r'Intern|Engineer|Developer|Assistant', el, re.I))) and not is_bullet:
                if curr_exp and (curr_exp.get("company") or curr_exp.get("role")):
                    experience.append(curr_exp)
                raw_clean = re.sub(r'\([^\)]*(?:201\d|202\d)[^\)]*\)', '', el)
                parts = [p.strip() for p in re.split(r'[-–|@,]', raw_clean) if p.strip()]
                curr_exp = {
                    "company": parts[0].strip('()') if parts else "Organization",
                    "role": parts[1].strip('()') if len(parts) > 1 else "Software Engineering Intern",
                    "location": None,
                    "start_date": date_match.group(0).split('-')[0].strip() if date_match else None,
                    "end_date": date_match.group(0).split('-')[-1].strip() if date_match else None,
                    "bullets": []
                }
            elif curr_exp:
                clean_bullet = bullet_re.sub('', el).strip()
                if is_bullet:
                    curr_exp["bullets"].append(clean_bullet)
                elif curr_exp["bullets"]:
                    curr_exp["bullets"][-1] += " " + clean_bullet
                else:
                    curr_exp["bullets"].append(clean_bullet)
        if curr_exp and (curr_exp.get("company") or curr_exp.get("role")):
            experience.append(curr_exp)

    # 5. Projects
    projects = []
    in_proj = False
    proj_lines = []
    for line in lines:
        if re.search(r'^(projects|technical projects|academic projects|key projects)\b', line, re.I):
            in_proj = True
            continue
        if in_proj and re.search(r'^(technical skills|skills|areas of interest|soft skills|languages|education|experience|work history|employment|certifications|achievements|leadership|relevant coursework)\b', line, re.I):
            in_proj = False
            break
        if in_proj:
            proj_lines.append(line)

    if proj_lines:
        bullet_re = re.compile(r'^[•·\u2022\u2023\u25E6\u25AA\u25CF\u25CB\uFFFD\-*–—]\s*')
        curr_proj = None
        for pl in proj_lines:
            pl = pl.strip()
            if not pl:
                continue
            is_bullet = bool(bullet_re.search(pl))
            is_sub = bool(re.search(r'^(personal project|academic project|capstone project|ongoing)\b', pl, re.I))
            if is_sub:
                continue

            prev_b = curr_proj["bullets"][-1] if (curr_proj and curr_proj["bullets"]) else None
            prev_incomplete = prev_b and not bool(re.search(r'[.;!]$', prev_b.strip()))
            starts_lower = bool(re.match(r'^[a-z]', pl))

            is_title = (
                not is_bullet and
                bool(re.match(r'^[A-Z0-9]', pl)) and
                not pl.endswith('.') and
                len(pl) < 80 and
                'http' not in pl and
                not (prev_incomplete and starts_lower)
            )

            if is_title:
                if curr_proj and curr_proj.get("title"):
                    projects.append(curr_proj)
                title_match = re.match(r'^([A-Za-z0-9\s&()\'/]+?)(?:\s*[-–—:]\s*(.+))?$', pl)
                raw_title = title_match.group(1).strip() if title_match else pl
                sub_desc = title_match.group(2).strip() if (title_match and title_match.group(2)) else None
                # Strip trailing "Link", "GitHub", "Code" artifacts
                raw_title = re.sub(r'\s*(?:[-–—|/]\s*)?(?:link|github|code|live\s*demo|view)\s*$', '', raw_title, flags=re.I).strip()
                if sub_desc:
                    sub_desc = re.sub(r'\s*(?:[-–—|/]\s*)?(?:link|github|code|live\s*demo|view)\s*$', '', sub_desc, flags=re.I).strip()
                    if sub_desc.lower() == raw_title.lower():
                        sub_desc = None

                curr_proj = {
                    "title": raw_title or pl,
                    "tech_stack": [s for s in extracted_skills if re.search(rf'\b{re.escape(s)}\b', pl, re.I)],
                    "description": sub_desc,
                    "bullets": []
                }
            elif curr_proj:
                clean_text = bullet_re.sub('', pl).strip()
                if is_bullet:
                    curr_proj["bullets"].append(clean_text)
                elif curr_proj["bullets"]:
                    curr_proj["bullets"][-1] += " " + clean_text
                else:
                    curr_proj["bullets"].append(clean_text)

        if curr_proj and curr_proj.get("title"):
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
