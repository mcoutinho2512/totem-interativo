"""
Content Utils - Image processing and file handling utilities
"""
import os
import uuid
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile


# Maximum file size in bytes (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed image types
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
ALLOWED_MEDIA_TYPES = ALLOWED_IMAGE_TYPES + ALLOWED_VIDEO_TYPES

# Thumbnail sizes
THUMBNAIL_SIZES = {
    'small': (150, 150),
    'medium': (400, 400),
    'large': (800, 800),
}

# Resolution presets for different uses
RESOLUTION_PRESETS = {
    'thumbnail': (150, 150),
    'preview': (400, 300),
    'standard': (1280, 720),
    'fullhd': (1920, 1080),
    'totem': (1080, 1920),  # Portrait orientation for totems
}


def validate_file_size(file):
    """Validate file size is within limit"""
    if file.size > MAX_FILE_SIZE:
        return False, f'Arquivo muito grande. Máximo permitido: {MAX_FILE_SIZE // (1024 * 1024)}MB'
    return True, None


def validate_file_type(file, allowed_types=None):
    """Validate file type is allowed"""
    if allowed_types is None:
        allowed_types = ALLOWED_MEDIA_TYPES

    content_type = file.content_type
    if content_type not in allowed_types:
        return False, f'Tipo de arquivo não permitido: {content_type}'
    return True, None


def generate_unique_filename(filename):
    """Generate a unique filename to prevent collisions"""
    ext = os.path.splitext(filename)[1].lower()
    unique_id = uuid.uuid4().hex[:12]
    return f'{unique_id}{ext}'


def resize_image(image_file, max_size, quality=85):
    """
    Resize an image to fit within max_size while maintaining aspect ratio

    Args:
        image_file: Django uploaded file or file-like object
        max_size: Tuple of (max_width, max_height)
        quality: JPEG quality (1-100)

    Returns:
        InMemoryUploadedFile with resized image
    """
    img = Image.open(image_file)

    # Convert to RGB if necessary (for PNG with transparency)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')

    # Calculate new size maintaining aspect ratio
    img.thumbnail(max_size, Image.Resampling.LANCZOS)

    # Save to buffer
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=quality, optimize=True)
    buffer.seek(0)

    # Get original filename and create new one
    if hasattr(image_file, 'name'):
        name = os.path.splitext(image_file.name)[0] + '.jpg'
    else:
        name = 'resized.jpg'

    return InMemoryUploadedFile(
        buffer,
        'ImageField',
        name,
        'image/jpeg',
        buffer.getbuffer().nbytes,
        None
    )


def create_thumbnail(image_file, size_name='medium'):
    """
    Create a thumbnail from an image

    Args:
        image_file: Django uploaded file or file-like object
        size_name: One of 'small', 'medium', 'large'

    Returns:
        InMemoryUploadedFile with thumbnail
    """
    size = THUMBNAIL_SIZES.get(size_name, THUMBNAIL_SIZES['medium'])
    return resize_image(image_file, size, quality=75)


def process_image_for_resolution(image_file, preset='standard'):
    """
    Process image for a specific resolution preset

    Args:
        image_file: Django uploaded file
        preset: Resolution preset name

    Returns:
        Dict with processed images at different resolutions
    """
    results = {}

    # Rewind file if needed
    if hasattr(image_file, 'seek'):
        image_file.seek(0)

    img = Image.open(image_file)
    original_size = img.size

    # Always create thumbnail
    image_file.seek(0)
    results['thumbnail'] = resize_image(image_file, RESOLUTION_PRESETS['thumbnail'], quality=70)

    # Create standard size
    image_file.seek(0)
    results['standard'] = resize_image(image_file, RESOLUTION_PRESETS['standard'], quality=85)

    # If image is large enough, create full HD
    if original_size[0] >= 1920 or original_size[1] >= 1080:
        image_file.seek(0)
        results['fullhd'] = resize_image(image_file, RESOLUTION_PRESETS['fullhd'], quality=90)

    return results


def get_image_dimensions(image_file):
    """Get dimensions of an image file"""
    try:
        image_file.seek(0)
        img = Image.open(image_file)
        return img.size
    except Exception:
        return None


def is_image(file):
    """Check if file is an image"""
    return file.content_type in ALLOWED_IMAGE_TYPES


def is_video(file):
    """Check if file is a video"""
    return file.content_type in ALLOWED_VIDEO_TYPES
