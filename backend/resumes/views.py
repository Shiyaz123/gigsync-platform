import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .document_parser import parse_document
from .gemini_extractor import extract_with_gemini
from .validator import validate_extracted_resume
from .models import (
    CandidateProfileModel,
    EducationModel,
    ExperienceModel,
    ProjectModel,
    CertificationModel
)
from .serializers import CandidateProfileSerializer

class ResumeUploadAPIView(APIView):
    """
    POST /api/parser/upload/
    Receives PDF, DOCX, or TXT file via multipart/form-data.
    Uses PyMuPDF / python-docx and the official Gemini API SDK to extract factual resume entities.
    Strictly prevents %PDF-1.5, binary headers, and demo values.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        upload_file = request.FILES.get('resume') or request.FILES.get('file')
        if not upload_file:
            return Response(
                {"error": "No resume file provided. Please upload a PDF, DOCX, or TXT document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        filename = upload_file.name
        file_size = upload_file.size
        MAX_SIZE = 10 * 1024 * 1024  # 10MB
        if file_size > MAX_SIZE:
            return Response(
                {"error": "File size exceeds 10MB limit."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Read binary bytes
        try:
            file_bytes = upload_file.read()
        except Exception as e:
            return Response(
                {"error": f"Failed to read uploaded file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Parse text using PyMuPDF / python-docx (NEVER decode raw PDF bytes directly)
        raw_text, is_scanned, parse_warnings = parse_document(file_bytes, filename)

        if not raw_text and not is_scanned:
            return Response(
                {"error": parse_warnings[0] if parse_warnings else "Could not extract text from document."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine MIME type for multimodal fallback
        mime_type = "application/pdf" if filename.lower().endswith(".pdf") else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        # 2. Extract with Gemini (or deterministic zero-hallucination fallback)
        extracted_data, is_gemini, gemini_note = extract_with_gemini(
            text=raw_text,
            file_bytes=file_bytes if is_scanned else None,
            mime_type=mime_type if is_scanned else None
        )

        # 3. Validate extracted schema (reject %PDF-1.5, sanitize phone/email/names)
        cleaned_profile, validation_warnings, confidence = validate_extracted_resume(
            extracted_data,
            raw_text=raw_text
        )

        all_warnings = parse_warnings + validation_warnings
        if gemini_note:
            all_warnings.append(gemini_note)

        # Format consistent response for frontend
        return Response({
            "success": True,
            "filename": filename,
            "file_size": file_size,
            "extracted_profile": cleaned_profile,
            "confidence_score": confidence,
            "warnings": all_warnings,
            "source_method": "gemini-3.5-flash-lite" if is_gemini else "pymupdf_python_parser"
        }, status=status.HTTP_200_OK)


class ProfileConfirmAPIView(APIView):
    """
    POST /api/profile/confirm/
    Persists confirmed candidate profile to PostgreSQL / Django models.
    """
    parser_classes = [JSONParser]

    def post(self, request, *args, **kwargs):
        data = request.data
        if not data:
            return Response({"error": "Profile data payload required."}, status=status.HTTP_400_BAD_REQUEST)

        full_name = (data.get('full_name') or data.get('personalInfo', {}).get('fullName') or '').strip()
        if not full_name:
            return Response({"error": "Candidate full name is required for profile confirmation."}, status=status.HTTP_400_BAD_REQUEST)

        # Extract normalized attributes
        email = data.get('email') or data.get('personalInfo', {}).get('email') or ''
        phone = data.get('phone') or data.get('personalInfo', {}).get('phone') or ''
        location = data.get('location') or data.get('personalInfo', {}).get('location') or ''
        target_role = data.get('target_role') or data.get('personalInfo', {}).get('title') or ''

        raw_skills = data.get('skills') or []
        if isinstance(raw_skills, dict):
            skills = raw_skills.get('technical', []) + raw_skills.get('frameworks', []) + raw_skills.get('tools', [])
        else:
            skills = list(raw_skills)

        # Save to database
        profile = CandidateProfileModel.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_id=request.headers.get('X-Session-ID', 'default_guest_session'),
            full_name=full_name,
            email=email,
            phone=phone,
            location=location,
            target_role=target_role,
            skills=skills,
            confirmed_facts_only=True
        )

        # Save Education
        education_items = data.get('education') or []
        for edu in education_items:
            EducationModel.objects.create(
                profile=profile,
                institution=edu.get('institution') or '',
                degree=edu.get('degree') or '',
                field_of_study=edu.get('field_of_study') or edu.get('fieldOfStudy') or '',
                start_date=edu.get('start_date') or edu.get('startDate') or '',
                end_date=edu.get('end_date') or edu.get('endDate') or '',
                gpa=edu.get('gpa')
            )

        # Save Experience
        experience_items = data.get('experience') or []
        for exp in experience_items:
            ExperienceModel.objects.create(
                profile=profile,
                company=exp.get('company') or '',
                role=exp.get('role') or '',
                location=exp.get('location') or '',
                start_date=exp.get('start_date') or exp.get('startDate') or '',
                end_date=exp.get('end_date') or exp.get('endDate') or '',
                bullets=exp.get('bullets') or []
            )

        # Save Projects
        project_items = data.get('projects') or []
        for proj in project_items:
            ProjectModel.objects.create(
                profile=profile,
                title=proj.get('title') or '',
                tech_stack=proj.get('tech_stack') or proj.get('techStack') or [],
                description=proj.get('description') or '',
                bullets=proj.get('bullets') or []
            )

        serializer = CandidateProfileSerializer(profile)
        return Response({
            "success": True,
            "message": "Candidate profile successfully verified and saved to database.",
            "profile": serializer.data
        }, status=status.HTTP_201_CREATED)


class JobMatchAPIView(APIView):
    """
    POST /api/match/calculate/
    Computes explainable match scores between confirmed profile and target job.
    """
    parser_classes = [JSONParser]

    def post(self, request, *args, **kwargs):
        profile_data = request.data.get('profile') or {}
        job_data = request.data.get('job') or {}

        candidate_skills = [s.lower() for s in (profile_data.get('skills') or [])]
        required_skills = [s.lower() for s in (job_data.get('essential_skills') or job_data.get('skills') or ['Python', 'SQL', 'Git'])]

        matched = [s for s in required_skills if s in candidate_skills]
        score = int((len(matched) / max(1, len(required_skills))) * 100) if required_skills else 70

        return Response({
            "overall_score": score,
            "matched_skills": matched,
            "missing_skills": [s for s in required_skills if s not in candidate_skills],
            "explanation": f"Matched {len(matched)} of {len(required_skills)} required technical qualifications."
        })
