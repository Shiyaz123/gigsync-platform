from django.db import models
from django.contrib.auth.models import User

class CandidateProfileModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='candidate_profiles')
    session_id = models.CharField(max_length=100, blank=True, default='session_default')
    full_name = models.CharField(max_length=255, blank=True, default='')
    email = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    target_role = models.CharField(max_length=255, blank=True, default='')
    skills = models.JSONField(default=list)
    raw_text = models.TextField(blank=True, default='')
    confirmed_facts_only = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.full_name or 'Anonymous'} ({self.target_role or 'No Role'})"

class EducationModel(models.Model):
    profile = models.ForeignKey(CandidateProfileModel, related_name='education', on_delete=models.CASCADE)
    institution = models.CharField(max_length=255, blank=True, default='')
    degree = models.CharField(max_length=255, blank=True, default='')
    field_of_study = models.CharField(max_length=255, blank=True, default='')
    start_date = models.CharField(max_length=50, blank=True, default='')
    end_date = models.CharField(max_length=50, blank=True, default='')
    gpa = models.CharField(max_length=50, null=True, blank=True)

class ExperienceModel(models.Model):
    profile = models.ForeignKey(CandidateProfileModel, related_name='experience', on_delete=models.CASCADE)
    company = models.CharField(max_length=255, blank=True, default='')
    role = models.CharField(max_length=255, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    start_date = models.CharField(max_length=50, blank=True, default='')
    end_date = models.CharField(max_length=50, blank=True, default='')
    bullets = models.JSONField(default=list)

class ProjectModel(models.Model):
    profile = models.ForeignKey(CandidateProfileModel, related_name='projects', on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True, default='')
    tech_stack = models.JSONField(default=list)
    description = models.TextField(blank=True, default='')
    bullets = models.JSONField(default=list)

class CertificationModel(models.Model):
    profile = models.ForeignKey(CandidateProfileModel, related_name='certifications', on_delete=models.CASCADE)
    name = models.CharField(max_length=255, blank=True, default='')
    issuer = models.CharField(max_length=255, blank=True, default='')
    issue_date = models.CharField(max_length=50, blank=True, default='')
