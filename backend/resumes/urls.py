from django.urls import path
from .views import ResumeUploadAPIView, ProfileConfirmAPIView, JobMatchAPIView

urlpatterns = [
    path('parser/upload/', ResumeUploadAPIView.as_view(), name='resume-upload'),
    path('parser/upload', ResumeUploadAPIView.as_view(), name='resume-upload-no-slash'),
    path('profile/confirm/', ProfileConfirmAPIView.as_view(), name='profile-confirm'),
    path('profile/confirm', ProfileConfirmAPIView.as_view(), name='profile-confirm-no-slash'),
    path('match/calculate/', JobMatchAPIView.as_view(), name='job-match-calculate'),
]
