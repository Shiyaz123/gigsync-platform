import re
from typing import Dict, Any, List, Tuple

# Binary / PDF marker blacklist that must NEVER appear as candidate names or text
PDF_BINARY_BLACKLIST = [
    r'%PDF',
    r'%PDF-\d\.\d',
    r'obj\b',
    r'endobj\b',
    r'stream\b',
    r'endstream\b',
    r'xref\b',
    r'trailer\b',
    r'startxref\b',
    r'\x00',
    r'\.pdf\b',
    r'Adobe\s+Acrobat',
    r'Acrobat\s+PDFMaker'
]

FORBIDDEN_DEMO_NAMES = [
    'alex morgan',
    'jordan lee',
    'candidate name',
    'your name',
    'applicant name',
    'john doe',
    'jane doe'
]

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
PHONE_REGEX = re.compile(r'^\+?[0-9\s().-]{7,25}$')

def validate_extracted_resume(raw_data: Dict[str, Any], raw_text: str = "") -> Tuple[Dict[str, Any], List[str], int]:
    """
    Validates, sanitizes, and verifies the extracted resume schema.
    Strictly prevents %PDF-1.5, binary headers, and hallucinatory demo data.
    Returns: (cleaned_dict, warnings, confidence_score)
    """
    warnings: List[str] = []
    confidence = 100

    # Ensure root structure
    data = dict(raw_data) if isinstance(raw_data, dict) else {}

    # 1. Full Name Validation
    full_name = data.get("full_name")
    if full_name and isinstance(full_name, str):
        full_name = full_name.strip()
        # Check against PDF binary / header patterns
        is_binary_garbage = any(re.search(pat, full_name, re.IGNORECASE) for pat in PDF_BINARY_BLACKLIST)
        if is_binary_garbage:
            warnings.append(f"Rejected invalid full_name '{full_name}' matching PDF binary or metadata header.")
            full_name = None
            confidence -= 20
        elif full_name.lower() in FORBIDDEN_DEMO_NAMES:
            warnings.append(f"Rejected demo placeholder name '{full_name}'.")
            full_name = None
            confidence -= 20
        elif len(full_name) > 60 or len(full_name) < 2:
            warnings.append(f"Rejected full_name '{full_name}' due to invalid character length.")
            full_name = None
            confidence -= 15
        elif re.search(r'[0-9;!@#$%^*_+={}[\]|\\<>]', full_name):
            warnings.append(f"Rejected full_name '{full_name}' containing invalid punctuation or digits.")
            full_name = None
            confidence -= 15
    else:
        full_name = None

    if not full_name:
        warnings.append("Full Name was not detected in document. Please enter manually.")
        confidence -= 10

    # 2. Email Validation
    email = data.get("email")
    if email and isinstance(email, str):
        email = email.strip()
        if not EMAIL_REGEX.match(email) or 'example.com' in email or 'applicant@university.edu' in email:
            warnings.append(f"Rejected invalid or demo email address '{email}'.")
            email = None
            confidence -= 10
    else:
        email = None

    # 3. Phone Validation
    phone = data.get("phone")
    if phone and isinstance(phone, str):
        phone = phone.strip()
        digits = re.sub(r'\D', '', phone)
        if len(digits) < 7 or len(digits) > 15 or not PHONE_REGEX.match(phone):
            warnings.append(f"Rejected malformed phone number '{phone}'.")
            phone = None
    else:
        phone = None

    # 4. Location Validation
    location = data.get("location")
    if location and isinstance(location, str):
        location = location.strip()
        if any(re.search(pat, location, re.IGNORECASE) for pat in PDF_BINARY_BLACKLIST) or len(location) > 80:
            location = None
    else:
        location = None

    # 5. Target Role
    target_role = data.get("target_role")
    if target_role and isinstance(target_role, str):
        target_role = target_role.strip()
        if any(re.search(pat, target_role, re.IGNORECASE) for pat in PDF_BINARY_BLACKLIST) or len(target_role) > 80:
            target_role = None
    else:
        target_role = None

    # 6. Education Validation
    raw_education = data.get("education") or []
    cleaned_education = []
    if isinstance(raw_education, list):
        for edu in raw_education:
            if isinstance(edu, dict):
                inst = (edu.get("institution") or "").strip()
                # Ensure institution doesn't contain binary artifacts
                if any(re.search(pat, inst, re.IGNORECASE) for pat in PDF_BINARY_BLACKLIST):
                    continue
                deg = (edu.get("degree") or "").strip()
                field = (edu.get("field_of_study") or "").strip()
                start = (edu.get("start_date") or "").strip()
                end = (edu.get("end_date") or "").strip()
                gpa = (edu.get("gpa") or "").strip()

                if inst or deg or field:
                    cleaned_education.append({
                        "institution": inst or None,
                        "degree": deg or None,
                        "field_of_study": field or None,
                        "start_date": start or None,
                        "end_date": end or None,
                        "gpa": gpa or None
                    })

    # 7. Skills Validation
    raw_skills = data.get("skills") or []
    cleaned_skills = []
    if isinstance(raw_skills, list):
        for s in raw_skills:
            if isinstance(s, str):
                s_clean = s.strip()
                if s_clean and len(s_clean) <= 40 and not any(re.search(pat, s_clean, re.IGNORECASE) for pat in PDF_BINARY_BLACKLIST):
                    if s_clean not in cleaned_skills:
                        cleaned_skills.append(s_clean)

    # 8. Experience Validation
    raw_experience = data.get("experience") or []
    cleaned_experience = []
    if isinstance(raw_experience, list):
        for exp in raw_experience:
            if isinstance(exp, dict):
                comp = (exp.get("company") or "").strip()
                role = (exp.get("role") or "").strip()
                loc = (exp.get("location") or "").strip()
                start = (exp.get("start_date") or "").strip()
                end = (exp.get("end_date") or "").strip()
                raw_bullets = exp.get("bullets") or []
                cleaned_bullets = [b.strip() for b in raw_bullets if isinstance(b, str) and b.strip()]

                if comp or role or cleaned_bullets:
                    cleaned_experience.append({
                        "company": comp or None,
                        "role": role or None,
                        "location": loc or None,
                        "start_date": start or None,
                        "end_date": end or None,
                        "bullets": cleaned_bullets
                    })

    # 9. Projects Validation
    raw_projects = data.get("projects") or []
    cleaned_projects = []
    if isinstance(raw_projects, list):
        for proj in raw_projects:
            if isinstance(proj, dict):
                title = (proj.get("title") or "").strip()
                desc = (proj.get("description") or "").strip()
                raw_tech = proj.get("tech_stack") or []
                cleaned_tech = [t.strip() for t in raw_tech if isinstance(t, str) and t.strip()]
                raw_bullets = proj.get("bullets") or []
                cleaned_bullets = [b.strip() for b in raw_bullets if isinstance(b, str) and b.strip()]

                if title or desc or cleaned_bullets:
                    cleaned_projects.append({
                        "title": title or None,
                        "tech_stack": cleaned_tech,
                        "description": desc or None,
                        "bullets": cleaned_bullets
                    })

    # 10. Certifications Validation
    raw_certs = data.get("certifications") or []
    cleaned_certs = []
    if isinstance(raw_certs, list):
        for c in raw_certs:
            if isinstance(c, dict):
                name = (c.get("name") or "").strip()
                issuer = (c.get("issuer") or "").strip()
                issue_date = (c.get("issue_date") or "").strip()
                if name or issuer:
                    cleaned_certs.append({
                        "name": name or None,
                        "issuer": issuer or None,
                        "issue_date": issue_date or None
                    })

    cleaned_schema = {
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "location": location,
        "target_role": target_role,
        "education": cleaned_education,
        "skills": cleaned_skills,
        "experience": cleaned_experience,
        "projects": cleaned_projects,
        "certifications": cleaned_certs
    }

    confidence = max(10, min(100, confidence))
    return cleaned_schema, warnings, confidence
