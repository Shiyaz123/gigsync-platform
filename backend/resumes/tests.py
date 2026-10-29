import io
import pymupdf
from docx import Document
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from .document_parser import extract_text_from_pdf, extract_text_from_docx, parse_document
from .validator import validate_extracted_resume
from .models import CandidateProfileModel

class ResumePipelineTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def create_sample_pdf(self, text_content: str) -> bytes:
        """Helper to create a valid binary PDF document using PyMuPDF."""
        doc = pymupdf.open()
        page = doc.new_page()
        page.insert_text((50, 72), text_content, fontsize=11)
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes

    def create_sample_docx(self, paragraphs: list[str]) -> bytes:
        """Helper to create a valid binary DOCX document using python-docx."""
        doc = Document()
        for p in paragraphs:
            doc.add_paragraph(p)
        stream = io.BytesIO()
        doc.save(stream)
        return stream.getvalue()

    def test_pdf_extraction_page_by_page(self):
        """Verify PyMuPDF extracts text correctly page-by-page without binary headers."""
        resume_text = (
            "Elena Rostova\n"
            "elena.rostova@caltech.edu | (626) 395-6811 | Pasadena, CA\n\n"
            "EDUCATION\n"
            "California Institute of Technology\n"
            "Master of Science in Computational Neural Systems, 2022 - 2025\n\n"
            "SKILLS\n"
            "Python, PyTorch, C++, CUDA, Linux, Git, Docker\n\n"
            "EXPERIENCE\n"
            "Caltech Neurotechnology Lab (Jun 2024 - Dec 2024)\n"
            "Graduate AI Researcher\n"
            "- Designed spiked neural network simulations in PyTorch."
        )
        pdf_bytes = self.create_sample_pdf(resume_text)
        self.assertTrue(pdf_bytes.startswith(b'%PDF-'), "PDF must have binary magic header")

        extracted_text, is_scanned, warnings = extract_text_from_pdf(pdf_bytes)
        self.assertFalse(is_scanned)
        self.assertIn("Elena Rostova", extracted_text)
        self.assertIn("California Institute of Technology", extracted_text)
        self.assertIn("PyTorch", extracted_text)
        # Ensure %PDF is NEVER in extracted text
        self.assertNotIn("%PDF", extracted_text)

    def test_pdf_resume_dr_maya_lin(self):
        """Test PDF Resume 1: Dr. Maya Lin (Robotics and Computer Vision)."""
        resume_text = (
            "Dr. Maya Lin\n"
            "maya.lin@robotics.cmu.edu | (412) 268-2000 | Pittsburgh, PA\n\n"
            "PROFESSIONAL TITLE\n"
            "Robotics Systems Engineer\n\n"
            "EDUCATION\n"
            "Carnegie Mellon University\n"
            "Ph.D. in Robotics, 2019 - 2024\n\n"
            "SKILLS\n"
            "Python, C++, ROS, PyTorch, OpenCV, Linux, Git, Docker\n\n"
            "PROJECTS\n"
            "Autonomous Quadruped Navigation\n"
            "- Built visual SLAM system using OpenCV and PyTorch."
        )
        pdf_bytes = self.create_sample_pdf(resume_text)
        upload_file = SimpleUploadedFile("dr_maya_lin_resume.pdf", pdf_bytes, content_type="application/pdf")

        res = self.client.post('/api/parser/upload/', {'resume': upload_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data
        self.assertTrue(data["success"])
        p = data["extracted_profile"]

        self.assertEqual(p["full_name"], "Dr. Maya Lin")
        self.assertEqual(p["email"], "maya.lin@robotics.cmu.edu")
        self.assertEqual(p["phone"], "(412) 268-2000")
        self.assertIn("Pittsburgh", p["location"])
        self.assertIn("Carnegie Mellon University", p["education"][0]["institution"])
        self.assertIn("Python", p["skills"])
        self.assertIn("OpenCV", p["skills"])
        self.assertIn("ROS", p["skills"])
        self.assertFalse("%PDF" in str(p))

    def test_pdf_resume_priya_sharma(self):
        """Test PDF Resume 2: Priya Sharma (Full-Stack Engineer)."""
        resume_text = (
            "Priya Sharma\n"
            "priya.sharma@alumni.stanford.edu | (650) 723-2300 | San Francisco, CA\n\n"
            "TARGET ROLE\n"
            "Full-Stack Developer\n\n"
            "EDUCATION\n"
            "Stanford University\n"
            "Bachelor of Science in Computer Science, 2020 - 2024\n\n"
            "SKILLS\n"
            "React, TypeScript, Node.js, Python, PostgreSQL, AWS, Docker, Git\n\n"
            "EXPERIENCE\n"
            "Stripe (Jun 2023 - Sep 2023)\n"
            "Software Engineer Intern\n"
            "- Designed merchant onboarding flows with React and TypeScript."
        )
        pdf_bytes = self.create_sample_pdf(resume_text)
        upload_file = SimpleUploadedFile("priya_sharma_resume.pdf", pdf_bytes, content_type="application/pdf")

        res = self.client.post('/api/parser/upload/', {'resume': upload_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data
        p = data["extracted_profile"]

        self.assertEqual(p["full_name"], "Priya Sharma")
        self.assertEqual(p["email"], "priya.sharma@alumni.stanford.edu")
        self.assertIn("San Francisco", p["location"])
        self.assertIn("Stanford University", p["education"][0]["institution"])
        self.assertIn("React", p["skills"])
        self.assertIn("TypeScript", p["skills"])
        self.assertIn("AWS", p["skills"])
        self.assertFalse("%PDF" in str(p))

    def test_docx_resume_aris_thorne(self):
        """Test DOCX Resume: Dr. Aris Thorne with python-docx extraction."""
        paragraphs = [
            "Dr. Aris Thorne",
            "aris.thorne@mit.edu | (617) 253-1000 | Boston, MA",
            "TARGET ROLE",
            "Systems Engineer",
            "EDUCATION",
            "Massachusetts Institute of Technology",
            "Master of Science in Mechanical and Systems Engineering, 2021 - 2024",
            "SKILLS",
            "C++, Python, Linux, Docker, ROS, Kubernetes, Git",
            "EXPERIENCE",
            "Boston Dynamics (Jun 2023 - Dec 2023)",
            "Robotics Systems Intern",
            "- Implemented real-time telemetry streaming in C++ and ROS."
        ]
        docx_bytes = self.create_sample_docx(paragraphs)
        upload_file = SimpleUploadedFile("aris_thorne_resume.docx", docx_bytes, content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

        res = self.client.post('/api/parser/upload/', {'resume': upload_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data
        p = data["extracted_profile"]

        self.assertEqual(p["full_name"], "Dr. Aris Thorne")
        self.assertEqual(p["email"], "aris.thorne@mit.edu")
        self.assertIn("Boston", p["location"])
        self.assertIn("Massachusetts Institute of Technology", p["education"][0]["institution"])
        self.assertIn("C++", p["skills"])
        self.assertIn("ROS", p["skills"])

    def test_validator_rejects_pdf_header_as_name(self):
        """CRITICAL: Ensure validator strictly rejects '%PDF-1.5' or PDF metadata as a person's name."""
        malformed_extraction = {
            "full_name": "%PDF-1.5",
            "email": "applicant@test.edu",
            "phone": "+1 555-123-4567",
            "location": "Pasadena, CA",
            "education": [],
            "skills": ["Python"]
        }
        cleaned, warnings, confidence = validate_extracted_resume(malformed_extraction)
        self.assertIsNone(cleaned["full_name"], "Validator MUST reject '%PDF-1.5' as candidate full name")
        self.assertTrue(any("%PDF" in w for w in warnings))

    def test_missing_fields_never_substitute_demo_data(self):
        """Ensure missing fields remain None or empty list without demo substitutions."""
        sparse_text = (
            "Lucas Sterling\n"
            "lucas.sterling@domain.org\n\n"
            "SKILLS\n"
            "Python, SQL"
        )
        pdf_bytes = self.create_sample_pdf(sparse_text)
        upload_file = SimpleUploadedFile("sparse_resume.pdf", pdf_bytes, content_type="application/pdf")

        res = self.client.post('/api/parser/upload/', {'resume': upload_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        p = res.data["extracted_profile"]

        self.assertEqual(p["full_name"], "Lucas Sterling")
        self.assertEqual(p["email"], "lucas.sterling@domain.org")
        self.assertIsNone(p["phone"], "Missing phone must be None, never substituted with demo phone")
        self.assertIsNone(p["location"], "Missing location must be None, never substituted with demo location")
        self.assertEqual(p["education"], [], "Missing education must be empty list, never Alex Morgan's university")
        self.assertEqual(p["experience"], [], "Missing experience must be empty list")
        self.assertEqual(p["certifications"], [], "Missing certifications must be empty list")

    def test_scanned_pdf_detection(self):
        """Verify scanned or empty-text PDF is properly flagged."""
        doc = pymupdf.open()
        doc.new_page()  # Page without text content
        empty_pdf_bytes = doc.tobytes()
        doc.close()

        extracted_text, is_scanned, warnings = extract_text_from_pdf(empty_pdf_bytes)
        self.assertTrue(is_scanned, "Document with zero text characters must be detected as scanned")
        self.assertTrue(any("scanned" in w.lower() for w in warnings))

    def test_corrupted_pdf_rejection(self):
        """Verify corrupted binary file is safely rejected with informative error message."""
        corrupted_bytes = b"Not a valid PDF at all"
        upload_file = SimpleUploadedFile("corrupted.pdf", corrupted_bytes, content_type="application/pdf")

        res = self.client.post('/api/parser/upload/', {'resume': upload_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res.data)

    def test_profile_confirm_and_db_save(self):
        """Test saving verified profile to database models."""
        payload = {
            "full_name": "Kiran Patel",
            "email": "kiran.patel@utexas.edu",
            "phone": "(512) 471-3434",
            "location": "Austin, TX",
            "target_role": "Cloud Infrastructure Engineer",
            "skills": ["Go", "Kubernetes", "Docker", "AWS"],
            "education": [{
                "institution": "University of Texas at Austin",
                "degree": "Master of Science",
                "field_of_study": "Computer Science",
                "end_date": "2025"
            }],
            "experience": [{
                "company": "Dell Technologies",
                "role": "Cloud Infrastructure Intern",
                "start_date": "Jun 2024",
                "end_date": "Aug 2024",
                "bullets": ["Automated Kubernetes cluster orchestration in Go."]
            }]
        }
        res = self.client.post('/api/profile/confirm/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CandidateProfileModel.objects.filter(full_name="Kiran Patel").exists())
        saved = CandidateProfileModel.objects.get(full_name="Kiran Patel")
        self.assertEqual(saved.education.count(), 1)
        self.assertEqual(saved.experience.count(), 1)

    def test_job_match_api_view(self):
        """Test the job matching API view calculates scores truthfully."""
        payload = {
            "profile": {
                "skills": ["Python", "SQL", "Docker", "Git"]
            },
            "job": {
                "title": "Backend Python Engineer",
                "essential_skills": ["Python", "SQL", "Docker", "Kubernetes"]
            }
        }
        res = self.client.post('/api/match/calculate/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data
        self.assertEqual(data["overall_score"], 75)
        self.assertIn("python", data["matched_skills"])
        self.assertIn("kubernetes", data["missing_skills"])
