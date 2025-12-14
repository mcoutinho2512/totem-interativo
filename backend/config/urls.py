"""
URL Configuration for Sanaris City Totem
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API v1
    path('api/v1/core/', include('apps.core.urls')),
    path('api/v1/tenants/', include('apps.tenants.urls')),
    path('api/v1/totems/', include('apps.totems.urls')),
    path('api/v1/content/', include('apps.content.urls')),
    path('api/v1/navigation/', include('apps.navigation.urls')),
    path('api/v1/weather/', include('apps.weather.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/advertising/', include('apps.advertising.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Admin customization
admin.site.site_header = 'Sanaris City Totem'
admin.site.site_title = 'Sanaris Admin'
admin.site.index_title = 'Painel Administrativo'
