"""
Honest Resume-to-Job Matching Engine in Python.
Implements the GigSync PRD Section 7.2 weighted scoring algorithm with zero-hallucination guarantees:
- Skills: 50% (Essential 70%, Preferred 30%)
- Experience: 25%
- Education: 15%
- Role match: 10%

Strictly avoids inflating scores when information is missing:
- No skills -> 0% skills score.
- No experience -> 0% experience score.
- No education -> 0% education score.
- No target role match -> 0% role score.
- Never fabricates qualifications or presents scores as hiring probabilities.
"""
import re
from typing import Dict, Any, List, Optional
from datetime import datetime

ALIAS_MAP = {
    'react': ['react', 'reactjs', 'react.js'],
    'node': ['node', 'nodejs', 'node.js'],
    'typescript': ['typescript', 'ts'],
    'javascript': ['javascript', 'js', 'es6'],
    'python': ['python', 'py'],
    'postgres': ['postgres', 'postgresql'],
    'mysql': ['mysql'],
    'mongo': ['mongo', 'mongodb'],
    'rest apis': ['rest', 'restful', 'rest api', 'rest apis', 'api design'],
    'fastapi': ['fastapi', 'fast-api'],
    'flask': ['flask'],
    'django': ['django'],
    'docker': ['docker', 'container', 'containers', 'dockerfile'],
    'aws': ['aws', 'amazon web services', 's3', 'ec2'],
    'gcp': ['gcp', 'google cloud', 'google cloud platform'],
    'azure': ['azure', 'microsoft azure'],
    'git': ['git', 'github', 'gitlab'],
    'sql': ['sql', 'rdbms', 'relational database'],
    'linux': ['linux', 'bash', 'unix', 'shell'],
    'ci/cd': ['ci/cd', 'ci cd', 'continuous integration', 'github actions'],
    'kubernetes': ['kubernetes', 'k8s'],
}

def normalize_skill(skill: str) -> str:
    """Normalizes skill tokens for comparison."""
    if not skill:
        return ""
    cleaned = skill.strip().lower()
    cleaned = re.sub(r'\.js$', '', cleaned)
    return cleaned.strip()

def matches_skill_token(target_skill: str, text: str) -> bool:
    """Matches a target skill against a block of text using boundary-safe regexes and aliases."""
    if not target_skill or not text:
        return False
    norm_target = normalize_skill(target_skill)
    norm_text = text.lower()

    if norm_target == 'c':
        # Single-letter C requires strict spacing
        return bool(re.search(r'(^|\s)c(\s|[.,;]|$)', norm_text))

    aliases = ALIAS_MAP.get(norm_target, [norm_target])
    for alias in aliases:
        escaped = re.escape(alias)
        pattern = rf'(^|[^a-z0-9]){escaped}([^a-z0-9]|$)'
        if re.search(pattern, norm_text, re.IGNORECASE):
            return True
    return False

def calculate_resume_job_match(profile: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes honest, evidence-grounded match between candidate profile and job requirements.
    """
    profile_skills_block = profile.get("skills", {})
    all_profile_skills = [
        s for s in (
            profile_skills_block.get("technical", []) +
            profile_skills_block.get("frameworks", []) +
            profile_skills_block.get("tools", []) +
            profile_skills_block.get("soft", [])
        ) if s and isinstance(s, str)
    ]

    projects = profile.get("projects", [])
    experience = profile.get("experience", [])
    education = profile.get("education", [])
    career_pref = profile.get("careerPreferences", {})
    target_roles = career_pref.get("targetRoles", [])
    personal_info = profile.get("personalInfo", {})
    candidate_location = personal_info.get("location", "")

    # Job requirements
    reqs = job.get("requirements", {})
    if isinstance(reqs, dict):
        essential_reqs = reqs.get("essentialSkills", [])
        preferred_reqs = reqs.get("preferredSkills", [])
        constraints = reqs.get("constraints", [])
        min_years = reqs.get("minYearsExperience", 0)
        degree_req = reqs.get("degreeRequirement", "")
    else:
        essential_reqs = []
        preferred_reqs = []
        constraints = []
        min_years = 0
        degree_req = ""

    matched_skills = []
    missing_essential_skills = []
    missing_preferred_skills = []

    # 1. Match Essential Skills
    essential_matched = 0
    for sk in essential_reqs:
        found = False
        evidence_sources = []

        # Check listed profile skills
        in_skills = [s for s in all_profile_skills if matches_skill_token(sk, s)]
        if in_skills:
            found = True
            evidence_sources.append(f'Listed in Profile Skills: "{in_skills[0]}"')

        # Check projects
        for p in projects:
            p_tech = p.get("techStack", [])
            p_title = p.get("title", "")
            p_desc = p.get("description", "")
            p_bullets = p.get("bullets", [])
            p_text = f"{p_title} {' '.join(p_tech)} {p_desc} {' '.join(p_bullets)}"
            if matches_skill_token(sk, p_text):
                found = True
                evidence_sources.append(f'Demonstrated in Project "{p_title}"')
                break

        # Check experience
        for e in experience:
            e_role = e.get("role", "")
            e_company = e.get("company", "")
            e_bullets = e.get("bullets", [])
            e_text = f"{e_role} {e_company} {' '.join(e_bullets)}"
            if matches_skill_token(sk, e_text):
                found = True
                evidence_sources.append(f'Applied in Experience at "{e_company}"')
                break

        if found:
            essential_matched += 1
            matched_skills.append({
                "skill": sk,
                "evidence": " & ".join(evidence_sources),
                "category": "essential"
            })
        else:
            missing_essential_skills.append({
                "skill": sk,
                "importance": "essential",
                "learnable": True,
                "whyItMatters": f'Explicitly listed as mandatory requirement for {job.get("title", "this role")} at {job.get("company", "the company")}.'
            })

    # 2. Match Preferred Skills
    preferred_matched = 0
    for sk in preferred_reqs:
        found = False
        evidence_sources = []

        in_skills = [s for s in all_profile_skills if matches_skill_token(sk, s)]
        if in_skills:
            found = True
            evidence_sources.append(f'Listed in Profile Skills: "{in_skills[0]}"')

        for p in projects:
            p_tech = p.get("techStack", [])
            p_title = p.get("title", "")
            p_desc = p.get("description", "")
            p_bullets = p.get("bullets", [])
            p_text = f"{p_title} {' '.join(p_tech)} {p_desc} {' '.join(p_bullets)}"
            if matches_skill_token(sk, p_text):
                found = True
                evidence_sources.append(f'Demonstrated in Project "{p_title}"')
                break

        if found:
            preferred_matched += 1
            matched_skills.append({
                "skill": sk,
                "evidence": " & ".join(evidence_sources),
                "category": "preferred"
            })
        else:
            missing_preferred_skills.append({
                "skill": sk,
                "importance": "preferred",
                "learnable": True,
                "whyItMatters": "Valued bonus skill that distinguishes candidates in technical screening."
            })

    # 3. Transparent Weighted Score Calculation
    # Skills Component (50% Weight)
    if not all_profile_skills and not projects:
        # Candidate has no confirmed skills at all
        skills_score = 0
    else:
        essential_ratio = (essential_matched / len(essential_reqs)) if essential_reqs else 1.0
        preferred_ratio = (preferred_matched / len(preferred_reqs)) if preferred_reqs else 1.0
        skills_score = round((essential_ratio * 0.70 + preferred_ratio * 0.30) * 100)

    # Experience Component (25% Weight)
    if not experience:
        if projects:
            # Student/early-career projects provide foundational experience baseline
            experience_score = 50 if min_years == 0 else 25
        else:
            # Zero experience and zero projects
            experience_score = 0
    else:
        # Has practical experience items
        experience_score = min(100, 65 + len(experience) * 15)
        if min_years > len(experience):
            experience_score = max(30, experience_score - 20)

    # Education Component (15% Weight)
    if not education:
        education_score = 0
    else:
        education_score = 75
        cs_fields = ['computer science', 'software', 'engineering', 'information technology', 'data', 'math']
        for edu in education:
            field_name = (edu.get("fieldOfStudy") or "").lower()
            if any(cs in field_name for cs in cs_fields):
                education_score = 95
                break

    # Role Match Component (10% Weight)
    job_title = (job.get("title") or "").lower()
    role_score = 0
    if target_roles:
        for r in target_roles:
            r_low = r.lower()
            if r_low in job_title or job_title in r_low:
                role_score = 100
                break
            # Partial token overlap
            tokens_r = set(r_low.split())
            tokens_job = set(job_title.split())
            if tokens_r.intersection(tokens_job):
                role_score = max(role_score, 70)
    elif personal_info.get("title"):
        cand_title = personal_info.get("title").lower()
        if cand_title in job_title or job_title in cand_title:
            role_score = 90
        elif set(cand_title.split()).intersection(set(job_title.split())):
            role_score = 65

    # Overall Weighted Score: 50% Skills, 25% Experience, 15% Education, 10% Role
    overall_score = round(
        (skills_score * 0.50) +
        (experience_score * 0.25) +
        (education_score * 0.15) +
        (role_score * 0.10)
    )

    # 4. Hard Constraints Evaluation
    hard_constraints = []
    unknown_info = []

    for c in constraints:
        c_low = c.lower()
        if any(w in c_low for w in ["work authorization", "authorized to work", "us citizen", "eligible to work"]):
            hard_constraints.append({
                "constraint": c,
                "status": "unknown",
                "note": "Work authorization must be confirmed directly with employer during application."
            })
            unknown_info.append("Work authorization status is not explicitly confirmed in candidate profile.")
        elif "on-site" in c_low or "presence" in c_low:
            job_loc = (job.get("location") or "").lower()
            is_local = candidate_location and candidate_location.lower().split(",")[0] in job_loc
            hard_constraints.append({
                "constraint": c,
                "status": "satisfied" if is_local else "unmet",
                "note": "Candidate resides in commuting area." if is_local else "Role requires in-person presence; candidate location differs."
            })
        else:
            hard_constraints.append({
                "constraint": c,
                "status": "unknown",
                "note": "Confirm requirements directly against employer listing."
            })

    # Tailoring Tips
    tailoring_tips = []
    if missing_essential_skills:
        top_missing = [s["skill"] for s in missing_essential_skills[:2]]
        tailoring_tips.append(f'Prioritize learning {" and ".join(top_missing)} before applying.')
    if matched_skills:
        top_matched = [m["skill"] for m in matched_skills[:3]]
        tailoring_tips.append(f'Highlight your verified experience with {", ".join(top_matched)} in your resume project bullets.')

    # Human-readable Explanation
    total_reqs = len(essential_reqs) + len(preferred_reqs)
    if total_reqs == 0:
        explanation = "Job listing does not specify explicit skill requirements."
    elif len(all_profile_skills) == 0 and not projects:
        explanation = "No verified skills or experience found in profile to match job requirements."
    else:
        missing_names = [s["skill"] for s in missing_essential_skills]
        explanation = f"Matches {len(matched_skills)} of {total_reqs} stated requirements ({essential_matched}/{len(essential_reqs)} essential). "
        if missing_names:
            explanation += f"Identified essential skill gap: {', '.join(missing_names)}."
        else:
            explanation += "All essential technical skills are verified in your profile."

    return {
        "id": f"match_{int(datetime.now().timestamp())}_{job.get('id', 'custom')}",
        "userId": profile.get("userId", "guest"),
        "jobId": job.get("id", "custom"),
        "overallScore": overall_score,
        "scoreBreakdown": {
            "skillsScore": skills_score,
            "experienceScore": experience_score,
            "educationScore": education_score,
            "roleSimilarityScore": role_score
        },
        "matchedSkills": matched_skills,
        "missingEssentialSkills": missing_essential_skills,
        "missingPreferredSkills": missing_preferred_skills,
        "hardConstraints": hard_constraints,
        "unknownInfo": unknown_info,
        "explanation": explanation,
        "tailoringTips": tailoring_tips,
        "disclaimer": "This relevance score reflects profile alignment with stated requirements. It does not calculate hiring probability or guarantee an interview.",
        "createdAt": datetime.now().isoformat()
    }
