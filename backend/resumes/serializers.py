from rest_framework import serializers
from .models import (
    CandidateProfileModel,
    EducationModel,
    ExperienceModel,
    ProjectModel,
    CertificationModel
)

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationModel
        fields = ['id', 'institution', 'degree', 'field_of_study', 'start_date', 'end_date', 'gpa']

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceModel
        fields = ['id', 'company', 'role', 'location', 'start_date', 'end_date', 'bullets']

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectModel
        fields = ['id', 'title', 'tech_stack', 'description', 'bullets']

class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificationModel
        fields = ['id', 'name', 'issuer', 'issue_date']

class CandidateProfileSerializer(serializers.ModelSerializer):
    education = EducationSerializer(many=True, required=False)
    experience = ExperienceSerializer(many=True, required=False)
    projects = ProjectSerializer(many=True, required=False)
    certifications = CertificationSerializer(many=True, required=False)

    class Meta:
        model = CandidateProfileModel
        fields = [
            'id', 'session_id', 'full_name', 'email', 'phone', 'location',
            'target_role', 'skills', 'education', 'experience', 'projects',
            'certifications', 'confirmed_facts_only', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        education_data = validated_data.pop('education', [])
        experience_data = validated_data.pop('experience', [])
        projects_data = validated_data.pop('projects', [])
        certs_data = validated_data.pop('certifications', [])

        profile = CandidateProfileModel.objects.create(**validated_data)

        for edu in education_data:
            EducationModel.objects.create(profile=profile, **edu)
        for exp in experience_data:
            ExperienceModel.objects.create(profile=profile, **exp)
        for proj in projects_data:
            ProjectModel.objects.create(profile=profile, **proj)
        for cert in certs_data:
            CertificationModel.objects.create(profile=profile, **cert)

        return profile
